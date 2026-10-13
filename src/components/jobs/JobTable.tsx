import Link from "next/link";

import { CountdownBadge } from "@/components/ui/CountdownBadge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { stateLabel } from "@/lib/queries";
import { formatIndianNumber } from "@/lib/utils";
import type { JobWithCategory } from "@/types/database";

/** "New" for jobs published in the last 3 days, "Updated" for recent edits. */
function freshnessBadge(job: JobWithCategory): React.ReactNode {
  const now = Date.now();
  const created = new Date(job.created_at).getTime();
  const updated = new Date(job.updated_at).getTime();
  if (Number.isFinite(created) && now - created <= 3 * 24 * 60 * 60 * 1000) {
    return (
      <span className="rounded-sm bg-ingreen px-1.5 py-0.5 text-[0.625rem] font-bold text-white">
        NEW
      </span>
    );
  }
  if (
    Number.isFinite(updated) &&
    Number.isFinite(created) &&
    updated - created > 60 * 60 * 1000 &&
    now - updated <= 7 * 24 * 60 * 60 * 1000
  ) {
    return (
      <span className="rounded-sm bg-saffron px-1.5 py-0.5 text-[0.625rem] font-bold text-navy">
        UPDATED
      </span>
    );
  }
  return null;
}

/**
 * Standard government-style job row: Post | Dept | Vacancy | Last Date | Apply.
 * Used by /jobs, /bihar and the homepage. Department and vacancy collapse on
 * small screens (Section 1: fast, low-clutter mobile UI).
 */
export function JobTable({
  jobs,
  caption,
  serialNumbers = true,
  startIndex = 0,
  empty,
  renderAfterRow,
  columns: extraColumns = [],
}: {
  jobs: JobWithCategory[];
  caption: string;
  serialNumbers?: boolean;
  startIndex?: number;
  empty?: React.ReactNode;
  renderAfterRow?: (job: JobWithCategory, index: number) => React.ReactNode;
  /** Inject extra columns before the Apply column. */
  columns?: Column<JobWithCategory>[];
}) {
  const columns: Column<JobWithCategory>[] = [
    {
      key: "title",
      header: "Post Name",
      cell: (job) => (
        <div>
          <Link
            href={`/jobs/${job.slug}`}
            className="font-semibold text-navy no-underline hover:text-alert hover:underline"
          >
            {job.title}
          </Link>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-faint">
            {job.state ? (
              <span className="font-medium text-ingreen">
                {stateLabel(job.state)}
              </span>
            ) : null}
            <span>{job.job_categories?.name ?? "Government"}</span>
            {freshnessBadge(job)}
          </div>
        </div>
      ),
      className: "min-w-[220px]",
    },
    {
      key: "department",
      header: "Department",
      hideBelow: "sm",
      cell: (job) => (
        <span className="text-ink-muted">{job.department ?? "—"}</span>
      ),
      className: "max-w-[220px]",
    },
    {
      key: "vacancy",
      header: "Vacancy",
      hideBelow: "md",
      cell: (job) => (
        <span className="font-semibold tabular-nums">
          {formatIndianNumber(job.vacancy_total)}
        </span>
      ),
    },
    ...extraColumns,
    {
      key: "last-date",
      header: "Last Date",
      cell: (job) => <CountdownBadge date={job.application_end} compact />,
    },
    {
      key: "apply",
      header: "Apply",
      // Phase 4E: verified + open jobs link straight to the official apply URL;
      // everything else falls back to the detail page, and closed jobs show
      // a disabled "Closed" label instead of a dead button.
      cell: (job) => {
        const closed =
          job.status === "closed" ||
          new Date(job.application_end) < new Date();
        if (closed) {
          return (
            <span className="inline-block whitespace-nowrap rounded-sm bg-alert-bg px-2.5 py-1.5 text-xs font-bold text-alert">
              Closed
            </span>
          );
        }
        if (job.link_flagged || !job.official_link) {
          return (
            <Link
              href={`/jobs/${job.slug}`}
              className="gov-btn whitespace-nowrap"
              aria-label={`View details for ${job.title} — apply link under verification`}
            >
              View
            </Link>
          );
        }
        return (
          <a
            href={job.official_link}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="gov-btn whitespace-nowrap"
            aria-label={`Apply online for ${job.title} on the official website (opens in a new tab)`}
          >
            Apply
          </a>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={jobs}
      serialNumbers={serialNumbers}
      startIndex={startIndex}
      rowKey={(job) => job.slug}
      caption={caption}
      empty={empty ?? "No active jobs right now. Check back again shortly."}
      renderAfterRow={renderAfterRow}
    />
  );
}