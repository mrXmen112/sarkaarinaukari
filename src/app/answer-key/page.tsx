import type { Metadata } from "next";

import { DataTable } from "@/components/ui/DataTable";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/ui/JsonLd";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { DownloadCell, TitleCell } from "@/components/updates/UpdatePanels";
import { listAnswerKeys } from "@/lib/queries";
import { breadcrumbSchema } from "@/lib/seo";
import { formatDate } from "@/lib/date";
import type { AnswerKey } from "@/types/database";

export const revalidate = 1800; // 30 min

export const metadata: Metadata = {
  title: "Sarkari Answer Key 2026 — Provisional & Final Keys",
  description:
    "Official provisional & final answer keys for government exams — SSC, IBPS, BPSC, RRB. Raise objections before the deadline and download keys from official portals.",
  alternates: { canonical: "/answer-key" },
};

export default async function AnswerKeyListingPage() {
  const keys = await listAnswerKeys();

  return (
    <PageContainer>
      <JsonLd data={breadcrumbSchema([{ name: "Answer Key", path: "/answer-key" }])} />
      <Breadcrumbs items={[{ label: "Answer Key" }]} />

      <PageHeader
        title="Answer Key 2026 — Provisional & Final"
        subtitle="Official answer keys for government exams, with objection deadlines where applicable."
        meta={
          keys.length
            ? `Showing all ${keys.length} released answer keys`
            : "No answer keys released yet"
        }
      />

      <DataTable
        columns={[
          {
            key: "title",
            header: "Exam / Post Name",
            cell: (k) => (
              <TitleCell href={`/answer-key/${k.slug}`} title={k.title} job={k.jobs} />
            ),
          },
          {
            key: "type",
            header: "Type",
            cell: (k) => <TypeBadge type={k.type} />,
          },
          {
            key: "release",
            header: "Release Date",
            hideBelow: "md",
            cell: (k) => (
              <span className="whitespace-nowrap text-ink-muted">
                {formatDate(k.release_date)}
              </span>
            ),
          },
          {
            key: "objection",
            header: "Objection Last Date",
            hideBelow: "lg",
            cell: (k) => (
              <span className="whitespace-nowrap text-ink-muted">
                {k.objection_last_date ? formatDate(k.objection_last_date) : "—"}
              </span>
            ),
          },
          {
            key: "download",
            header: "Download",
            align: "right",
            cell: (k) => <DownloadCell href={k.download_link} />,
          },
        ]}
        rows={keys}
        rowKey={(k) => k.slug}
        caption="Latest government exam answer keys."
        serialNumbers
        empty={
          <p>
            No answer keys released yet. New keys appear here as soon as they are
            published on official websites.
          </p>
        }
      />
    </PageContainer>
  );
}

function TypeBadge({ type }: { type: AnswerKey["type"] }) {
  const isProvisional = type === "provisional";
  return (
    <span
      className={
        isProvisional
          ? "inline-block rounded-sm bg-alert-bg px-2 py-0.5 text-xs font-bold text-alert"
          : "inline-block rounded-sm bg-navy-50 px-2 py-0.5 text-xs font-bold text-navy"
      }
    >
      {isProvisional ? "Provisional" : "Final"}
    </span>
  );
}