/**
 * 2026-10 audit — deterministic checks that decide whether the most
 * error-prone figures (vacancy count and pay scale) may be shown.
 *
 * These are *blocking* signals: a row that fails any of them is still
 * reachable, but its vacancy/salary figures are withheld and the page carries a
 * review notice. Nothing here writes to the database and nothing guesses a
 * missing value.
 *
 * `source_verified` / `last_verified_at` being NULL means "never verified",
 * which is the normal state of the bulk-seeded backlog. That is a warning, not
 * a failure: treating it as blocking would withhold figures for every row and
 * defeat the point of the audit.
 */

export type JobAuditFlag =
  | "vacancy_sum_mismatch"
  | "vacancy_breakdown_uniform"
  | "missing_official_source"
  | "published_after_updated"
  | "invalid_application_dates"
  | "stale_verification"
  | "vacancy_unverified"
  | "salary_unverified";

export type JobAuditResult = {
  /** Failures that withhold vacancy/salary and trigger the review notice. */
  blocking: JobAuditFlag[];
  /** Honest caveats that do not, by themselves, withhold figures. */
  warnings: JobAuditFlag[];
  failsAudit: boolean;
  vacancyWithheld: boolean;
  salaryWithheld: boolean;
};

export type AuditableJob = {
  vacancy_total?: number | null;
  vacancy_breakdown?: Record<string, number | string> | null;
  pay_scale?: string | null;
  source_verified?: boolean | null;
  official_link?: string | null;
  source_url?: string | null;
  official_notification_url?: string | null;
  last_verified_at?: string | null;
  published_at?: string | null;
  updated_at?: string | null;
  application_start?: string | null;
  application_end?: string | null;
};

const STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

function breakdownValues(
  breakdown: Record<string, number | string> | null | undefined,
): number[] {
  if (!breakdown) return [];
  return Object.values(breakdown)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);
}

function time(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

export function auditJob(job: AuditableJob): JobAuditResult {
  const blocking: JobAuditFlag[] = [];
  const warnings: JobAuditFlag[] = [];

  const total = Number(job.vacancy_total);
  const values = breakdownValues(job.vacancy_breakdown);
  const sum = values.reduce((acc, value) => acc + value, 0);

  if (
    Number.isFinite(total) &&
    total > 0 &&
    values.length > 0 &&
    sum > 0 &&
    sum !== total
  ) {
    blocking.push("vacancy_sum_mismatch");
  }

  if (
    values.length >= 3 &&
    values.every((value) => value === values[0]) &&
    values[0] > 0
  ) {
    blocking.push("vacancy_breakdown_uniform");
  }

  const hasSource =
    !!job.official_link?.trim() ||
    !!job.source_url?.trim() ||
    !!job.official_notification_url?.trim();
  if (!hasSource) blocking.push("missing_official_source");

  const published = time(job.published_at);
  const updated = time(job.updated_at);
  if (published !== null && updated !== null && published > updated) {
    blocking.push("published_after_updated");
  }

  const start = time(job.application_start);
  const end = time(job.application_end);
  if (
    (job.application_start && start === null) ||
    (job.application_end && end === null) ||
    (start !== null && end !== null && start > end)
  ) {
    blocking.push("invalid_application_dates");
  }

  const verifiedAt = time(job.last_verified_at);
  if (verifiedAt !== null && Date.now() - verifiedAt > STALE_AFTER_MS) {
    blocking.push("stale_verification");
  }

  if (
    Number.isFinite(total) &&
    total > 0 &&
    job.source_verified !== true
  ) {
    warnings.push("vacancy_unverified");
  }
  if (job.pay_scale?.trim() && job.source_verified !== true) {
    warnings.push("salary_unverified");
  }

  const failsAudit = blocking.length > 0;
  return {
    blocking,
    warnings,
    failsAudit,
    vacancyWithheld: failsAudit,
    salaryWithheld: failsAudit,
  };
}
