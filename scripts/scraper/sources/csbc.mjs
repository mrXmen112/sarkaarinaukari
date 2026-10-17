/**
 * CSBC (Central Selection Board of Constable, Bihar Police) adapter — Phase B.
 *
 * The CSBC homepage IS the notifications listing: anchors point at
 *   Advt/Advt-*.pdf          -> fresh recruitment advertisements (jobs)
 *   Advt/Notice-*.pdf        -> corrigenda / schedules / cancellations
 *   Advt/Results-*.pdf       -> results
 *   https://apply-csbc.com/* -> apply-online + admit-card portals
 * Detail targets are mostly PDFs (full PDF text extraction arrives in
 * Phase C); the runner stores the provenance header + anchor text for those.
 */

export const SOURCE_NAME = "CSBC Bihar Police Recruitment";

/** Listing page == source base_url (homepage carries the notice list). */
export function listingUrl(source) {
  return source.base_url;
}

function stripTags(s) {
  return String(s ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveUrl(href, base) {
  try {
    return new URL(encodeURI(href.trim()), base).toString();
  } catch {
    return null;
  }
}

function toIso(dayStr, monthStr, yearStr) {
  const dd = Number(dayStr);
  const mm = Number(monthStr);
  let yyyy = Number(yearStr);
  if (yearStr.length === 2) yyyy += 2000;
  if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12 && yyyy >= 1990 && yyyy <= 2099) {
    return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  }
  return null;
}

/**
 * Best DD-MM-YYYY date from an href/filename, else from text.
 *
 * CSBC filenames embed BOTH a notice sequence (e.g. "Notice-02-2025-...",
 * "Results-01-2026-...") and a trailing DD-MM-YYYY date, so several digit
 * groups look date-like. We therefore prefer an explicit 4-digit-year
 * DD-MM-YYYY and take the LAST plausible one (the trailing official date
 * wins). A 2-digit-year DD-MM-YY pass is only a fallback. This replaces a
 * naive "first match" that turned "…-06-10-2026.pdf" into 2010-06-25.
 */
export function extractDate(href, text) {
  for (const src of [href, text]) {
    const s = String(src ?? "");
    const four = [...s.matchAll(/(\d{1,2})-(\d{1,2})-(\d{4})/g)];
    for (let i = four.length - 1; i >= 0; i--) {
      const iso = toIso(four[i][1], four[i][2], four[i][3]);
      if (iso) return iso;
    }
    const two = [...s.matchAll(/(\d{1,2})-(\d{1,2})-(\d{2})/g)];
    for (let i = two.length - 1; i >= 0; i--) {
      const iso = toIso(two[i][1], two[i][2], two[i][3]);
      if (iso) return iso;
    }
  }
  return null;
}

/** Site chrome (nav/about pages) — never scrapes as notices. */
const CHROME_HREF = /(^|\/)(Default\.htm|A-[A-Z]{2,}\.htm)$/i;

/** advertisement | result | admit_card | apply_portal | notice */
export function classifyItem(href, text) {
  const h = `${href} ${text}`.toLowerCase();
  const title = String(text);
  if (/admit/.test(h)) return "admit_card";
  if (/advt\/advt-|advt\.?\s*no\.?/i.test(`${href} ${text}`)) return "advertisement";
  if (/results-/i.test(href) || /^results:/i.test(title)) return "result";
  if (/apply online/i.test(title) || /applicationindex/i.test(href)) return "apply_portal";
  return "notice";
}

/**
 * Parse listing HTML -> [{ title, url, date, kind }], deduped by URL.
 * Skips empty/js/back-navigation anchors.
 */
export function extractItems(html, baseUrl) {
  const seen = new Set();
  const items = [];
  const re = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(String(html ?? ""))) !== null) {
    const rawHref = m[1].trim();
    if (!rawHref || /^(javascript:|#|mailto:)/i.test(rawHref)) continue;
    if (CHROME_HREF.test(rawHref)) continue;
    const url = resolveUrl(rawHref, baseUrl);
    if (!url || seen.has(url)) continue;
    const title = stripTags(m[2]);
    if (!title) continue;
    seen.add(url);
    items.push({
      title,
      url,
      date: extractDate(rawHref, title),
      kind: classifyItem(rawHref, title),
    });
  }
  return items;
}
