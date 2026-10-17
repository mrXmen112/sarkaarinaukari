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
import { fetchWithRetry } from "./net.mjs";
import { buildPrompt, flaggableFields, requiredFields } from "./prompts.mjs";
import { callLLM, cleanJsonResponse } from "./llm.mjs";
import {
  DEPARTMENT_STATE,
  isValidDepartmentSlug,
  isValidStateSlug,
} from "./vocab.mjs";

/** Cap on text sent to the LLM per row. */
const MAX_PROMPT_CHARS = 15000;
/** Marker Phase B stored when a detail target was a PDF. */
const PDF_MARKER = "[PDF detail";

const KIND_TO_TARGET = {
  advertisement: "job",
  apply_portal: "job",
  result: "result",
  admit_card: "admit_card",
};

/**
 * A generic "notice" is only a job when its title is clearly about a
 * recruitment (advt/vacancy/apply/corrigendum/last date). Document
 * verification, original-document submission, cancellation-of-candidature
 * and selection-confirmation notices are NOT job listings, so they return
 * null and Phase C skips them instead of creating junk job rows. (The
 * schema has no "notice" target_type, so skipping is the only non-polluting
 * option.) Unknown kinds are skipped too, never defaulted to "job".
 */
const RECRUITMENT_NOTICE =
  /advert|advt|vacanc|recruit|apply|application|online form|last date|corrigendum|extension/i;

export function kindToTargetType(kind, { title = "" } = {}) {
  if (kind === "notice") return RECRUITMENT_NOTICE.test(title) ? "job" : null;
  return KIND_TO_TARGET[kind] ?? null;
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
    const res = await fetchWithRetry(meta.url, {
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

/* ---- W5.4 (pipeline side): category-JSON sanity ---------------------- *
 * The admin save path validates again, but normalising here means the review
 * queue never even receives "Female: 0" placeholder rows or a breakdown that
 * contradicts its own total. Mirrors src/lib/sanity.ts (kept as a small
 * duplicate because this module runs standalone as .mjs).
 */
const PLACEHOLDER_NUM = new Set(["", "nil", "n/a", "na", "none", "-", "—"]);

function numberMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (typeof v === "number") {
      if (Number.isFinite(v)) out[k] = v;
      continue;
    }
    if (typeof v === "string") {
      const t = v.trim();
      if (PLACEHOLDER_NUM.has(t.toLowerCase())) continue; // placeholder -> dropped
      const n = Number(t);
      if (Number.isFinite(n)) out[k] = n;
    }
  }
  return out;
}

// Alias set mirrors sanity.ts's KEY_ALIASES so the pipeline flags the same
// collisions the save-side gate rejects ("All categories" + "Total" = one row).
const CATEGORY_ALIASES = {
  all: "all",
  all_categories: "all",
  all_category: "all",
  all_categories_combined: "all",
  total: "all",
};

function canonicalCategory(key) {
  const k = String(key)
    .trim()
    .toLowerCase()
    .replace(/[()[\]{}]+/g, " ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return CATEGORY_ALIASES[k] ?? k;
}

/** Normalise + flag the three job JSON columns in place. Returns a flags object. */
function sanitiseCategoryJson(targetType, obj) {
  const flags = {};
  if (targetType !== "job") return flags;

  const vb = numberMap(obj.vacancy_breakdown);
  if (vb) {
    const kept = Object.fromEntries(Object.entries(vb).filter(([, v]) => v > 0));
    if (Object.keys(kept).length !== Object.keys(vb).length) {
      flags.dropped_zero_vacancy_rows = true;
    }
    const total = Number(obj.vacancy_total);
    const sum = Object.values(kept).reduce((a, b) => a + b, 0);
    if (Number.isFinite(total) && total > 0 && Object.keys(kept).length > 0 && sum !== total) {
      flags.vacancy_breakdown_mismatch = true;
    }
    obj.vacancy_breakdown = Object.keys(kept).length ? kept : null;
  }

  if (obj.application_fee && typeof obj.application_fee === "object" && !Array.isArray(obj.application_fee)) {
    const seen = new Set();
    let dup = false;
    for (const k of Object.keys(obj.application_fee)) {
      const c = canonicalCategory(k);
      if (seen.has(c)) dup = true;
      else seen.add(c);
    }
    if (dup) flags.duplicate_fee_rows = true;
    const fee = numberMap(obj.application_fee);
    obj.application_fee = fee && Object.keys(fee).length ? fee : null;
  }

  if (obj.age_relaxation && typeof obj.age_relaxation === "object" && !Array.isArray(obj.age_relaxation)) {
    const age = numberMap(obj.age_relaxation);
    obj.age_relaxation = age && Object.keys(age).length ? age : null;
  }

  return flags;
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
  normalizeJobTaxonomy(obj);
  const flags = {};
  Object.assign(flags, sanitiseCategoryJson(targetType, obj));
  for (const f of flaggableFields(targetType)) {
    if (obj[f] === null || obj[f] === undefined || obj[f] === "") flags[`missing_${f}`] = true;
  }
  if (garbled) flags.pdf_unreadable_text = true;
  return { ok: true, flags };
}

/**
 * Force department_slug / state onto the controlled vocabulary: any value the
 * model invented (or a display name) becomes null so it can never reach a
 * live table. A state body always resolves to its own state's slug.
 */
function normalizeJobTaxonomy(obj) {
  if (typeof obj.department_slug === "string") {
    const slug = obj.department_slug.trim().toLowerCase();
    obj.department_slug = isValidDepartmentSlug(slug) ? slug : null;
  } else {
    obj.department_slug = null;
  }
  const deptState = obj.department_slug ? DEPARTMENT_STATE[obj.department_slug] ?? null : null;
  if (typeof obj.state === "string") {
    const state = obj.state.trim().toLowerCase();
    obj.state = isValidStateSlug(state) ? state : null;
  } else {
    obj.state = null;
  }
  // The department's own state wins when both are present and disagree.
  if (deptState) obj.state = deptState;
  // A national department can never carry a state.
  if (obj.department_slug && !deptState) obj.state = null;
}

export async function structureOneRow(row, { store, limiter, pdfParse, llm, dryRun = false }) {
  const { meta, text, garbled } = await getFullText(row, { limiter, pdfParse, refetch: !dryRun });
  const targetType = kindToTargetType((meta.kind ?? "").toLowerCase(), { title: meta.title ?? "" });
  if (!targetType) {
    // Non-recruitment notice (or unknown kind): consume the row but create no
    // pending entry, keeping the review queue free of junk jobs. The raw row is
    // retained (processed=true) for audit.
    if (!dryRun) await store.markProcessed(row.id);
    return { skipped: true, reason: `kind "${meta.kind ?? "unknown"}" is not a recruitment listing` };
  }
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
  const out = { examined: rows.length, created: 0, skipped: 0, failed: 0, errors: [], previews: [] };
  for (const row of rows) {
    try {
      const r = await structureOneRow(row, { store, limiter, pdfParse, llm, dryRun });
      if (r.skipped && !dryRun) out.skipped++;
      else if (dryRun) out.previews.push(r);
      else out.created++;
    } catch (e) {
      out.failed++;
      out.errors.push(`${row.id.slice(0, 8)}: ${String(e.message ?? e).slice(0, 200)}`);
    }
  }
  return out;
}
