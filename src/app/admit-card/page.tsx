import type { Metadata } from "next";

import { DataTable } from "@/components/ui/DataTable";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/ui/JsonLd";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { DownloadCell, TitleCell } from "@/components/updates/UpdatePanels";
import { listAdmitCards } from "@/lib/queries";
import { breadcrumbSchema } from "@/lib/seo";
import { formatDate } from "@/lib/date";

export const revalidate = 1800; // 30 min — release dates change often

export const metadata: Metadata = {
  title: "Sarkari Naukri Admit Card 2026 — Hall Tickets Download",
  description:
    "Download admit cards / hall tickets for central & state government exams in India. Latest gate pass release dates and exam dates for SSC, IBPS, RRB, Bihar Police and more.",
  alternates: { canonical: "/admit-card" },
};

export default async function AdmitCardListingPage() {
  const admitCards = await listAdmitCards();

  return (
    <PageContainer>
      <JsonLd data={breadcrumbSchema([{ name: "Admit Card", path: "/admit-card" }])} />
      <Breadcrumbs items={[{ label: "Admit Card" }]} />

      <PageHeader
        title="Admit Card 2026 — Sarkari Naukri Hall Tickets"
        subtitle="Latest admit cards & hall tickets for government exams, released on official portals."
        meta={
          admitCards.length
            ? `Showing all ${admitCards.length} released admit cards`
            : "No admit cards released yet"
        }
      />

      <DataTable
        columns={[
          {
            key: "title",
            header: "Post / Exam Name",
            cell: (card) => (
              <TitleCell
                href={`/admit-card/${card.slug}`}
                title={card.title}
                job={card.jobs}
              />
            ),
          },
          {
            key: "release",
            header: "Release Date",
            cell: (card) => (
              <span className="whitespace-nowrap text-ink-muted">
                {formatDate(card.release_date)}
              </span>
            ),
          },
          {
            key: "exam",
            header: "Exam Date",
            hideBelow: "md",
            cell: (card) => (
              <span className="whitespace-nowrap text-ink-muted">
                {card.exam_date ? formatDate(card.exam_date) : "To be announced"}
              </span>
            ),
          },
          {
            key: "download",
            header: "Download",
            align: "right",
            cell: (card) => <DownloadCell href={card.download_link} />,
          },
        ]}
        rows={admitCards}
        rowKey={(card) => card.slug}
        caption="Latest government exam admit cards."
        serialNumbers
        empty={
          <p>
            No admit cards released yet. New hall tickets appear here as soon as
            they are published on official websites.
          </p>
        }
      />
    </PageContainer>
  );
}