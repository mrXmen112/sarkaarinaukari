import Link from "next/link";

import { buildQuery, cn } from "@/lib/utils";

/**
 * Link-based pagination (not infinite scroll — Section 4.1, for SEO
 * crawlability). Every page of results gets a canonical, crawlable URL.
 */
export function Pagination({
  page,
  totalPages,
  basePath,
  params = {},
}: {
  /** 1-based current page. */
  page: number;
  totalPages: number;
  basePath: string;
  /** Current filters etc. to carry across pages (excluding `page`). */
  params?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const hrefFor = (p: number) =>
    `${basePath}${buildQuery({ ...params, page: p > 1 ? String(p) : undefined })}`;

  // Window of page numbers around the current page, with first/last pinned.
  const windowSize = 2;
  const pages = new Set<number>([1, totalPages]);
  for (
    let p = Math.max(1, page - windowSize);
    p <= Math.min(totalPages, page + windowSize);
    p++
  ) {
    pages.add(p);
  }
  const ordered = [...pages].sort((a, b) => a - b);

  return (
    <nav aria-label="Pagination" className="mt-4">
      <ul className="flex flex-wrap items-center justify-center gap-1.5 text-sm">
        <li>
          {page > 1 ? (
            <PageLink href={hrefFor(page - 1)} label="Previous" rel="prev" />
          ) : (
            <PageStub label="Previous" />
          )}
        </li>

        {ordered.map((p, i) => {
          const gap = i > 0 && p - ordered[i - 1] > 1;
          return (
            <li key={p} className="contents">
              {gap ? (
                <span aria-hidden="true" className="px-1 text-ink-faint">
                  &hellip;
                </span>
              ) : null}
              {p === page ? (
                <span
                  aria-current="page"
                  className="rounded-sm border border-navy bg-navy px-2.5 py-1 font-bold text-white"
                >
                  {p}
                </span>
              ) : (
                <PageLink href={hrefFor(p)} label={String(p)} />
              )}
            </li>
          );
        })}

        <li>
          {page < totalPages ? (
            <PageLink href={hrefFor(page + 1)} label="Next" rel="next" />
          ) : (
            <PageStub label="Next" />
          )}
        </li>
      </ul>
    </nav>
  );
}

function PageLink({
  href,
  label,
  rel,
}: {
  href: string;
  label: string;
  rel?: string;
}) {
  return (
    <Link
      href={href}
      rel={rel}
      className={cn(
        "rounded-sm border border-rule-strong bg-surface px-2.5 py-1 font-semibold text-navy no-underline hover:bg-navy-50",
      )}
    >
      {label}
    </Link>
  );
}

function PageStub({ label }: { label: string }) {
  return (
    <span className="cursor-not-allowed rounded-sm border border-rule bg-page px-2.5 py-1 text-ink-faint">
      {label}
    </span>
  );
}
