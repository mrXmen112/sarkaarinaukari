import type { NextRequest } from "next/server";
import { createRequire } from "node:module";

import { loadEnv, loadLLMEnv, MIN_DELAY_MS } from "../../../../../scripts/scraper/lib/config.mjs";
import { createStore } from "../../../../../scripts/scraper/lib/store.mjs";
import { RateLimiter } from "../../../../../scripts/scraper/lib/rateLimit.mjs";
import { runSource } from "../../../../../scripts/scraper/lib/scrape.mjs";
import { runStructure } from "../../../../../scripts/scraper/lib/structure.mjs";
import { getAdapter } from "../../../../../scripts/scraper/sources/index.mjs";

/**
 * Vacancy pipeline cron (Phase 1).
 *
 * One invocation does a bounded amount of work: scrape the active source that
 * was scraped longest ago (rotation), then structure a few unprocessed rows
 * into the human-review queue. NOTHING publishes automatically — publishing
 * happens in /admin/review-queue. Staging tables only.
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

  try {
    const { url, serviceKey } = loadEnv();
    const store = createStore({ url, serviceKey });
    const limiter = new RateLimiter(MIN_DELAY_MS);

    // 1) Rotate through active sources that have a live adapter, oldest first.
    const sources = await store.listSources({ activeOnly: true });
    const candidates = sources
      .filter((s: { name: string }) => getAdapter(s.name))
      .sort((a: { last_scraped_at: string | null }, b: { last_scraped_at: string | null }) =>
        String(a.last_scraped_at ?? "").localeCompare(String(b.last_scraped_at ?? "")),
      );

    let scrape = null;
    if (candidates.length > 0) {
      const source = candidates[0];
      const adapter = getAdapter(source.name);
      sourceId = source.id ?? null;
      scrape = await runSource({ store, source, adapter, limiter, limit: 5 });
    }

    // 2) Structure a few unprocessed rows into pending_entries (needs LLM key).
    let structure = null;
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
        structure = await runStructure({
          store,
          limiter,
          pdfParse,
          llm,
          sourceId: sourceId ?? undefined,
          limit: 3,
        } as Parameters<typeof runStructure>[0]);
      }
    } catch {
      // LLM_API_KEY absent or model error: staged rows simply wait for the
      // next run. Never fatal — scraping already succeeded.
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
      structure: structure
        ? { examined: structure.examined, created: structure.created, failed: structure.failed }
        : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
