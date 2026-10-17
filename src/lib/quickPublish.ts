import { createRequire } from "node:module";

import { loadLLMEnv } from "../../scripts/scraper/lib/config.mjs";
import { buildPrompt } from "../../scripts/scraper/lib/prompts.mjs";
import { callLLM, cleanJsonResponse } from "../../scripts/scraper/lib/llm.mjs";
import { validateStructured } from "../../scripts/scraper/lib/structure.mjs";

import { flattenStructured } from "@/lib/reviewQueue";
import { quickTargetType, type QuickKind } from "@/lib/quickKinds";

/**
 * Phase 7D — Quick Publish extraction (server side).
 *
 * An admin pastes ONE official URL (a notification, admit-card, result or
 * answer-key page — HTML or PDF). We fetch it, hand the text to the same LLM +
 * prompt machinery the scraper uses, and return a structured draft for the
 * human to review before publishing. Nothing here writes to the database and
 * nothing here publishes: extraction is read-only, publishing happens in the
 * server action after the official link has been validated.
 */

export { QUICK_KINDS, isQuickKind, QUICK_KIND_LABELS, quickTargetType } from "@/lib/quickKinds";
export type { QuickKind } from "@/lib/quickKinds";

const FETCH_TIMEOUT_MS = 15000;
const MAX_TEXT_CHARS = 12000;
const USER_AGENT_VALUE =
  "SarkaariNaukriBot/1.0 (+https://www.sarkaarinaukri.online/contact; data-collection for public job listings)";

/** Strip a HTML page down to readable text (scripts/styles/markup removed). */
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Fetch a URL and return its readable text. PDFs are parsed with pdf-parse;
 * everything else is treated as HTML. Bounded so a huge page can't blow up the
 * prompt (and the token budget).
 */
export async function fetchSourceText(url: string): Promise<string> {
  const res = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { "User-Agent": USER_AGENT_VALUE, Accept: "text/html,application/pdf,*/*" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching the page`);

  const contentType = res.headers.get("content-type") ?? "";
  const isPdf = /pdf/i.test(contentType) || /\.pdf($|\?)/i.test(url);

  if (isPdf) {
    const buffer = Buffer.from(await res.arrayBuffer());
    const require = createRequire(import.meta.url);
    const pdfParse = require("pdf-parse") as (b: Buffer) => Promise<{ text?: string }>;
    const parsed = await pdfParse(buffer);
    return (parsed.text ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_TEXT_CHARS);
  }

  const html = await res.text();
  return htmlToText(html).slice(0, MAX_TEXT_CHARS);
}

export type QuickDraft = {
  kind: QuickKind;
  targetType: string;
  /** Flat string fields, shaped for the editable preview form. */
  fields: Record<string, string>;
  /** Confidence flags (missing_<field> and category-JSON warnings). */
  flags: Record<string, true>;
  sourceUrl: string;
  textChars: number;
};

/**
 * Extract a structured draft from a single URL. Throws with a message intended
 * to be shown to the admin; the caller wraps it into an AdminResult.
 */
export async function extractQuickDraft(kind: QuickKind, url: string): Promise<QuickDraft> {
  const llm = loadLLMEnv();
  if (!llm || !llm.apiKey) {
    throw new Error("The LLM is not configured on the server (LLM_API_KEY missing).");
  }

  const targetType = quickTargetType(kind);
  const text = await fetchSourceText(url);
  if (!text.trim()) {
    throw new Error("The page had no readable text (it may be an image-only PDF or a JS app).");
  }

  const prompt = buildPrompt(targetType, { title: "", url, date: null, kind }, text);

  let parsed: Record<string, unknown> | null = null;
  let lastError = "";
  for (const extra of ["", "\n\nReminder: output raw JSON only, no other text."]) {
    try {
      const raw = await callLLM(llm, prompt + extra);
      parsed = JSON.parse(cleanJsonResponse(raw)) as Record<string, unknown>;
      break;
    } catch (error) {
      lastError = String((error as Error)?.message ?? error).slice(0, 160);
    }
  }
  if (!parsed) {
    throw new Error(`Extraction did not return valid JSON: ${lastError}`);
  }

  const validation = validateStructured(targetType, parsed);
  if (!validation.ok) {
    throw new Error(`Extraction failed validation: ${validation.error}`);
  }

  // The pasted URL is authoritative: never let the model invent a different one.
  if (!parsed.official_link) parsed.official_link = url;

  return {
    kind,
    targetType,
    fields: flattenStructured(parsed),
    flags: (validation.flags ?? {}) as Record<string, true>,
    sourceUrl: url,
    textChars: text.length,
  };
}
