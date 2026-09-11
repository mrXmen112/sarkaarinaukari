#!/usr/bin/env node
/**
 * SarkaariNaukari automated-pipeline scraper — STANDALONE entry point.
 *
 * Decoupled from the Next.js app by design: this runs as its own process
 * (manual run, cron, GitHub Action, or Edge Function schedule in later
 * phases). A crash or LLM timeout here can NEVER affect site uptime, and
 * nothing in this directory can write to the live tables — storage only
 * targets the staging tables from migration 0013.
 *
 * PHASE B (current): live runs for implemented adapters only (CSBC).
 *   --help                    this text
 *   --list-sources [--active] read-only list of configured sources
 *   --dry-run --source <name> print what WOULD happen, no network, no DB writes
 *   --live --source <name> [--limit N]
 *                             run one source now (manual trigger only, no cron).
 *                             Writes ONLY to raw_scrapes / scrape_logs /
 *                             scrape_sources bookkeeping. Default limit 10.
 *   --structure [--source <name>] [--limit N] [--dry-run]
 *                             Phase C: raw_scrapes -> LLM -> pending_entries
 *                             (human review queue). Live mode needs LLM_API_KEY;
 *                             --dry-run prints exact prompts, no LLM, no writes.
 *
 * Run:  npm run scraper -- --help
 *   or: node scripts/scraper/run.mjs --help
 */

import { createRequire } from "node:module";

import { loadEnv, loadLLMEnv, MIN_DELAY_MS, USER_AGENT } from "./lib/config.mjs";
import { createStore } from "./lib/store.mjs";
import { RateLimiter } from "./lib/rateLimit.mjs";
import { runSource } from "./lib/scrape.mjs";
import { runStructure } from "./lib/structure.mjs";
import { getAdapter } from "./sources/index.mjs";

const limiter = new RateLimiter(MIN_DELAY_MS);

function usage() {
  console.log(`SarkaariNaukri pipeline scraper (Phase A skeleton)

Usage:
  node scripts/scraper/run.mjs --help
  node scripts/scraper/run.mjs --list-sources [--active]
  node scripts/scraper/run.mjs --dry-run --source "<source name>"

Notes:
  - Read-only commands use the service-role key server-side only.
  - Live runs implemented for: CSBC Bihar Police Recruitment (Phase B).
  - User-Agent: ${USER_AGENT}
  - Rate limit: >= ${MIN_DELAY_MS}ms between requests to the same domain.`);
}

function parseArgs(argv) {
  const out = { live: false, help: false, listSources: false, activeOnly: false, dryRun: false, source: null, limit: 10, structure: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--list-sources") out.listSources = true;
    else if (a === "--active") out.activeOnly = true;
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--live") out.live = true;
    else if (a === "--structure") out.structure = true;
    else if (a === "--source") out.source = argv[++i] ?? null;
    else if (a === "--limit") out.limit = Math.max(1, Number(argv[++i]) || 10);
  }
  return out;
}

async function cmdListSources(activeOnly) {
  const { url, serviceKey } = loadEnv();
  const store = createStore({ url, serviceKey });
  const rows = await store.listSources({ activeOnly });
  if (rows.length === 0) {
    console.log("No sources found.");
    return;
  }
  for (const s of rows) {
    console.log(
      `- ${s.name} [${s.target_type}] every ${s.scrape_frequency_hours}h ` +
        `active=${s.is_active} last_scraped=${s.last_scraped_at ?? "never"}\n  ${s.base_url}`,
    );
  }
  console.log(`\n${rows.length} source(s).`);
}

async function cmdDryRun(name) {
  if (!name) {
    console.error("ERROR: --dry-run requires --source \"<name>\".");
    process.exitCode = 2;
    return;
  }
  const { url, serviceKey } = loadEnv();
  const store = createStore({ url, serviceKey });
  const rows = await store.listSources();
  const src = rows.find((r) => r.name.toLowerCase() === name.toLowerCase());
  if (!src) {
    console.error(`ERROR: no source named "${name}". Use --list-sources to see names.`);
    process.exitCode = 2;
    return;
  }
  // Dry run: plan only. No HTTP requests, no DB writes (rate limiter unused).
  console.log(`DRY RUN — no network calls, no database writes.`);
  console.log(`Source : ${src.name} (${src.base_url})`);
  console.log(`Type   : ${src.target_type} | active=${src.is_active} | every ${src.scrape_frequency_hours}h`);
  console.log(`Would  : 1) GET robots.txt -> check Allow for listing path`);
  if (!src.is_active) console.log(`         (source is inactive: live run would skip it)`);
  console.log(`         2) GET listing page (delay >= ${limiter.minDelayMs}ms between same-domain hits)`);
  console.log(`         3) extract new item links -> GET each detail page`);
  console.log(`         4) htmlToCleanText() -> sha256 -> INSERT raw_scrapes (dedup on content_hash)`);
  console.log(`         5) INSERT scrape_logs row for this run`);
}

