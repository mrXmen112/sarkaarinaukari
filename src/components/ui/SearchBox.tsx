"use client";

import { useSearchParams } from "next/navigation";

/**
 * Site search box (Phase 2). GET form into /jobs?q= — crawlable and works
 * without JS. The WebSite JSON-LD SearchAction points at the same endpoint.
 */
export function SearchBox({
  placeholder = "Search jobs — e.g. Bihar Police, BPSC, 10th pass",
}: {
  placeholder?: string;
}) {
  const params = useSearchParams();
  const initial = params.get("q") ?? "";

  return (
    <form
      action="/jobs"
      method="get"
      role="search"
      className="flex items-center gap-2"
    >
      <input type="hidden" name="status" value="all" />
      <input
        type="search"
        name="q"
        defaultValue={initial}
        placeholder={placeholder}
        aria-label="Search government jobs"
        className="w-full rounded-sm border border-rule bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-navy"
      />
      <button
        type="submit"
        className="gov-btn shrink-0 whitespace-nowrap"
      >
        Search
      </button>
    </form>
  );
}
