/**
 * IndexNow ping (Phase 2): tells Bing/Yandex instantly when a URL is
 * published, instead of waiting for the next crawl. Requires INDEXNOW_KEY
 * (any 8-128 character hex string) which must also be served as
 * https://<host>/<key>.txt — the file is generated in public/.
 *
 * Failures are always swallowed: indexing hints must never break publishing.
 */

const ENDPOINT = "https://api.indexnow.org/indexnow";

function siteHost(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sarkaarinaukri.online"
  ).replace(/\/+$/, "");
}

export function isIndexNowConfigured(): boolean {
  return !!process.env.INDEXNOW_KEY;
}

export async function pingIndexNow(paths: string[]): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.INDEXNOW_KEY;
  const urls = paths
    .map((p) => (p.startsWith("http") ? p : `${siteHost()}${p.startsWith("/") ? p : `/${p}`}`))
    .filter(Boolean);
  if (!key || urls.length === 0) {
    return { ok: false, error: "INDEXNOW_KEY not set or no URLs" };
  }
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(siteHost()).host,
        key,
        keyLocation: `${siteHost()}/${key}.txt`,
        urlList: urls,
      }),
    });
    if (!res.ok) {
      return { ok: false, error: `IndexNow HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/** Job/result/admit-card detail URL for a given pipeline target + slug. */
export function targetUrl(target: string, slug: string): string | null {
  const prefix =
    target === "job"
      ? "/jobs/"
      : target === "result"
        ? "/result/"
        : target === "admit_card"
          ? "/admit-card/"
          : null;
  return prefix ? `${prefix}${slug}` : null;
}
