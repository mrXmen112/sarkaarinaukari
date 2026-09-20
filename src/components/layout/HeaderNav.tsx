"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import type { NavItem } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Brand row + primary navigation.
 *
 * These live in one client component because the mobile menu button (in the
 * brand row) and the nav list (in the bar beneath it) share open/closed state.
 */
export function HeaderNav({
  items,
  tagline,
}: {
  items: NavItem[];
  tagline: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the panel whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Brand row */}
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2.5">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2.5 no-underline hover:no-underline"
        >
          <Image
            src="/logo-full.svg"
            alt="SarkaariNaukari logo"
            width={160}
            height={40}
            className="shrink-0 h-auto w-auto"
            style={{ maxWidth: "160px", maxHeight: "40px" }}
          />
          <span className="hidden sm:block text-xs text-navy-100">
            {tagline}
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="primary-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className="ml-auto inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-navy-400 text-white md:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            {open ? (
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M3 6h14M3 10h14M3 14h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Nav bar */}
      <nav
        id="primary-nav"
        aria-label="Primary"
        className={cn(
          "border-t border-navy-400 bg-navy-600 md:block",
          open ? "block" : "hidden",
        )}
      >
        <ul className="mx-auto flex max-w-6xl flex-col md:flex-row md:flex-wrap md:items-stretch md:px-1">
          {items.map((item) => (
            <li key={item.href} className="border-b border-navy-400 md:border-b-0">
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "block px-3.5 py-2.5 text-sm font-semibold text-white no-underline transition-colors hover:bg-navy-700 hover:no-underline md:border-b-[3px] md:border-transparent md:py-2",
                  isActive(item.href) && "bg-navy-800 md:border-saffron md:bg-navy-700",
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
          <li className="border-b border-navy-400 md:hidden">
            <Link
              href="/login"
              className="block px-3.5 py-2.5 text-sm font-semibold text-saffron no-underline hover:bg-navy-700 hover:no-underline"
            >
              Login / Register
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
}
