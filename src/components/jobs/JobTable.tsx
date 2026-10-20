import Link from "next/link";

import { CountdownBadge } from "@/components/ui/CountdownBadge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { stateLabel } from "@/lib/queries";
import { freshnessOf } from "@/lib/freshness";
import { classifyApplyLink } from "@/lib/applyLink";
import { auditJob } from "@/lib/jobAudit";
import { formatIndianNumber } from "@/lib/utils";
import { T } from "@/components/i18n/T";
import type { JobWithCategory } from "@/types/database";

/**
 * W5.1: "UPDATED" within 48h of content_changed_at, "NEW" within 48h of
 * published_at. Both come from src/lib/freshness.ts, which never reads
 * updated_at — see that file for why.
 */
function freshnessBadge(job: JobWithCategory): React.ReactNode {
  const kind = freshnessOf(job);
  if (kind === "new") {
    return (
      <span className="rounded-sm bg-ingreen px-1.5 py-0.5 text-[0.625rem] font-bold text-white">
        <T k="new" />
      </span>
    );
  }
  if (kind === "updated") {
    return (
      <span className="rounded-sm bg-saffron px-1.5 py-0.5 text-[0.625rem] font-bold text-navy">
        <T k="updated" />
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
      header: <T k="postName" />,
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
      header: <T k="department" />,
      hideBelow: "sm",
      cell: (job) => (
        <span className="text-ink-muted">{job.department ?? "—"}</span>
      ),
      className: "max-w-[220px]",
    },
    {
      key: "vacancy",
      header: <T k="vacancy" />,
      hideBelow: "md",
      cell: (job) => {
        const audit = auditJob(job);
        if (audit.vacancyWithheld) {
          return (
            <span
              className="text-xs font-semibold text-alert"
              title="Vacancy figures are withheld pending verification against the official notification"
            >
              Under review
            </span>
          );
        }
        return (
          <span className="font-semibold tabular-nums">
            {formatIndianNumber(job.vacancy_total)}
          </span>
        );
      },
    },
    ...extraColumns,
    {
      key: "last-date",
      header: <T k="lastDate" />,
      cell: (job) => <CountdownBadge date={job.application_end} compact />,
    },
    {
      key: "apply",
      header: <T k="applyCol" />,
      // W5.5: one classifier decides the destination and the label, so this cell
      // and the job detail page can never disagree. See src/lib/applyLink.ts.
      cell: (job) => {
        const link = classifyApplyLink(job);

        if (link.kind === "closed") {
          return (
            <span className="inline-block whitespace-nowrap rounded-sm bg-alert-bg px-2.5 py-1.5 text-xs font-bold text-alert">
              <T k="closed" />
            </span>
          );
        }

        if (link.kind === "details" || link.kind === "website") {
          return (
            <Link
              href={`/jobs/${job.slug}`}
              className="gov-btn whitespace-nowrap"
              aria-label={`View details for ${job.title} — apply link under verification`}
            >
              <T k="view" />
            </Link>
          );
        }

        // Only a verified apply destination reaches this branch.
        return (
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="gov-btn whitespace-nowrap"
            aria-label={`Apply online for ${job.title} on the official website (opens in a new tab)`}
          >
            <T k="apply" />
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