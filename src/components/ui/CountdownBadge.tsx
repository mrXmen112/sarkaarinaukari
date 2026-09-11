import { deadlineLabel, deadlineTone, daysUntil, formatDate, toISODate } from "@/lib/date";
import { cn } from "@/lib/utils";

const TONE_STYLES = {
  urgent: "bg-alert text-white",
  soon: "bg-warn-bg text-warn border border-warn",
  open: "bg-ok-bg text-ok border border-ok",
  expired: "bg-page text-ink-faint border border-rule",
  none: "bg-page text-ink-faint border border-rule",
} as const;

/**
 * Deadline badge computed at render time (ISR revalidates it).
 *
 * - `compact` — inline chip for table cells (Section 4.1: last date in red
 *   when < 7 days remain).
 * - default — prominent block for the top-right of a detail page
 *   (Section 4.2 #1).
 */
export function CountdownBadge({
  date,
  compact = false,
  expiredText = "Closed",
  className,
}: {
  date: string | Date | null | undefined;
  compact?: boolean;
  expiredText?: string;
  className?: string;
}) {
  const tone = deadlineTone(date);
  const days = daysUntil(date);
  const iso = toISODate(date);

  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap",
          TONE_STYLES[tone],
          className,
        )}
      >
        {tone === "urgent" && <TimerGlyph />}
        {formatDate(date)}
        {tone !== "expired" && days !== null && days <= 7 ? (
          <span aria-label={deadlineLabel(date)}>
            ({days === 0 ? "today" : `${days}d left`})
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex flex-col items-center rounded-sm px-4 py-2 text-center",
        TONE_STYLES[tone],
        className,
      )}
    >
      <span className="text-[0.6875rem] font-bold tracking-wide uppercase">
        Last Date to Apply
      </span>
      <time dateTime={iso} className="font-serif text-lg leading-tight font-bold">
        {formatDate(date)}
      </time>
      <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-bold">
        {(tone === "urgent" || tone === "soon") && <TimerGlyph />}
        {tone === "expired" ? expiredText : deadlineLabel(date)}
      </span>
    </div>
  );
}

function TimerGlyph() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 9v4l2.5 2.5M9 2h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
