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

/** First DD-MM-YYYY (or DD-MM-YY) found in href, else in text. Null if none. */
export function extractDate(href, text) {
  for (const src of [href, text]) {
    const m = String(src ?? "").match(/(\d{1,2})-(\d{1,2})-(\d{2,4})/);
    if (m) {
      const dd = m[1].padStart(2, "0");
      const mm = m[2].padStart(2, "0");
      const yyyy = m[3].length === 2 ? `20${m[3]}` : m[3];
      if (Number(mm) >= 1 && Number(mm) <= 12 && Number(dd) >= 1 && Number(dd) <= 31) {
        return `${yyyy}-${mm}-${dd}`;
      }
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
