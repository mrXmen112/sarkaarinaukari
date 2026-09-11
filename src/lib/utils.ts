/**
 * Small, dependency-free helpers shared across the app.
 */

/** Merge conditional class names. Deliberately tiny — no clsx dependency. */
export function cn(
  ...parts: (string | false | null | undefined)[]
): string {
  return parts.filter(Boolean).join(" ");
}

/** Convert a title into a URL-safe slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['".]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

/** Turn a slug back into a readable label: "bihar-police" -> "Bihar Police". */
export function unslugify(slug: string): string {
  return slug
    .split("-")
    .map((w) => (w.length <= 3 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

/** Format a number in the Indian numbering system (1,23,456). */
export function formatIndianNumber(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-IN").format(n);
}

/** Format rupees: 100 -> "₹100", 0 -> "Nil". */
export function formatRupees(v: number | string | null | undefined): string {
  if (v === null || v === undefined || v === "") return "—";
  const n = typeof v === "string" ? Number(v) : v;
  if (Number.isNaN(n)) return String(v);
  if (n === 0) return "Nil";
  return `₹${formatIndianNumber(n)}`;
}

/**
 * Prettify a jsonb key used for social categories.
 * "sc_st" -> "SC / ST", "general" -> "General", "obc_ncl" -> "OBC NCL"
 */
const CATEGORY_LABELS: Record<string, string> = {
  general: "General / UR",
  ur: "General / UR",
  obc: "OBC",
  obc_ncl: "OBC (NCL)",
  sc: "SC",
  st: "ST",
  sc_st: "SC / ST",
  ews: "EWS",
  pwd: "PwD",
  pwbd: "PwBD",
  female: "Female",
  ex_servicemen: "Ex-Servicemen",
  all: "All Categories",
};

export function categoryLabel(key: string): string {
  const k = key.toLowerCase();
  if (CATEGORY_LABELS[k]) return CATEGORY_LABELS[k];
  return k
    .split("_")
    .map((p) => (p.length <= 3 ? p.toUpperCase() : p[0].toUpperCase() + p.slice(1)))
    .join(" ");
}

/** Truncate on a word boundary, for meta descriptions and table cells. */
export function truncate(text: string | null | undefined, max = 160): string {
  if (!text) return "";
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, clean.lastIndexOf(" ", max - 1)).trimEnd() + "…";
}

/** Build a query string, dropping empty/default values. */
export function buildQuery(
  params: Record<string, string | number | undefined | null>,
): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "" || v === "all") continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/** Read the first value of a Next.js searchParams entry. */
export function firstParam(
  v: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

/** Clamp a page number read from the URL. */
export function parsePage(v: string | string[] | undefined): number {
  const raw = Number(firstParam(v));
  if (!Number.isFinite(raw) || raw < 1) return 1;
  return Math.floor(raw);
}

/** Is this an external (off-site) link? */
export function isExternal(href: string | null | undefined): boolean {
  return !!href && /^https?:\/\//i.test(href);
}
