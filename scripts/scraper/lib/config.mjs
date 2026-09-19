import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Shared constants + environment loading for the standalone scraper.
 *
 * This module has NO side effects on import. It never touches the Next.js
 * app, and it never writes to live tables (jobs, yojana, ...). All DB
 * access goes through the service-role key to the NEW staging tables only
 * (scrape_sources, raw_scrapes, pending_entries, scrape_logs).
 */

export const USER_AGENT =
  "SarkaariNaukriBot/1.0 (+https://sarkaarinaukri.online/contact; data-collection for public job listings)";

/** Minimum delay between two requests to the SAME domain (Section 6.4). */
export const MIN_DELAY_MS = 4000;

/** Allowed target_type values (mirrors the DB check constraints). */
export const TARGET_TYPES = [
  "job",
  "admit_card",
  "result",
  "answer_key",
  "yojana",
];

/** Allowed pending_entries.status values. */
export const REVIEW_STATUSES = [
  "pending_review",
  "approved",
  "rejected",
  "needs_edit",
];

/**
 * Load Supabase credentials. Explicit env vars win; for local runs we fall
 * back to parsing the repo-root .env.local (same pattern as the existing
 * scripts/verify_exams.cjs helper). Throws a clear error when missing.
 */
export function loadEnv() {
  const fromFile = readDotEnvLocal();
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? fromFile.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? fromFile.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) {
    throw new Error(
      "[scraper] Missing NEXT_PUBLIC_SUPABASE_URL (env or .env.local).",
    );
  }
  if (!serviceKey) {
    throw new Error(
      "[scraper] Missing SUPABASE_SERVICE_ROLE_KEY (env or .env.local).",
    );
  }
  return { url, serviceKey };
}

/**
 * LLM credentials for Phase C structuring. OpenAI-compatible: override
 * LLM_BASE_URL for OpenRouter / other gateways, LLM_MODEL to pick the model.
 * Throws a clear error when the key is missing (live structuring stays
 * disabled until the user provides one; --dry-run always works).
 */
export function loadLLMEnv() {
  const fromFile = readDotEnvLocal();
  const apiKey = process.env.LLM_API_KEY ?? fromFile.LLM_API_KEY;
  if (!apiKey) {
    throw new Error(
      "[scraper] Missing LLM_API_KEY (env or .env.local). " +
        "Set it to enable live structuring; --dry-run works without it.",
    );
  }
  return {
    apiKey,
    baseUrl:
      process.env.LLM_BASE_URL ?? fromFile.LLM_BASE_URL ?? "https://api.openai.com/v1",
    model: process.env.LLM_MODEL ?? fromFile.LLM_MODEL ?? "gpt-4o-mini",
    maxTokens: Number(process.env.LLM_MAX_TOKENS ?? fromFile.LLM_MAX_TOKENS ?? 2000) || 2000,
  };
}

function readDotEnvLocal() {
  const out = {};
  try {
    // this file lives in <root>/scripts/scraper/lib/, so repo root is ../../..
    const here = path.dirname(fileURLToPath(import.meta.url));
    const root = path.resolve(here, "..", "..", "..");
    const raw = fs.readFileSync(path.join(root, ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const i = line.indexOf("=");
      if (i > 0 && !line.trimStart().startsWith("#")) {
        out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
      }
    }
  } catch {
    // No .env.local (e.g. CI with real env vars) — callers use process.env.
  }
  return out;
}
