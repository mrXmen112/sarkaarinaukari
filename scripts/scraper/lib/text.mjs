/**
 * HTML -> clean text for raw_scrapes.raw_content.
 *
 * Dependency-free: strips scripts/styles/nav/footer/header/aside/noscript/
 * boilerplate, drops all remaining tags, decodes common entities, collapses
 * whitespace. This stores *extracted text*, never full raw HTML (per the
 * pipeline doc), keeping rows small and the later LLM step focused.
 */

const DROP_TAGS =
  /<(script|style|nav|footer|header|aside|noscript|iframe|form|button)[\s\S]*?<\/\1>/gi;

const ENTITY_MAP = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
  "&rsquo;": "'",
  "&lsquo;": "'",
  "&rdquo;": '"',
  "&ldquo;": '"',
  "&ndash;": "-",
  "&mdash;": "-",
};

export function htmlToCleanText(html) {
  let text = String(html ?? "");
  text = text.replace(DROP_TAGS, " ");
  text = text.replace(/<!--[\s\S]*?-->/g, " ");
  text = text.replace(/<[^>]*>/g, " ");
  text = text.replace(/&(#[0-9]+|#[xX][0-9a-fA-F]+|[a-zA-Z]+);/g, (m) => {
    if (ENTITY_MAP[m] !== undefined) return ENTITY_MAP[m];
    const dec = m.match(/^&#([0-9]+);$/);
    if (dec) return String.fromCharCode(Number(dec[1]));
    const hex = m.match(/^&#[xX]([0-9a-fA-F]+);$/);
    if (hex) return String.fromCharCode(parseInt(hex[1], 16));
    return " ";
  });
  return text.replace(/[ \t\u00a0]+/g, " ").replace(/\n\s*\n\s*\n+/g, "\n\n").trim();
}
