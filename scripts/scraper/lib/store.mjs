/**
 * Minimal Supabase REST storage layer for the staging tables ONLY.
 *
 * Uses native fetch + the service-role key (bypasses RLS, server-side only).
 * Deliberately has NO functions that write to jobs, admit_cards, results,
 * answer_keys, yojana, or any other live table — automated output only ever
 * lands in raw_scrapes / pending_entries / scrape_logs / scrape_sources.
 */

function headers(serviceKey) {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

async function check(res, what) {
  if (res.ok) return res.json();
  const body = await res.text().catch(() => "");
  throw new Error(`[scraper] ${what} failed: HTTP ${res.status} ${body.slice(0, 300)}`);
}

export function createStore({ url, serviceKey }) {
  const base = url.replace(/\/$/, "");
  const h = () => headers(serviceKey);

  return {
    /** Read-only: list sources, optionally only active ones. */
    async listSources({ activeOnly = false } = {}) {
      const q = activeOnly ? "?is_active=eq.true&order=name" : "?order=name";
      const res = await fetch(`${base}/rest/v1/scrape_sources${q}`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      });
      return check(res, "listSources");
    },

    /** Insert one raw scrape row. UNIQUE(content_hash) silently dedups. */
    async insertRawScrape({ sourceId, sourceUrl, rawContent, contentHash }) {
      const res = await fetch(`${base}/rest/v1/raw_scrapes`, {
        method: "POST",
        headers: { ...h(), Prefer: "return=representation,resolution=ignore-duplicates" },
        body: JSON.stringify({
          source_id: sourceId,
          source_url: sourceUrl,
          raw_content: rawContent,
          content_hash: contentHash,
        }),
      });
      return check(res, "insertRawScrape");
    },

    /** Dedup lookup: does this content_hash already exist? */
    async findByHash(contentHash) {
      const res = await fetch(
        `${base}/rest/v1/raw_scrapes?content_hash=eq.${contentHash}&select=id`,
        { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
      );
      return check(res, "findByHash");
    },

    /** Oldest-first unprocessed scrapes, optionally scoped to a source. */
    async listUnprocessed({ sourceId = null, limit = 10 } = {}) {
      const scope = sourceId ? `&source_id=eq.${sourceId}` : "";
      const res = await fetch(
        `${base}/rest/v1/raw_scrapes?processed=eq.false${scope}&order=scraped_at.asc&limit=${limit}&select=id,source_id,source_url,raw_content,scraped_at`,
        { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
      );
      return check(res, "listUnprocessed");
    },

    /** Insert one human-review row. NEVER writes to live tables. */
    async insertPendingEntry({ rawScrapeId, targetType, structuredData, confidenceFlags }) {
      const res = await fetch(`${base}/rest/v1/pending_entries`, {
        method: "POST",
        headers: h(),
        body: JSON.stringify({
          raw_scrape_id: rawScrapeId,
          target_type: targetType,
          structured_data: structuredData,
          confidence_flags: confidenceFlags,
          status: "pending_review",
        }),
      });
      return check(res, "insertPendingEntry");
    },

    /** Mark a raw scrape as consumed by the structurer (only on success). */
    async markProcessed(id) {
      const res = await fetch(`${base}/rest/v1/raw_scrapes?id=eq.${id}`, {
        method: "PATCH",
        headers: h(),
        body: JSON.stringify({ processed: true }),
      });
      return check(res, "markProcessed");
    },

    /** Append one run log row (Phase F). */
    async insertScrapeLog({ sourceId, status, itemsFound = 0, itemsNew = 0, errorMessage = null }) {
      const res = await fetch(`${base}/rest/v1/scrape_logs`, {
        method: "POST",
        headers: h(),
        body: JSON.stringify({
          source_id: sourceId,
          status,
          items_found: itemsFound,
          items_new: itemsNew,
          error_message: errorMessage,
        }),
      });
      return check(res, "insertScrapeLog");
    },

    /** Touch bookkeeping columns on a source (last_scraped_at, robots check). */
    async updateSource(id, patch) {
      const res = await fetch(`${base}/rest/v1/scrape_sources?id=eq.${id}`, {
        method: "PATCH",
        headers: h(),
        body: JSON.stringify(patch),
      });
      return check(res, "updateSource");
    },
  };
}
