import Link from "next/link";

import { CountdownBadge } from "@/components/ui/CountdownBadge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { stateLabel } from "@/lib/queries";
import { formatIndianNumber } from "@/lib/utils";
import type { JobWithCategory } from "@/types/database";

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
          <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-ink-faint">
            {job.state ? (
              <span className="font-medium text-ingreen">
                {stateLabel(job.state)}
              </span>
            ) : null}
            <span>
              {job.job_categories?.name ?? "Government"}
            </span>
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
      cell: (job) => (
        <Link
          href={`/jobs/${job.slug}`}
          className="gov-btn whitespace-nowrap"
          aria-label={`Read details and apply for ${job.title}`}
        >
          Apply
        </Link>
      ),
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