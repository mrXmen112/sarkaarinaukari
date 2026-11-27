import Link from "next/link";

import { CountdownBadge } from "@/components/ui/CountdownBadge";
import { formatDate } from "@/lib/date";
import type { UpcomingRecruitment } from "@/types/database";

const STATUS_LABELS: Record<string, string> = {
  notification_scheduled: "Notification Scheduled",
  notification_expected: "Notification Expected",
  application_opening_soon: "Opening Soon",
  application_open: "Application Open",
  examination_scheduled: "Examination Scheduled",
  application_closed: "Closed",
  cancelled: "Cancelled",
  result_declared: "Result Declared",
};

export function UpcomingTable({
  rows,
  detailBase = "/jobs/coming-soon",
}: {
  rows: UpcomingRecruitment[];
  detailBase?: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-sm border border-rule bg-surface p-4 text-sm text-ink-muted">
        No entries in this section yet. We only publish dates confirmed by an
        official recruitment calendar or notice.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">Upcoming government recruitment notices</caption>
        <thead>
          <tr className="border-b-2 border-navy text-xs uppercase tracking-wide text-ink-muted">
            <th className="py-2 pr-3">Recruitment</th>
            <th className="py-2 pr-3">Authority</th>
            <th className="py-2 pr-3">Status</th>
            <th className="py-2 pr-3">Notification date</th>
            <th className="py-2 pr-3">Exam date</th>
            <th className="py-2">Source</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rule">
          {rows.map((row) => (
            <tr key={row.id} className="align-top">
              <td className="py-3 pr-3">
                <Link
                  href={`${detailBase}/${row.slug}`}
                  className="font-semibold text-navy no-underline hover:underline"
                >
                  {row.title}
                </Link>
                <span className="mt-0.5 block text-xs text-ink-muted">
                  {row.level === "central"
                    ? "Central Government"
                    : row.level === "ut"
                      ? `Union Territory${row.state ? ` · ${row.state}` : ""}`
                      : `State Government${row.state ? ` · ${row.state}` : ""}`}
                </span>
                {row.eligibility_note ? (
                  <span className="mt-1 block text-xs text-alert">
                    {row.eligibility_note}
                  </span>
                ) : null}
              </td>
              <td className="py-3 pr-3 text-ink-muted">{row.organization}</td>
              <td className="py-3 pr-3">
                <span className="whitespace-nowrap font-semibold text-navy">
                  {STATUS_LABELS[row.status] ?? row.status}
                </span>
                <span className="mt-0.5 block text-xs capitalize text-ink-muted">
                  {row.date_confidence} dates
                </span>
              </td>
              <td className="py-3 pr-3 whitespace-nowrap">
                {row.notification_date ? (
                  <>
                    {formatDate(row.notification_date)}
                    <CountdownBadge date={row.notification_date} compact />
                  </>
                ) : (
                  "Not announced"
                )}
              </td>
              <td className="py-3 pr-3 whitespace-nowrap">
                {row.exam_date ? formatDate(row.exam_date) : "—"}
              </td>
              <td className="py-3">
                {row.calendar_url ? (
                  <a
                    href={row.calendar_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-navy underline decoration-navy/30 underline-offset-2"
                  >
                    Official calendar
                  </a>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
