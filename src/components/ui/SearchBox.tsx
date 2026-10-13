"use client";

import { useSearchParams } from "next/navigation";

import { T } from "@/components/i18n/T";
import { SEARCH_PLACEHOLDER } from "@/lib/i18n";

/**
 * Site search box (Phase 2/4F). GET form into /jobs?q= — crawlable and works
 * without JS. The WebSite JSON-LD SearchAction points at the same endpoint.
 *
 * One input only (a second name="q" would submit twice); the placeholder is
 * swapped by the language switcher.
 */
export function SearchBox() {
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
        placeholder={SEARCH_PLACEHOLDER.en}
        data-placeholder-en={SEARCH_PLACEHOLDER.en}
        data-placeholder-hi={SEARCH_PLACEHOLDER.hi}
        aria-label="Search government jobs"
        className="w-full rounded-sm border border-rule bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-navy"
      />
      <button type="submit" className="gov-btn shrink-0 whitespace-nowrap">
        <T k="search" />
      </button>
    </form>
  );
}