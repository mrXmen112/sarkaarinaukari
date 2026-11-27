import type { NextRequest } from "next/server";
import { createRequire } from "node:module";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const runProcess = promisify(execFile);

import { loadEnv, loadLLMEnv, MIN_DELAY_MS } from "../../../../../scripts/scraper/lib/config.mjs";
import { createStore } from "../../../../../scripts/scraper/lib/store.mjs";
import { RateLimiter } from "../../../../../scripts/scraper/lib/rateLimit.mjs";
import { runSource } from "../../../../../scripts/scraper/lib/scrape.mjs";
import { runStructure } from "../../../../../scripts/scraper/lib/structure.mjs";
import { runDeterministicStructure } from "../../../../../scripts/scraper/lib/deterministic.mjs";
import { getAdapter } from "../../../../../scripts/scraper/sources/index.mjs";
import { runAutoPublish } from "@/lib/automation";

/**
 * Vacancy pipeline cron (Phase 1).
 *
 * One invocation does a bounded amount of work: scrape the active source that
 * was scraped longest ago (rotation), structure a few unprocessed rows, then
 * run the automated verifier. A notice that matches its registered official
 * source and passes all field checks is published immediately; failures are
 * recorded in import_errors for monitoring. No admin approval is required.
 *
 * Vercel Cron (Hobby: daily) hits this with Authorization: Bearer $CRON_SECRET.
 * For 30-60 min frequency use the Supabase pg_cron snippet from migration
 * 0016 — it POSTs this same endpoint.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

function authorize(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorize(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  let sourceId: string | null = null;
  const errors: string[] = [];

  try {
    const { url, serviceKey } = loadEnv();
    const store = createStore({ url, serviceKey });
    const limiter = new RateLimiter(MIN_DELAY_MS);

    // 1) Rotate through active sources that have a live adapter, oldest first.
    const sources = await store.listSources({ activeOnly: true });
    const candidates = sources
      .filter((s: { name: string; parser: string | null }) => getAdapter(s.name, s.parser))
      .sort((a: { last_scraped_at: string | null }, b: { last_scraped_at: string | null }) =>
        String(a.last_scraped_at ?? "").localeCompare(String(b.last_scraped_at ?? "")),
      );

    let scrape = null;
    if (candidates.length > 0) {
      const source = candidates[0];
      const adapter = getAdapter(source.name, source.parser);
      sourceId = source.id ?? null;
      scrape = await runSource({ store, source, adapter, limiter, limit: 5 });
    }

    // 2) Structure a few unprocessed rows. LLM extraction is preferred, but a
    //    missing key / PDF parser falls back to the conservative extractor.
    let structure = null;
    let structureMode: "llm" | "deterministic" | null = null;
    try {
      const llm = loadLLMEnv();
      let pdfParse = null;
      try {
        const require = createRequire(import.meta.url);
        pdfParse = require("pdf-parse");
      } catch {
        pdfParse = null;
      }
      if (pdfParse) {
        structureMode = "llm";
        structure = await runStructure({
          store,
          limiter,
          pdfParse,
          llm,
          sourceId: sourceId ?? undefined,
          limit: 3,
        } as Parameters<typeof runStructure>[0]);
      }
    } catch (error) {
      errors.push(`llm structure: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (!structure) {
      try {
        structureMode = "deterministic";
        structure = await runDeterministicStructure({ store, limit: 3 });
      } catch (error) {
        errors.push(`deterministic structure: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // 3) Bounded official-notice import from the source-specific adapters.
    //    Kept inside this cron so the plan only needs two scheduled jobs.
    let officialImport = null;
    try {
      const script = path.join(process.cwd(), "scripts", "scraper", "import-official.mjs");
      const { stdout } = await runProcess(process.execPath, [script, "--limit=3"], {
        cwd: process.cwd(),
        timeout: 20_000,
        maxBuffer: 1024 * 1024,
        env: process.env,
      });
      officialImport = stdout.trim().slice(-1500);
    } catch (error) {
      errors.push(`official import: ${error instanceof Error ? error.message.slice(0, 200) : String(error)}`);
    }

    // 4) Publish every staged entry that proves out against its official source.
    //    Failures are persistently logged by runAutoPublish, not surfaced here.
    let autoPublish = null;
    try {
      autoPublish = await runAutoPublish(10);
    } catch (error) {
      errors.push(`autopublish: ${error instanceof Error ? error.message : String(error)}`);
    }

    return Response.json({
      ok: true,
      source: candidates[0]?.name ?? null,
      scrape: scrape
        ? {
            status: scrape.status,
            itemsFound: scrape.itemsFound,
            itemsNew: scrape.itemsNew,
          }
        : null,
      structureMode,
      structure: structure
        ? {
            examined: structure.examined,
            created: structure.created,
            skipped: structure.skipped,
            failed: structure.failed,
          }
        : null,
      officialImport,
      autoPublish: autoPublish
        ? {
            examined: autoPublish.examined,
            published: autoPublish.published,
            failed: autoPublish.errors.length,
            duplicates: autoPublish.duplicates,
          }
        : null,
      errors,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