async function cmdLive(name, limit) {
  if (!name) {
    console.error('ERROR: --live requires --source "<name>".');
    process.exitCode = 2;
    return;
  }
  const adapter = getAdapter(name);
  if (!adapter) {
    console.error(
      `ERROR: no live adapter for "${name}" yet (Phase B: CSBC only; more sources arrive in Phase G).`,
    );
    process.exitCode = 2;
    return;
  }
  const { url, serviceKey } = loadEnv();
  const store = createStore({ url, serviceKey });
  const rows = await store.listSources();
  const source = rows.find((r) => r.name === name);
  if (!source) {
    console.error(`ERROR: source "${name}" not found in scrape_sources.`);
    process.exitCode = 2;
    return;
  }
  console.log(`LIVE run: ${source.name} (limit ${limit}) — staging tables only.`);
  const summary = await runSource({ store, source, adapter, limiter, limit });
  console.log(
    `Done: status=${summary.status} found=${summary.itemsFound} new=${summary.itemsNew} in ${summary.ms}ms`,
  );
  if (summary.errorMessage) console.log(`Notes: ${summary.errorMessage}`);
  if (summary.status === "failed") process.exitCode = 1;
}

function loadPdfParse() {
  try {
    const require = createRequire(import.meta.url);
    return require("pdf-parse");
  } catch {
    throw new Error(
      "[scraper] pdf-parse is not installed. Run: npm install pdf-parse",
    );
  }
}

async function cmdStructure(name, limit, dryRun) {
  const { url, serviceKey } = loadEnv();
  const store = createStore({ url, serviceKey });
  let sourceId = null;
  if (name) {
    const rows = await store.listSources();
    const src = rows.find((r) => r.name.toLowerCase() === name.toLowerCase());
    if (!src) {
      console.error(`ERROR: no source named "${name}". Use --list-sources.`);
      process.exitCode = 2;
      return;
    }
    sourceId = src.id;
  }
  let llm = null;
  if (!dryRun) llm = loadLLMEnv(); // throws a clear error when key is missing
  const pdfParse = loadPdfParse();
  console.log(
    dryRun
      ? `STRUCTURE DRY RUN (limit ${limit}) — no LLM calls, no writes.`
      : `STRUCTURE live run (limit ${limit}) — model ${llm.model}.`,
  );
  const out = await runStructure({ store, limiter, pdfParse, llm, sourceId, limit, dryRun });
  console.log(`Done: examined=${out.examined} created=${out.created} failed=${out.failed}`);
  for (const e of out.errors) console.log(`  ERR ${e}`);
  if (dryRun) {
    for (const p of out.previews.slice(0, 2)) {
      console.log(`\n--- preview [${p.targetType}] ${p.meta.title?.slice(0, 80)} (${p.promptChars} chars) ---`);
      console.log(p.prompt.slice(0, 1200));
      console.log("... [truncated]");
    }
    if (out.previews.length > 2) console.log(`(+${out.previews.length - 2} more previews hidden)`);
  }
  if (out.failed > 0 && !dryRun) process.exitCode = 1;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || process.argv.length <= 2) {
    usage();
    return;
  }
  if (args.live) {
    await cmdLive(args.source, args.limit);
    return;
  }
  if (args.structure) {
    await cmdStructure(args.source, args.limit, args.dryRun);
    return;
  }
  if (args.listSources) {
    await cmdListSources(args.activeOnly);
    return;
  }
  if (args.dryRun) {
    await cmdDryRun(args.source);
    return;
  }
  console.error("ERROR: unknown flags. See --help.");
  process.exitCode = 2;
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exitCode = 1;
});
