/**
 * IBPS (Institute of Banking Personnel Selection) adapter.
 *
 * https://www.ibps.in/index.php/recruitment is a server-rendered list of
 * recruitment notices: each row links either to an on-site notification PDF
 * (/wp-content/uploads/*.pdf) or to an ibpsreg.ibps.in registration portal,
 * with the registration window appended to the row text as
 * "DD-Mon-YYYY DD-Mon-YYYY".
 *
 * CAVEAT: ibps.in serves an incomplete TLS chain (the intermediate is not sent),
 * so a Node fetch needs the OS trust store (`NODE_OPTIONS=--use-system-ca`) and
 * their edge occasionally drops a connection (SSL "unexpected message"). Retrying
 * covers the latter; the former is a deploy-time env setting.
 */

export const SOURCE_NAME = "IBPS CRP Notifications";

const LISTING = "https://www.ibps.in/index.php/recruitment";

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

/** First "DD-Mon-YYYY" in the row text (the registration start date). */
export function extractDate(_href, text) {
  const m = String(text).match(/(\d{1,2})-([A-Za-z]{3})[a-z]*-(\d{4})/);
  if (!m) return null;
  const dd = Number(m[1]);
  const mm = MONTHS[m[2].toLowerCase()];
  const yyyy = Number(m[3]);
  if (!mm || dd < 1 || dd > 31 || yyyy < 2000 || yyyy > 2099) return null;
  return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

/** advertisement | result | admit_card | notice */
export function classifyItem(href, text) {
  const h = `${href} ${text}`.toLowerCase();
  if (/result/.test(h)) return "result";
  if (/admit|call letter/.test(h)) return "admit_card";
  return "notice";
}

/** Only real notice rows: registration portals and on-site PDFs. */
export function extractItems(html, baseUrl) {
  const seen = new Set();
  const items = [];
  const re = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(String(html ?? ""))) !== null) {
    const rawHref = m[1].trim();
    if (!/ibpsreg\.ibps\.in\/|ibps\.in\/wp-content\/uploads\/.*\.pdf/i.test(rawHref)) continue;
    let url;
    try {
      url = new URL(rawHref, baseUrl).toString();
    } catch {
      continue;
    }
    if (seen.has(url)) continue;
    const title = stripTags(m[2]);
    if (title.length < 8) continue;
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
