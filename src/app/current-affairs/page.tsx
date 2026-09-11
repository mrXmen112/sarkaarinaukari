import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { DataTable } from "@/components/ui/DataTable";
import { JsonLd } from "@/components/ui/JsonLd";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { TitleCell } from "@/components/updates/UpdatePanels";
import { listCurrentAffairs } from "@/lib/queries";
import { breadcrumbSchema } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { formatDate } from "@/lib/date";

export const revalidate = 10800; // 3 hours

export const metadata: Metadata = {
  title: "Current Affairs 2026 — Daily Current Affairs for Sarkari Exams",
  description:
    "Daily current affairs for SSC, BPSC, Bihar Police, RRB, UPSC and all government job exams. Updated with national, state and world news relevant to competitive exams.",
  alternates: { canonical: "/current-affairs" },
};

export default async function CurrentAffairsListingPage() {
  const affairs = await listCurrentAffairs();

  return (
    <PageContainer>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Current Affairs", path: "/current-affairs" },
        ])}
      />
      <Breadcrumbs items={[{ label: "Current Affairs" }]} />

      <PageHeader
        title="Current Affairs 2026"
        subtitle="Daily current affairs for SSC, BPSC, Bihar Police, RRB, UPSC and all government exam preparation. Updated regularly with exam-relevant news."
        meta={`${affairs.length} updates listed`}
      />

      <DataTable
        columns={[
          {
            key: "date",
            header: "Date",
            cell: (affair) => (
              <span className="whitespace-nowrap tabular-nums text-ink-muted">
                {formatDate(affair.date)}
              </span>
            ),
          },
          {
            key: "title",
            header: "Topic",
            cell: (affair) => (
              <TitleCell
                href={`/current-affairs/${affair.slug}`}
                title={affair.title ?? "Untitled"}
              />
            ),
          },
          {
            key: "id",
            header: "",
            hideBelow: "sm",
            cell: () => <span />,
          },
        ]}
        rows={affairs}
        rowKey={(affair) => affair.id}
        caption="Daily current affairs briefs for government exam preparation."
        serialNumbers
        empty={
          <p>
            No current affairs published yet. Daily GK briefs appear here as
            soon as they are updated.
          </p>
        }
      />
    </PageContainer>
  );
}