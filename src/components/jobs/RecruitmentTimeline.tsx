import Link from "next/link";

import { DetailTable } from "@/components/ui/DataTable";
import { formatDate } from "@/lib/date";
import type { JobTimeline } from "@/lib/queries";
import { T } from "@/components/i18n/T";

/**
 * Recruitment Timeline (Phase 1): the full lifecycle of a vacancy —
 * Notification -> Apply -> Admit Card -> Exam -> Answer Key -> Result.
 * Every row only appears when the underlying data exists; no invented dates.
 */
export function RecruitmentTimeline({
  job,
  timeline,
}: {
  job: {
    title: string;
    notification_date: string | null;
    notification_pdf_link: string | null;
    application_start: string | null;
    application_end: string;
    exam_date: string | null;
    status: string;
  };
  timeline: JobTimeline;
}) {
  const rows: { label: string; value: React.ReactNode }[] = [];

  rows.push({
    label: "Notification",
    value: job.notification_pdf_link ? (
      <Link
        href={job.notification_pdf_link}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="font-semibold text-navy underline decoration-navy/30 underline-offset-2 hover:decoration-navy"
      >
        Official Notification (PDF)
      </Link>
    ) : job.notification_date ? (
      formatDate(job.notification_date)
    ) : (
      "—"
    ),
  });

  rows.push({
    label: "Apply Window",
    value:
      job.status === "closed"
        ? `${formatDate(job.application_start)} to ${formatDate(job.application_end)} — closed`
        : `${formatDate(job.application_start)} to ${formatDate(job.application_end)}`,
  });

  for (const card of timeline.admitCards) {
    rows.push({
      label: "Admit Card",
      value: (
        <Link
          href={`/admit-card/${card.slug}`}
          className="font-semibold text-navy underline decoration-navy/30 underline-offset-2 hover:decoration-navy"
        >
          {card.title}
        </Link>
      ),
    });
  }

  if (job.exam_date) {
    rows.push({ label: "Exam Date", value: formatDate(job.exam_date) });
  }

  for (const key of timeline.answerKeys) {
    rows.push({
      label: "Answer Key",
      value: (
        <Link
          href={`/answer-key/${key.slug}`}
          className="font-semibold text-navy underline decoration-navy/30 underline-offset-2 hover:decoration-navy"
        >
          {key.title}
        </Link>
      ),
    });
  }

  for (const result of timeline.results) {
    rows.push({
      label: "Result",
      value: (
        <Link
          href={`/result/${result.slug}`}
          className="font-semibold text-navy underline decoration-navy/30 underline-offset-2 hover:decoration-navy"
        >
          {result.title}
        </Link>
      ),
    });
  }

  return (
    <section aria-labelledby="recruitment-timeline" className="gov-panel mb-4">
      <div className="gov-panel-title" id="recruitment-timeline">
        <T k="recruitmentTimeline" />
      </div>
      <div className="p-3">
        <p className="mb-3 text-xs leading-relaxed text-ink-muted">
          Stages are numbered in the order they appear. A stage is shown only
          when the recruiting body has published it; missing stages are not
          assumed.
        </p>
        <DetailTable
          caption="Recruitment timeline for this vacancy"
          rows={rows.map((row, index) => ({
            label: `${index + 1}. ${row.label}`,
            value: row.value,
          }))}
        />
      </div>
    </section>
  );
}
