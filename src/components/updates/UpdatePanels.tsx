import Link from "next/link";

import { deadlineLabel, deadlineTone, formatDate, toISODate } from "@/lib/date";

/**
 * Shared presentational pieces for the exam-update areas
 * (admit card / result / answer key). Kept small and self-contained so the
 * three page families stay visibly consistent (Section 4 table style).
 */

export type ParentJob = { title: string; slug: string } | null;

/** Prominent top-right badge for update detail pages (exam date etc.). */
export function UpdateDeadlineBadge({
  label,
  date,
  fallback,
}: {
  label: string;
  date: string | null | undefined;
  fallback?: string;
}) {
  const tone = deadlineTone(date);
  const textClass =
    tone === "urgent"
      ? "text-alert"
      : tone === "soon"
        ? "text-warn"
        : tone === "open"
          ? "text-ok"
          : "text-ink-faint";

  return (
    <div className="inline-flex flex-col items-center rounded-sm border border-rule bg-surface px-4 py-2 text-center">
      <span className="text-[0.6875rem] font-bold tracking-wide uppercase text-ink-muted">
        {label}
      </span>
      <time dateTime={toISODate(date)} className="font-serif text-lg leading-tight font-bold text-navy">
        {date ? formatDate(date) : fallback ?? "To be announced"}
      </time>
      <span className={`mt-0.5 text-xs font-bold ${textClass}`}>
        {date ? deadlineLabel(date) : ""}
      </span>
    </div>
  );
}

/** Listing title cell: update link + (optionally) its parent job link. */
export function TitleCell({
  href,
  title,
  job,
}: {
  href: string;
  title: string;
  job?: ParentJob;
}) {
  return (
    <div>
      <Link
        href={href}
        className="font-semibold text-navy no-underline hover:text-alert hover:underline"
      >
        {title}
      </Link>
      {job ? (
        <div className="mt-0.5">
          <Link
            href={`/jobs/${job.slug}`}
            className="text-xs text-ink-muted no-underline hover:underline"
          >
            Related posting: {job.title}
          </Link>
        </div>
      ) : null}
    </div>
  );
}

/** Download button for listing rows / link panels. */
export function DownloadCell({
  href,
  label = "Download",
}: {
  href: string | null;
  label?: string;
}) {
  if (!href) {
    return <span className="text-xs font-semibold text-ink-faint">Yet to release</span>;
  }
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="gov-btn"
    >
      {label}
    </Link>
  );
}

/** One row of the "Important Links" panel on detail pages. */
export function ExternalLinkRow({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: "pdf" | "globe";
}) {
  return (
    <li>
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 py-2.5 text-sm font-semibold text-navy no-underline hover:text-alert hover:underline"
      >
        {icon === "pdf" ? <PdfGlyph /> : <GlobeGlyph />}
        {label}
      </Link>
    </li>
  );
}

/** "Related Recruitment" panel linking the update to its parent job. */
export function JobLinkPanel({ job }: { job: ParentJob }) {
  if (!job) return null;
  return (
    <section className="gov-panel">
      <div className="gov-panel-title">
        <h2 className="font-serif text-base font-bold text-white">
          Related Recruitment
        </h2>
      </div>
      <div className="p-3">
        <p className="mb-3 text-sm">
          This update is a part of{" "}
          <Link
            href={`/jobs/${job.slug}`}
            className="font-semibold text-navy no-underline hover:text-alert hover:underline"
          >
            {job.title}
          </Link>
          . View the official notification for eligibility, vacancies and
          application dates.
        </p>
        <Link href={`/jobs/${job.slug}`} className="gov-btn">
          View Full Notification
        </Link>
      </div>
    </section>
  );
}

function PdfGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#B91C1C" strokeWidth="2" />
      <path d="M14 2v6h6" stroke="#B91C1C" strokeWidth="2" />
      <rect x="8" y="12" width="8" height="1.6" fill="#B91C1C" />
      <rect x="8" y="16" width="5" height="1.6" fill="#B91C1C" />
    </svg>
  );
}

function GlobeGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="#138808" strokeWidth="2" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" stroke="#138808" strokeWidth="2" />
    </svg>
  );
}