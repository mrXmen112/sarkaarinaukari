import Link from "next/link";

import { formatDate } from "@/lib/date";
import type { RecentUpdate } from "@/lib/queries";

const BASE: Record<RecentUpdate["kind"], string> = {
  "admit-card": "admit-card",
  result: "result",
  "answer-key": "answer-key",
};

const LABEL: Record<RecentUpdate["kind"], string> = {
  "admit-card": "Admit Card",
  result: "Result",
  "answer-key": "Answer Key",
};

/**
 * "Recent Exam Updates" rail — the three exam-update tables merged and sorted
 * newest-first. Extracted from the Bihar hub (W5.8) so the homepage fallback and
 * the hub render the same list rather than two copies that drift.
 *
 * Returns null when there is nothing to show, so callers can drop it in
 * unconditionally and empty blocks disappear on their own.
 */
export function RecentUpdatesPanel({
  updates,
  ariaLabel = "Recent exam updates",
  title = "Recent Exam Updates",
}: {
  updates: RecentUpdate[];
  ariaLabel?: string;
  title?: string;
}) {
  if (updates.length === 0) return null;

  return (
    <section aria-label={ariaLabel} className="gov-panel mb-4">
      <div className="gov-panel-title">
        <h2 className="font-serif text-base font-bold text-white">{title}</h2>
      </div>
      <ul className="divide-y divide-rule p-2">
        {updates.map((u) => (
          <li key={`${u.kind}-${u.slug}`} className="py-2">
            <p className="mb-0.5 text-[0.6875rem] font-bold tracking-wide uppercase text-ingreen">
              {LABEL[u.kind]}
            </p>
            <Link
              href={`/${BASE[u.kind]}/${u.slug}`}
              className="font-semibold text-navy no-underline hover:text-alert hover:underline"
            >
              {u.title}
            </Link>
            <p className="mt-0.5 text-xs text-ink-faint">
              {u.date ? formatDate(u.date) : ""}
            </p>
          </li>
        ))}
      </ul>
      <div className="border-t border-rule p-2">
        <Link
          href="/admit-card"
          className="text-xs font-semibold text-navy no-underline hover:text-alert hover:underline"
        >
          View all admit cards &amp; results &rarr;
        </Link>
      </div>
    </section>
  );
}
