/**
 * Recruitment lifecycle in one place.
 *
 * The database stores the durable states (upcoming/active/closed/cancelled/
 * result_declared). "open" and "closing soon" are derived from the actual
 * application dates in Asia/Kolkata, never stored, so they cannot go stale
 * when a cron run is late. A stored cancelled/result_declared state always
 * wins over the date maths.
 */
export type DerivedJobStatus =
  | "upcoming"
  | "open"
  | "closing_soon"
  | "closed"
  | "cancelled"
  | "result_declared";

export const CLOSING_SOON_DAYS = 7;

export type LifecycleSubject = {
  status?: string | null;
  application_start?: string | null;
  application_end?: string | null;
  /** Set when an official result notice was published. */
  result_declared?: boolean | null;
};

export function deriveJobStatus(
  job: LifecycleSubject,
  nowIso = new Date().toISOString(),
): DerivedJobStatus {
  if (job.status === "cancelled") return "cancelled";
  if (job.status === "result_declared" || job.result_declared) {
    return "result_declared";
  }
  if (job.status === "closed") return "closed";

  const start = daysUntilRelative(job.application_start, nowIso);
  if (job.status === "upcoming" || (start !== null && start > 0)) {
    return "upcoming";
  }

  const end = daysUntilRelative(job.application_end, nowIso);
  if (end === null) return job.status === "active" ? "open" : "upcoming";
  if (end < 0) return "closed";
  if (end <= CLOSING_SOON_DAYS) return "closing_soon";
  return "open";
}

/** `daysUntil()` relative to an explicit instant, for deterministic tests. */
function daysUntilRelative(
  value: string | null | undefined,
  nowIso: string,
): number | null {
  if (!value) return null;
  const target = new Date(`${String(value).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date(nowIso);
  const ist = new Date(now.getTime() + 330 * 60_000);
  const today = Date.UTC(
    ist.getUTCFullYear(),
    ist.getUTCMonth(),
    ist.getUTCDate(),
  );
  return Math.round((target.getTime() - today) / 86_400_000);
}

export const STATUS_LABELS: Record<DerivedJobStatus, string> = {
  upcoming: "Upcoming",
  open: "Open",
  closing_soon: "Closing Soon",
  closed: "Closed",
  cancelled: "Cancelled",
  result_declared: "Result Declared",
};

/** Expired vacancies must never show an apply button. */
export function canApply(status: DerivedJobStatus): boolean {
  return status === "open" || status === "closing_soon";
}
