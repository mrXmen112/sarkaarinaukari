/**
 * Deterministic structuring fallback.
 *
 * Used by the cron when no LLM_API_KEY is configured. It never invents a
 * value: it copies strings that appear verbatim in the stored official notice
 * and leaves everything else null. The automated verifier then cross-checks
 * those values against the same raw text before anything can be published.
 */
import { splitRawContent, kindToTargetType } from "./structure.mjs";

const MONTHS = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

function isoDate(value) {
  if (!value) return null;
  const s = String(value).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = s.match(/(\d{1,2})[-/\s]([A-Za-z]{3})[a-z]*[-/\s](\d{4})/);
  if (m && MONTHS[m[2].toLowerCase().slice(0, 3)]) {
    return `${m[3]}-${String(MONTHS[m[2].toLowerCase().slice(0, 3)]).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  }
  m = s.match(/\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return null;
}

function pick(text, patterns) {
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) return m[1].trim().replace(/\s+/g, " ");
  }
  return null;
}

export function extractDraft(meta, text) {
  const flat = String(text ?? "").replace(/\s+/g, " ");
  return {
    title: meta.title || null,
    official_link: meta.url || null,
    notice_number: pick(flat, [
      /\b(?:advt|advertisement|advancement|notice\s*no|advt\s*no)\.?\s*(?:no\.?\s*)?[:#]?\s*([0-9]{1,3}\s*\/\s*[0-9]{2,4})\b/i,
      /\b(?:advt|advertisement|notice)\.?\s*(?:no\.?\s*)?[:#]\s*([A-Za-z0-9/\-]{3,30})/i,
    ]),
    vacancy_total: (() => {
      const raw = pick(flat, [/\bvacanc(?:y|ies)\b[^0-9]{0,60}([0-9][0-9,]*)/i]);
      const n = Number(String(raw ?? "").replace(/,/g, ""));
      return Number.isFinite(n) && n > 0 ? n : null;
    })(),
    application_end: isoDate(
      pick(flat, [
        /last date[^0-9]{0,80}([0-9]{1,2}[-/\s][A-Za-z0-9]{2,9}[-/\s][0-9]{4})/i,
        /closing date[^0-9]{0,60}([0-9]{1,2}[-/\s][A-Za-z0-9]{2,9}[-/\s][0-9]{4})/i,
      ]) ?? meta.date,
    ),
    application_start: isoDate(
      pick(flat, [
        /(?:from|starting|start date)[^0-9]{0,60}([0-9]{1,2}[-/\s][A-Za-z0-9]{2,9}[-/\s][0-9]{4})/i,
      ]),
    ),
    eligibility_education: pick(flat, [
      /(?:educational qualification|eligibility)[^.]{0,30}:\s*([^.]{10,160}\.)/i,
    ]),
    department: pick(flat, [
      /(?:conducted by|commission|board|department)[^.]{0,20}:\s*([A-Za-z][A-Za-z\s&]{3,60})/i,
    ]),
  };
}

export async function runDeterministicStructure({ store, limit = 3 }) {
  const rows = await store.listUnprocessed({ limit });
  const out = { examined: rows.length, created: 0, skipped: 0, failed: 0, errors: [] };
  for (const row of rows) {
    try {
      const { meta, body } = splitRawContent(row.raw_content);
      const target = kindToTargetType(String(meta.kind ?? "").toLowerCase(), {
        title: meta.title ?? "",
      });
      if (!target) {
        await store.markProcessed(row.id);
        out.skipped++;
        continue;
      }
      const draft = extractDraft(meta, body);
      await store.insertPendingEntry({
        rawScrapeId: row.id,
        targetType: target,
        structuredData: draft,
        confidenceFlags: {
          deterministic_extraction: true,
          ...(draft.notice_number ? {} : { missing_notice_number: true }),
          ...(draft.vacancy_total ? {} : { missing_vacancy_total: true }),
          ...(draft.application_end ? {} : { missing_application_end: true }),
        },
      });
      await store.markProcessed(row.id);
      out.created++;
    } catch (e) {
      out.failed++;
      out.errors.push(`${row.id.slice(0, 8)}: ${String(e.message ?? e).slice(0, 160)}`);
      try {
        await store.insertImportError({
          sourceId: row.source_id ?? null,
          rawScrapeId: row.id,
          phase: "structure",
          code: "deterministic_structure_failed",
          message: String(e.message ?? e).slice(0, 500),
        });
      } catch {
        // Logging must never stop the run.
      }
    }
  }
  return out;
}
