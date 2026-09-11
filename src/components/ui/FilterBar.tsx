import Link from "next/link";

import { buildQuery } from "@/lib/utils";

export type FilterDef = {
  /** Query-string key, e.g. "state". */
  name: string;
  label: string;
  /** Currently selected value ("" or missing = all). */
  value?: string;
  options: { label: string; value: string }[];
  /** Label for the unselected option. Defaults to `All {label}`. */
  allLabel?: string;
};

/**
 * Listing filter controls rendered as a plain GET form.
 *
 * Deliberately no client JS: selects + a submit button work without
 * hydration, produce crawlable URLs, and share Supabase-rendered pages
 * across filter combos via the CDN cache. Hidden inputs carry through any
 * current params that aren't part of this filter set (except `page`, which
 * always resets to 1 when a filter changes).
 */
export function FilterBar({
  action,
  filters,
  carryParams = {},
  submitLabel = "Search",
}: {
  action: string;
  filters: FilterDef[];
  /** Extra query params to preserve, e.g. { sort: "closing" }. */
  carryParams?: Record<string, string | undefined>;
  submitLabel?: string;
}) {
  const carried = Object.entries(carryParams).filter(
    ([name]) => !filters.some((f) => f.name === name),
  );

  const clearHref = `${action}${buildQuery(carryParams)}`;

  return (
    <search
      aria-label="Filter listings"
      className="mb-4 border border-rule bg-surface"
    >
      <form
        action={action}
        method="get"
        className="grid grid-cols-1 gap-2.5 p-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end"
      >
        {carried.map(([name, value]) =>
          value === undefined ? null : (
            <input key={name} type="hidden" name={name} value={value} />
          ),
        )}

        {filters.map((filter) => (
          <div key={filter.name} className="min-w-0 lg:w-44">
            <label
              htmlFor={`filter-${filter.name}`}
              className="mb-0.5 block text-xs font-semibold text-ink-muted"
            >
              {filter.label}
            </label>
            <select
              id={`filter-${filter.name}`}
              name={filter.name}
              defaultValue={filter.value ?? ""}
              className="gov-select"
            >
              <option value="">
                {filter.allLabel ?? `All ${filter.label}s`}
              </option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
          <button type="submit" className="gov-btn">
            {submitLabel}
          </button>
          <Link href={clearHref} className="gov-btn gov-btn-secondary">
            Reset
          </Link>
        </div>
      </form>
    </search>
  );
}
