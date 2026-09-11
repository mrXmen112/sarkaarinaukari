import Link from "next/link";

import { cn } from "@/lib/utils";

export type Notice = {
  label: string;
  href: string;
  /** Optional tag rendered before the label, e.g. "RESULT". */
  tag?: string;
};

/**
 * Auto-scrolling "Latest Updates" ticker (Section 1).
 *
 * Pure CSS animation — no JS, so it costs nothing on the client and never
 * blocks hydration. Two identical tracks are rendered so the loop is seamless.
 * Pauses on hover/focus, and `prefers-reduced-motion` turns it into a plain
 * horizontally-scrollable list (see globals.css).
 */
export function NoticeBar({ items }: { items: Notice[] }) {
  if (!items.length) return null;

  return (
    <section
      aria-label="Latest updates"
      className="border-b border-rule bg-alert-bg"
    >
      <div className="mx-auto flex max-w-6xl items-stretch">
        <p className="flex shrink-0 items-center gap-1.5 bg-alert px-2.5 py-1.5 text-xs font-bold tracking-wide text-white uppercase">
          <span
            aria-hidden="true"
            className="inline-block h-2 w-2 rounded-full bg-white"
          />
          Latest Updates
        </p>

        <div className="group relative flex min-w-0 flex-1 overflow-hidden">
          {/* Two tracks = seamless wrap. The second is a11y-hidden so screen
              readers and crawlers only see each notice once. */}
          <Track items={items} />
          <Track items={items} ariaHidden />
        </div>
      </div>
    </section>
  );
}

function Track({
  items,
  ariaHidden = false,
}: {
  items: Notice[];
  ariaHidden?: boolean;
}) {
  return (
    <ul
      aria-hidden={ariaHidden || undefined}
      className={cn(
        "marquee-track gap-0 py-1.5 group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]",
      )}
    >
      {items.map((item, i) => (
        <li
          key={`${item.href}-${i}`}
          className="flex shrink-0 items-center whitespace-nowrap"
        >
          <span aria-hidden="true" className="px-3 text-rule-strong select-none">
            |
          </span>
          {item.tag ? (
            <span className="mr-1.5 rounded-sm bg-navy px-1.5 py-0.5 text-[0.6875rem] font-bold tracking-wide text-white uppercase">
              {item.tag}
            </span>
          ) : null}
          <Link
            href={item.href}
            tabIndex={ariaHidden ? -1 : undefined}
            className="text-sm font-medium text-navy hover:text-alert hover:underline"
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
