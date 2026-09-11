import Link from "next/link";

import { DISCLAIMER, FOOTER_NAV, SITE } from "@/lib/site";

/**
 * Site footer: sitemap links + the mandatory non-affiliation disclaimer
 * required on every page (Section 6).
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-8 border-t-[3px] border-saffron bg-navy text-navy-100">
      {/* Sitemap columns */}
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-6 px-3 py-7 md:grid-cols-4">
        {FOOTER_NAV.map((col) => (
          <nav key={col.heading} aria-labelledby={`footcol-${col.heading}`}>
            <h2
              id={`footcol-${col.heading}`}
              className="mb-2 border-b border-navy-400 pb-1.5 font-serif text-sm font-bold text-white"
            >
              {col.heading}
            </h2>
            <ul className="space-y-1.5">
              {col.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-navy-100 no-underline hover:text-saffron hover:underline"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      {/* Disclaimer — mandatory, every page */}
      <div className="border-t border-navy-400 bg-navy-800">
        <div className="mx-auto max-w-6xl px-3 py-4">
          <h2 className="mb-1 font-serif text-sm font-bold text-saffron">
            Disclaimer
          </h2>
          <p className="text-xs leading-relaxed text-navy-100">{DISCLAIMER}</p>
        </div>
      </div>

      {/* Colophon */}
      <div className="border-t border-navy-400 bg-navy-900">
        <div className="mx-auto flex max-w-6xl flex-col gap-1.5 px-3 py-3 text-xs text-navy-200 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {year} {SITE.name}. All rights reserved.
          </p>
          <p className="flex flex-wrap gap-x-3 gap-y-1">
            <Link href="/privacy" className="text-navy-200 no-underline hover:underline">
              Privacy
            </Link>
            <Link href="/terms" className="text-navy-200 no-underline hover:underline">
              Terms
            </Link>
            <Link href="/disclaimer" className="text-navy-200 no-underline hover:underline">
              Disclaimer
            </Link>
            <Link href="/contact" className="text-navy-200 no-underline hover:underline">
              Contact
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
