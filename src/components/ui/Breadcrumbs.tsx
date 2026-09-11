import Link from "next/link";

import { cn } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

/**
 * Breadcrumb trail rendered above the page title. Compact, grey-on-white,
 * and hidden on very small screens where it adds little (titles are short).
 * JSON-LD BreadcrumbList is emitted by each page separately.
 */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("mb-2.5 text-xs", className)}>
      <ol className="flex flex-wrap items-center gap-x-1.5 text-ink-faint">
        <li>
          <Link href="/" className="text-ink-muted no-underline hover:underline">
            Home
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={i} className="flex min-w-0 items-center gap-x-1.5">
            <span aria-hidden="true" className="text-rule-strong">
              ›
            </span>
            {item.href ? (
              <Link
                href={item.href}
                className="truncate text-ink-muted no-underline hover:underline"
              >
                {item.label}
              </Link>
            ) : (
              <span className="truncate font-semibold text-ink">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}