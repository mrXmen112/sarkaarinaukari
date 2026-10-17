/**
 * Employment News (Publications Division) adapter.
 *
 * The "Web Advertisement" page lists individual vacancy advertisements as
 * server-rendered PDFs under /writereaddata/, each titled
 * "<Organisation> ( Issue no NN , DD Month - DD Month YYYY )". The filename
 * begins with the publication date as DDMMYYYY (e.g.
 * 051020262997412775.pdf -> 05-10-2026), which is the most reliable date.
 *
 * Chrome/nav PDFs (rate card, business policy) are excluded by requiring the
 * dated /writereaddata/<DDMMYYYY>... pattern.
 */

export const SOURCE_NAME = "Employment News Weekly Digest";

const LISTING = "https://employmentnews.gov.in/NewEmp/MoreContentS.aspx?n=WebAdvertisement";

export function listingUrl(source) {
  return LISTING || source.base_url;
}

function stripTags(s) {
  return String(s ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const MONTHS = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

function iso(yyyy, mm, dd) {
  if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12 && yyyy >= 2000 && yyyy <= 2099) {
    return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  }
  return null;
}

/** Publication date from the /writereaddata/<DDMMYYYY>... filename prefix. */
function filenameDate(href) {
  const m = String(href).match(/writereaddata\/(\d{2})(\d{2})(\d{4})/i);
  return m ? iso(Number(m[3]), Number(m[2]), Number(m[1])) : null;
}

/** "03 October 2026" (start of the issue range) from the anchor text. */
function textDate(text) {
  const m = String(text).match(/(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})/);
  if (!m) return null;
  const mm = MONTHS[m[2].slice(0, 3).toLowerCase()];
  return mm ? iso(Number(m[3]), mm, Number(m[1])) : null;
}

export function extractDate(href, text) {
  return filenameDate(href) ?? textDate(text);
}

/** advertisement | result | admit_card | notice */
export function classifyItem(href, text) {
  const h = `${href} ${text}`.toLowerCase();
  if (/admit|call letter/.test(h)) return "admit_card";
  if (/\bresult/.test(h)) return "result";
  if (/answer key/.test(h)) return "notice";
  return "advertisement";
}

/** Dated vacancy advert PDFs only — deduped by URL. */
export function extractItems(html, baseUrl) {
  const seen = new Set();
  const items = [];
  const re = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(String(html ?? ""))) !== null) {
    const rawHref = m[1].trim();
    if (!/writereaddata\/\d{8}\d*\.pdf/i.test(rawHref)) continue;
    let url;
    try {
      url = new URL(rawHref, baseUrl).toString();
    } catch {
      continue;
    }
    if (seen.has(url)) continue;
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
