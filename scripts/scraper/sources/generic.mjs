/**
 * Generic official-notice adapter for the nationwide source registry.
 *
 * It deliberately does NOT guess content: it only returns links that are
 * actual notice documents (PDF or a URL containing a recruitment keyword) and
 * whose anchor text is long enough to be a title. Dates and kinds are extracted
 * only when present verbatim; anything else is left null for the verifier to
 * reject rather than invented.
 */
export const SOURCE_NAME = "Generic Official Notices";

const MONTHS = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

const NOTICE_HINT =
  /recruit|vacanc|advert|advt|notification|notice|apply|application|career|result|admit|hall.?ticket|answer.?key|scheme|yojana/i;

function stripTags(value) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function listingUrl(source) {
  return source?.base_url ?? "";
}

export function extractDate(href, text) {
  const s = `${href} ${text}`;
  let m = s.match(/(\d{1,2})[-/\s]([A-Za-z]{3})[a-z]*[-/\s](\d{4})/);
  if (m) {
    const mm = MONTHS[m[2].toLowerCase().slice(0, 3)];
    const dd = Number(m[1]);
    const yyyy = Number(m[3]);
    if (mm && dd >= 1 && dd <= 31 && yyyy >= 2000 && yyyy <= 2100) {
      return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
    }
  }
  m = s.match(/\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/);
  if (m) {
    return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  }
  return null;
}

export function classifyItem(href, text) {
  const h = `${href} ${text}`.toLowerCase();
  if (/answer.?key/.test(h)) return "answer_key";
  if (/result/.test(h)) return "result";
  if (/admit|hall.?ticket|call letter/.test(h)) return "admit_card";
  if (/scheme|yojana/.test(h)) return "scheme";
  return "notice";
}

export function extractItems(html, baseUrl) {
  const seen = new Set();
  const items = [];
  const re = /<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(String(html ?? ""))) !== null) {
    const href = m[1].trim();
    const title = stripTags(m[2]);
    if (title.length < 10 || !NOTICE_HINT.test(`${href} ${title}`)) continue;
    let url;
    try {
      url = new URL(href, baseUrl).toString();
    } catch {
      continue;
    }
    if (seen.has(url)) continue;
    seen.add(url);
    items.push({
      title,
      url,
      date: extractDate(href, title),
      kind: classifyItem(href, title),
    });
  }
  return items;
}
