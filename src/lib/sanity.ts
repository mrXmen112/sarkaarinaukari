/**
 * W5.4 — data sanity for the category-keyed JSON columns
 * (vacancy_breakdown, application_fee, age_relaxation).
 *
 * These columns are hand-written JSON in the admin form, so they accumulate the
 * usual scraped-data cruft: `{"female": 0}` placeholder rows, a breakdown whose
 * parts do not add up to the stated total, and the same fee written twice as
 * "All categories" and "General".
 *
 * The rule everywhere in this file is: hide it rather than print a wrong or
 * meaningless number. "0 vacancies for Female" is not information — it is a
 * field the notification did not fill in; "Nil" and "N/A" printed next to a
 * real category look like data and are worse than an empty cell.
 *
 * Every function is pure and returns `null` to mean "show nothing".
 */

/**
 * Category spellings that all mean the same thing. Keys here are already in the
 * canonical form produced by normaliseKey (lowercase, underscore-separated).
 */
const KEY_ALIASES: Record<string, string> = {
  all: "all",
  all_categories: "all",
  all_category: "all",
  all_categories_combined: "all",
  total: "all",
};

/**
 * Fold a raw JSON key to a canonical form: lowercase, brackets removed, every
 * run of non-alphanumeric characters collapsed to a single underscore. So
 * "SC/ST", "sc_st" and "SC - ST" all become "sc_st".
 *
 * The underscore form is deliberate: it is exactly the shape the display helper
 * `categoryLabel()` looks up (`sc_st` -> "SC / ST", `obc_ncl` -> "OBC (NCL)"), so
 * a canonical key renders correctly instead of falling through to the generic
 * title-caser and printing "Sc st".
 */
function normaliseKey(key: string): string {
  const k = key
    .trim()
    .toLowerCase()
    .replace(/[()[\]{}]+/g, " ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return KEY_ALIASES[k] ?? k;
}

export type CategoryRow = { key: string; value: number };

function numericRows(data: Record<string, unknown> | null | undefined): CategoryRow[] {
  if (!data) return [];
  const out: CategoryRow[] = [];
  for (const [rawKey, rawValue] of Object.entries(data)) {
    const value = typeof rawValue === "number" ? rawValue : Number(rawValue);
    if (!Number.isFinite(value)) continue;
    out.push({ key: normaliseKey(rawKey), value });
  }
  return out;
}

/**
 * Merge rows that normalise to the same key (e.g. "Sc/St" and "sc_st"): a
 * duplicate category should appear once, with its parts summed.
 */
function mergeByKey(rows: CategoryRow[]): CategoryRow[] {
  const order: string[] = [];
  const byKey = new Map<string, number>();
  for (const { key, value } of rows) {
    if (!byKey.has(key)) {
      byKey.set(key, 0);
      order.push(key);
    }
    byKey.set(key, (byKey.get(key) ?? 0) + value);
  }
  return order.map((key) => ({ key, value: byKey.get(key) ?? 0 }));
}

/**
 * Category-wise VACANCIES.
 *
 * - rows of 0 are dropped (a "Female: 0" placeholder is not a vacancy count);
 * - duplicates are merged;
 * - if a total is known and the parts do not sum to it, the whole breakdown is
 *   withheld (null). A breakdown that contradicts the headline total is exactly
 *   the kind of number Google and readers punish, and we would rather show the
 *   total alone than a set of parts that lie.
 */
export function cleanVacancyBreakdown(
  data: Record<string, unknown> | null | undefined,
  total: number | null | undefined,
): CategoryRow[] | null {
  const rows = mergeByKey(numericRows(data)).filter((r) => r.value > 0);
  if (rows.length === 0) return null;

  const sum = rows.reduce((acc, r) => acc + r.value, 0);
  if (typeof total === "number" && total > 0 && sum !== total) return null;

  return rows;
}

/**
 * Category-wise FEES.
 *
 * Unlike vacancies, a fee of 0 is meaningful ("exempt"), so 0 rows are kept and
 * rendered as "No fee". Aliases are merged, and — the case W5 called out — if
 * every row ends up with the SAME value we collapse the set to a single
 * "All categories" row instead of printing "All categories: Nil" and
 * "General: Nil" one under the other.
 */
export function cleanFees(
  data: Record<string, unknown> | null | undefined,
): CategoryRow[] | null {
  const rows = mergeByKey(numericRows(data));
  if (rows.length === 0) return null;

  const allEqual = rows.every((r) => r.value === rows[0].value);
  if (allEqual && rows.length > 1) {
    return [{ key: "all", value: rows[0].value }];
  }
  return rows;
}

/**
 * Age relaxation. 0 means "no relaxation for this category", which IS a fact
 * worth stating, so these rows are kept — the display maps 0 to "No relaxation"
 * rather than "0 years". Empty input still means show nothing.
 */
export function cleanAgeRelaxation(
  data: Record<string, unknown> | null | undefined,
): CategoryRow[] | null {
  const rows = mergeByKey(numericRows(data));
  return rows.length ? rows : null;
}

/**
 * A general display guard: should this field be rendered at all? Treats null,
 * undefined, "", and the literal placeholder strings as "nothing to show".
 */
export function hasDisplayValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    return v !== "" && v !== "n/a" && v !== "na" && v !== "nil" && v !== "-" && v !== "—";
  }
  return true;
}
