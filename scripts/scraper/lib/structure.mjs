/**
 * Phase C orchestrator: raw_scrapes -> (LLM) -> pending_entries.
 *
 * - Reads unprocessed raw_scrapes (oldest first, optional source filter).
 * - Re-fetches PDF details when the stored row only has anchor text
 *   (full PDF text extraction; garbled legacy-Hindi fonts are flagged).
 * - Builds the Section 5 prompt per target_type, calls the LLM, validates
 *   the JSON, derives confidence_flags, inserts pending_entries as
 *   pending_review, and marks the raw row processed ONLY on success.
 * - Failures leave the raw row unprocessed so a later run can retry.
 *
 * Writes ONLY to pending_entries (+ processed flag on raw_scrapes).
 * NEVER touches jobs, admit_cards, results, answer_keys, yojana.
 */

import { USER_AGENT } from "./config.mjs";
import { htmlToCleanText } from "./text.mjs";
import { buildPrompt, flaggableFields, requiredFields } from "./prompts.mjs";
import { callLLM, cleanJsonResponse } from "./llm.mjs";

/** Cap on text sent to the LLM per row. */
const MAX_PROMPT_CHARS = 15000;
/** Marker Phase B stored when a detail target was a PDF. */
const PDF_MARKER = "[PDF detail";

const KIND_TO_TARGET = {
  advertisement: "job",
  notice: "job",
  apply_portal: "job",
  result: "result",
  admit_card: "admit_card",
};

export function kindToTargetType(kind) {
  return KIND_TO_TARGET[kind] ?? "job";
}

/** Split a stored raw_content into { meta, body }. */
export function splitRawContent(raw) {
  const meta = {};
  const lines = String(raw ?? "").split("\n");
  let bodyStart = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(SOURCE|URL|TITLE|DATE|KIND|CONTENT-TYPE|FETCHED_AT):\s*(.*)$/);
    if (m) {
      meta[m[1].toLowerCase().replace(/-/g, "_")] = m[2].trim();
      if (lines[i + 1] === "") bodyStart = i + 2;
    } else if (lines[i].trim() === "" && Object.keys(meta).length > 0) {
      bodyStart = i + 1;
      break;
    }
  }
  const body = lines
    .slice(bodyStart)
    .join("\n")
    .replace(/^FETCHED_AT:[^\n]*\n+/, "")
    .trim();
  return { meta, body };
}

/**
 * Heuristic: legacy (Kruti-Dev-style) Hindi font PDFs extract as Latin
 * gibberish with almost no Devanagari codepoints. Detect so the prompt
 * can tell the model the text is unreadable instead of hallucinating.
 */
export function looksGarbledHindi(text) {
  const t = String(text ?? "");
  if (t.length < 200) return false;
  const devanagari = (t.match(/[ऀ-ॿ]/g) || []).length;
  const ratio = devanagari / t.length;
  const krutiHints = ["fcgkj", "ljdkj", "foHkkx", "dsUnzh", "vkj{kh", "gksxk", "djus", "esa"].filter((w) =>
    t.includes(w),
  ).length;
  return ratio < 0.005 && (krutiHints >= 2 || /[A-Za-z]{12,}/.test(t));
}

/**
 * Full text for the LLM. Stored HTML rows already carry cleaned text;
 * PDF-marker rows are re-fetched (rate-limited) and parsed here.
 * Returns { text, garbled }.
 */
export async function getFullText(raw, { limiter, pdfParse, refetch = true }) {
  const { meta, body } = splitRawContent(raw.raw_content);
  if (!refetch && body.includes(PDF_MARKER)) {
    // Dry run: no network. Preview with stored anchor text, flagged unreadable.
    return { meta, text: body.slice(0, MAX_PROMPT_CHARS), garbled: true };
  }
  if (body.includes(PDF_MARKER) && meta.url) {
    await limiter.wait(new URL(meta.url).host);
    const res = await fetch(meta.url, {
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) throw new Error(`detail refetch HTTP ${res.status}`);
    const ct = res.headers.get("content-type") ?? "";
    if (/pdf/i.test(ct) || /\.pdf(\?|#|$)/i.test(meta.url)) {
      if (!pdfParse) throw new Error("PDF detail needs pdf-parse (unavailable)");
      const buf = Buffer.from(await res.arrayBuffer());
      const data = await pdfParse(buf);
      const text = String(data.text ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_PROMPT_CHARS);
      return { meta, text, garbled: looksGarbledHindi(text) };
    }
    const html = await res.text();
    return { meta, text: htmlToCleanText(html).slice(0, MAX_PROMPT_CHARS), garbled: false };
  }
  return { meta, text: body.slice(0, MAX_PROMPT_CHARS), garbled: false };
}

/** Validate parsed JSON; returns { ok, error?, flags }. */
export function validateStructured(targetType, obj, { garbled = false } = {}) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return { ok: false, error: "top-level JSON is not an object" };
  }
  for (const f of requiredFields()) {
    if (typeof obj[f] !== "string" || !obj[f].trim()) {
      return { ok: false, error: `required field "${f}" missing/empty` };
    }
  }
  const flags = {};
  for (const f of flaggableFields(targetType)) {
    if (obj[f] === null || obj[f] === undefined || obj[f] === "") flags[`missing_${f}`] = true;
  }
  if (garbled) flags.pdf_unreadable_text = true;
  return { ok: true, flags };
}

export async function structureOneRow(row, { store, limiter, pdfParse, llm, dryRun = false }) {
  const { meta, text, garbled } = await getFullText(row, { limiter, pdfParse, refetch: !dryRun });
  const targetType = kindToTargetType((meta.kind ?? "").toLowerCase());
  const prompt = buildPrompt(
    targetType,
    { title: meta.title, url: meta.url ?? row.source_url, date: meta.date, kind: meta.kind },
    text,
    { garbled },
  );
  if (dryRun) return { dryRun: true, targetType, promptChars: prompt.length, prompt, meta };
  let parsed = null;
  let attempts = 0;
  let lastErr = "";
  // One retry: free-tier models sometimes add prose despite instructions.
  for (const extra of ["", "\n\nReminder: output raw JSON only, no other text."]) {
    attempts++;
    try {
      const rawAnswer = await callLLM(llm, prompt + extra);
      parsed = JSON.parse(cleanJsonResponse(rawAnswer));
      break;
    } catch (e) {
      lastErr = String(e.message ?? e).slice(0, 120);
    }
  }
  if (!parsed) throw new Error(`LLM output was not valid JSON (${attempts} tries): ${lastErr}`);
  const v = validateStructured(targetType, parsed, { garbled });
  if (!v.ok) throw new Error(`validation: ${v.error}`);
  const [inserted] = await store.insertPendingEntry({
    rawScrapeId: row.id,
    targetType,
    structuredData: parsed,
    confidenceFlags: v.flags,
  });
  await store.markProcessed(row.id);
  return { pendingId: inserted.id, targetType, flags: v.flags };
}

export async function runStructure({ store, limiter, pdfParse, llm, sourceId = null, limit = 10, dryRun = false }) {
  const rows = await store.listUnprocessed({ sourceId, limit });
  const out = { examined: rows.length, created: 0, failed: 0, errors: [], previews: [] };
  for (const row of rows) {
    try {
      const r = await structureOneRow(row, { store, limiter, pdfParse, llm, dryRun });
      if (dryRun) out.previews.push(r);
      else out.created++;
    } catch (e) {
      out.failed++;
      out.errors.push(`${row.id.slice(0, 8)}: ${String(e.message ?? e).slice(0, 200)}`);
    }
  }
  return out;
}
