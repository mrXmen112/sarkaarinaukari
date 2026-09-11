/**
 * Generic single-source live runner (Phase B).
 *
 * Flow per run:
 *   1. load source row -> fetch robots.txt -> Allow check (Section 6.3).
 *      Disallowed => mark source inactive + log + stop (no writes otherwise).
 *   2. fetch listing page (rate-limited) -> adapter.extractItems().
 *   3. for each item (up to `limit`): fetch detail (rate-limited);
 *      HTML  -> htmlToCleanText(); PDF/other -> provenance header + note
 *      (full PDF text extraction arrives in Phase C).
 *   4. sha256 dedup against raw_scrapes.content_hash -> insert new rows.
 *   5. update last_scraped_at + insert scrape_logs row.
 *
 * Writes ONLY to raw_scrapes / scrape_logs / scrape_sources bookkeeping.
 * NEVER touches jobs, admit_cards, results, answer_keys, yojana.
 */

import { USER_AGENT } from "./config.mjs";
import { RateLimiter } from "./rateLimit.mjs";
import { fetchRobotsTxt, parseRobotsTxt, isAllowed } from "./robots.mjs";
import { htmlToCleanText } from "./text.mjs";
import { sha256Hex } from "./hash.mjs";

/** Keep staging rows small and LLM-friendly. */
const MAX_CONTENT_CHARS = 20000;

/**
 * Stable provenance header. Deliberately EXCLUDES fetched-at timestamps so
 * the content_hash is idempotent: re-scraping an unchanged item yields the
 * same hash and dedups instead of creating a duplicate row.
 */
function stableHeader({ sourceName, url, title, date, kind, contentType }) {
  return (
    `SOURCE: ${sourceName}\n` +
    `URL: ${url}\n` +
    `TITLE: ${title}\n` +
    `DATE: ${date ?? "unknown"}\n` +
    `KIND: ${kind}\n` +
    `CONTENT-TYPE: ${contentType ?? "unknown"}\n\n`
  );
}

async function fetchText(url, limiter, minDelayMs) {
  await limiter.wait(new URL(url).host);
  // Reuse one limiter instance per process; minDelayMs is fixed at construction.
  void minDelayMs;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    redirect: "follow",
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const contentType = res.headers.get("content-type") ?? "";
  if (/pdf/i.test(contentType) || /\.pdf(\?|#|$)/i.test(url)) {
    // Drain without buffering the whole file into a string.
    await res.arrayBuffer();
    return { contentType: contentType || "application/pdf", text: null, isPdf: true };
  }
  const html = await res.text();
  return { contentType: contentType || "text/html", text: html, isPdf: false };
}

export async function runSource({ store, source, adapter, limiter, limit = 10 }) {
  const started = Date.now();
  let itemsFound = 0;
  let itemsNew = 0;
  let status = "success";
  let errorMessage = null;

  const finish = async () => {
    await store.updateSource(source.id, {
      last_scraped_at: new Date().toISOString(),
    });
    await store.insertScrapeLog({
      sourceId: source.id,
      status,
      itemsFound,
      itemsNew,
      errorMessage,
    });
    return { status, itemsFound, itemsNew, errorMessage, ms: Date.now() - started };
  };

  try {
    // 1. robots.txt
    const robotsText = await fetchRobotsTxt(source.base_url, USER_AGENT);
    await store.updateSource(source.id, {
      robots_txt_checked_at: new Date().toISOString(),
    });
    if (robotsText !== null) {
      const listingPath = new URL(adapter.listingUrl(source)).pathname || "/";
      if (!isAllowed(parseRobotsTxt(robotsText), USER_AGENT, listingPath)) {
        await store.updateSource(source.id, { is_active: false });
        status = "failed";
        errorMessage = `robots.txt disallows ${listingPath}; source deactivated`;
        return finish();
      }
    }

    // 2. listing
    const listing = adapter.listingUrl(source);
    const { text: listingHtml } = await fetchText(listing, limiter);
    const items = adapter.extractItems(listingHtml, source.base_url);
    itemsFound = items.length;

    // 3+4. details (cap for manual Phase B runs)
    for (const item of items.slice(0, limit)) {
      try {
        const detail = await fetchText(item.url, limiter);
        const body = detail.isPdf
          ? `[PDF detail — full text extraction arrives in Phase C. Anchor text: ${item.title}]`
          : htmlToCleanText(detail.text).slice(0, MAX_CONTENT_CHARS);
        const head = stableHeader({
          sourceName: source.name,
          url: item.url,
          title: item.title,
          date: item.date,
          kind: item.kind,
          contentType: detail.contentType,
        });
        const hash = sha256Hex(head + body);
        const existing = await store.findByHash(hash);
        if (existing && existing.length > 0) continue; // duplicate -> skip
        const raw = head + `FETCHED_AT: ${new Date().toISOString()}\n\n` + body;
        await store.insertRawScrape({
          sourceId: source.id,
          sourceUrl: item.url,
          rawContent: raw,
          contentHash: hash,
        });
        itemsNew++;
        continue;
      } catch (e) {
        // One bad detail page must not kill the whole run (partial status).
        status = "partial";
        errorMessage = (errorMessage ? errorMessage + " | " : "") +
          `detail failed ${item.url}: ${e.message}`.slice(0, 300);
        continue;
      }
    }
  } catch (e) {
    status = "failed";
    errorMessage = String(e.message ?? e).slice(0, 500);
  }
  return finish();
}

export function createLimiter(minDelayMs) {
  return new RateLimiter(minDelayMs);
}
