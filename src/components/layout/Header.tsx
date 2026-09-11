import Link from "next/link";

import { HeaderNav } from "@/components/layout/HeaderNav";
import { PRIMARY_NAV, SITE } from "@/lib/site";

/**
 * Sticky site header: independent-portal strip, brand row, primary nav.
 * Flat colours only — no gradients or shadows (Section 1).
 */
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-saffron bg-navy">
      {/* Top strip: sets expectations before anything else renders. */}
      <div className="border-b border-navy-400 bg-navy-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-1 text-xs text-navy-100">
          <p className="truncate">
            An independent job information portal &middot; Not a government website
          </p>
          <Link
            href="/login"
            className="hidden shrink-0 font-semibold text-white no-underline hover:underline sm:block"
          >
            Login / Register
          </Link>
        </div>
      </div>

      <HeaderNav items={PRIMARY_NAV} tagline={SITE.tagline} />
    </header>
  );
}
