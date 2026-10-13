import Link from "next/link";

import { HeaderNav } from "@/components/layout/HeaderNav";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { T } from "@/components/i18n/T";
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
            <T k="independentPortal" />
          </p>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/login"
              className="hidden font-semibold text-white no-underline hover:underline sm:block"
            >
              <T k="loginRegister" />
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      <HeaderNav items={PRIMARY_NAV} tagline={SITE.tagline} />
    </header>
  );
}
