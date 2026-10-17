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

/* ------------------------------------------------------------------ *
 * W5.4 (SAVE side) — validation + normalisation.
 *
 * The functions above HIDE bad data at render time; the ones below stop it
 * being written at all. Both the admin approve action and the pipeline use
 * them, so a "Female: 0" placeholder, a duplicated fee row or a breakdown
 * that contradicts its total is rejected (or normalised away) with a message
 * a reviewer can act on — never silently persisted.
 * ------------------------------------------------------------------ */

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/** Strings that mean "no value" where a number is expected (dropped, not rejected). */
const PLACEHOLDER_NUM = new Set(["", "nil", "n/a", "na", "none", "-", "—"]);

export type NumberMapResult =
  | { ok: true; map: Record<string, number> }
  | { ok: false; error: string };

/**
 * Parse a category-keyed JSON column from the admin form into numbers.
 * Empty input is a valid empty map. Placeholder strings ("Nil", "-", "N/A")
 * are dropped (normalised away). Anything that is not a JSON object of
 * numbers is rejected with the offending key named.
 */
export function parseNumberMap(raw: string | null | undefined): NumberMapResult {
  const t = (raw ?? "").trim();
  if (!t) return { ok: true, map: {} };
  let parsed: unknown;
  try {
    parsed = JSON.parse(t);
  } catch {
    return { ok: false, error: "must be valid JSON" };
  }
  if (!isPlainObject(parsed)) {
    return { ok: false, error: "must be a JSON object of category: number" };
  }
  const map: Record<string, number> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value === "number") {
      if (!Number.isFinite(value)) return { ok: false, error: `"${key}" must be a number` };
      map[key] = value;
    } else if (typeof value === "string") {
      const v = value.trim();
      if (PLACEHOLDER_NUM.has(v.toLowerCase())) continue;
      const n = Number(v);
      if (!Number.isFinite(n)) return { ok: false, error: `"${key}" must be a number` };
      map[key] = n;
    } else {
      return { ok: false, error: `"${key}" must be a number` };
    }
  }
  return { ok: true, map };
}

/**
 * Raw keys that fold to the same canonical category ("All categories" +
 * "Total", or "SC/ST" + "sc_st"). Two rows for one category is the duplicate
 * fee case W5 called out.
 */
export function duplicateCategoryKeys(
  raw: string | null | undefined,
): { ok: true; groups: { key: string; rawKeys: string[] }[] } | { ok: false; error: string } {
  const t = (raw ?? "").trim();
  if (!t) return { ok: true, groups: [] };
  let parsed: unknown;
  try {
    parsed = JSON.parse(t);
  } catch {
    return { ok: false, error: "must be valid JSON" };
  }
  if (!isPlainObject(parsed)) return { ok: false, error: "must be a JSON object" };
  const byKey = new Map<string, string[]>();
  for (const key of Object.keys(parsed)) {
    const c = normaliseKey(key);
    const arr = byKey.get(c) ?? [];
    arr.push(key);
    byKey.set(c, arr);
  }
  const groups = [...byKey.entries()]
    .filter(([, keys]) => keys.length > 1)
    .map(([key, rawKeys]) => ({ key, rawKeys }));
  return { ok: true, groups };
}

function formatGroups(groups: { rawKeys: string[] }[]): string {
  return groups.map((g) => g.rawKeys.map((k) => `"${k}"`).join(" and ")).join("; ");
}

/**
 * Save-side gate for a JOB's three category JSON columns. Returns a
 * reviewer-facing error message, or null when the columns are safe to store.
 *  - vacancy_breakdown must parse and, when vacancy_total is known, sum to it;
 *  - application_fee must parse and must not contain duplicate categories;
 *  - age_relaxation must parse.
 */
export function validateJobJsonFields(fields: Record<string, string>): string | null {
  const vb = parseNumberMap(fields.vacancy_breakdown);
  if (!vb.ok) return `Vacancy breakdown ${vb.error}.`;
  const totalRaw = (fields.vacancy_total ?? "").trim();
  if (/^\d+$/.test(totalRaw)) {
    const total = Number(totalRaw);
    const parts = Object.values(vb.map).filter((v) => v > 0);
    const sum = parts.reduce((a, b) => a + b, 0);
    if (parts.length > 0 && sum !== total) {
      return `Vacancy breakdown sums to ${sum} but total vacancies is ${total}.`;
    }
  }

  const fee = parseNumberMap(fields.application_fee);
  if (!fee.ok) return `Application fee ${fee.error}.`;
  const dup = duplicateCategoryKeys(fields.application_fee);
  if (!dup.ok) return `Application fee ${dup.error}.`;
  if (dup.groups.length > 0) {
    return `Duplicate fee rows: ${formatGroups(dup.groups)} are the same category — keep one.`;
  }

  const age = parseNumberMap(fields.age_relaxation);
  if (!age.ok) return `Age relaxation ${age.error}.`;

  return null;
}

/**
 * Normalise a JOB draft before saving: drop zero/placeholder vacancy rows,
 * drop placeholder strings from the fee and age columns, and re-serialise as
 * canonical JSON. Values that fail to parse are left untouched so
 * validateJobJsonFields can still reject them with a clear message.
 */
export function normaliseJobJsonFields(fields: Record<string, string>): Record<string, string> {
  const out = { ...fields };
  const vb = parseNumberMap(fields.vacancy_breakdown);
  if (vb.ok) {
    const kept = Object.fromEntries(Object.entries(vb.map).filter(([, v]) => v > 0));
    out.vacancy_breakdown = Object.keys(kept).length ? JSON.stringify(kept) : "";
  }
  const fee = parseNumberMap(fields.application_fee);
  if (fee.ok) {
    out.application_fee = Object.keys(fee.map).length ? JSON.stringify(fee.map) : "";
  }
  const age = parseNumberMap(fields.age_relaxation);
  if (age.ok) {
    out.age_relaxation = Object.keys(age.map).length ? JSON.stringify(age.map) : "";
  }
  return out;
}
