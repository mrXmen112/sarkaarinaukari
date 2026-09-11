/**
 * Date helpers.
 *
 * All user-facing dates are rendered in DD MMM YYYY (Indian convention) and
 * all "days remaining" maths is done in IST, since deadlines are IST-based
 * and the server may run in UTC.
 */

const IST_OFFSET_MINUTES = 330; // UTC+05:30

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Parse a `date` / ISO string into a Date, or null. */
export function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "2026-04-18" -> "18 Apr 2026". Returns "—" for null. */
export function formatDate(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return "—";
  return `${String(d.getUTCDate()).padStart(2, "0")} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Long form: "18 April 2026". */
export function formatDateLong(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/** Machine-readable YYYY-MM-DD, for <time dateTime> and JSON-LD. */
export function toISODate(value: string | Date | null | undefined): string | undefined {
  const d = toDate(value);
  if (!d) return undefined;
  return d.toISOString().slice(0, 10);
}

/** Today's date at midnight, as observed in IST. */
export function todayIST(): Date {
  const now = new Date();
  const ist = new Date(now.getTime() + IST_OFFSET_MINUTES * 60_000);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()));
}

/**
 * Whole days from today (IST) until `value`.
 * 0 = closes today, negative = already passed, null = no date.
 */
export function daysUntil(value: string | Date | null | undefined): number | null {
  const target = toDate(value);
  if (!target) return null;
  const t = Date.UTC(
    target.getUTCFullYear(),
    target.getUTCMonth(),
    target.getUTCDate(),
  );
  return Math.round((t - todayIST().getTime()) / 86_400_000);
}

export type DeadlineTone = "expired" | "urgent" | "soon" | "open" | "none";

/**
 * Urgency bucket for a last date.
 *  - urgent: <= 7 days left (rendered in alert red, per Section 4.1)
 *  - soon:   8–15 days left
 *  - open:   more than 15 days
 */
export function deadlineTone(value: string | Date | null | undefined): DeadlineTone {
  const d = daysUntil(value);
  if (d === null) return "none";
  if (d < 0) return "expired";
  if (d <= 7) return "urgent";
  if (d <= 15) return "soon";
  return "open";
}

/** Human phrase for a deadline: "3 days left", "Closes today", "Closed". */
export function deadlineLabel(value: string | Date | null | undefined): string {
  const d = daysUntil(value);
  if (d === null) return "Date not announced";
  if (d < 0) return "Closed";
  if (d === 0) return "Closes today";
  if (d === 1) return "1 day left";
  return `${d} days left`;
}

/** "Updated 2 days ago" style relative label for listing freshness. */
export function relativeFromNow(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return "—";
  const diffDays = Math.round((todayIST().getTime() - Date.UTC(
    d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(),
  )) / 86_400_000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/** Add N days to a date and return YYYY-MM-DD (used for deadline queries). */
export function isoDatePlusDays(days: number): string {
  const d = todayIST();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
