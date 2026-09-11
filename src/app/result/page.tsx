import type { Metadata } from "next";

import { DataTable } from "@/components/ui/DataTable";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/ui/JsonLd";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { DownloadCell, TitleCell } from "@/components/updates/UpdatePanels";
import { listResults } from "@/lib/queries";
import { breadcrumbSchema } from "@/lib/seo";
import { formatDate } from "@/lib/date";

export const revalidate = 1800; // 30 min

export const metadata: Metadata = {
  title: "Sarkari Results 2026 — Govt Exam Results & Merit Lists",
  description:
    "Latest Central & State government exam results, merit lists and category-wise cutoffs in India. SSC, BPSC, Bihar Police, RRB and more — updated as results are declared.",
  alternates: { canonical: "/result" },
};

export default async function ResultListingPage() {
  const results = await listResults();

  return (
    <PageContainer>
      <JsonLd data={breadcrumbSchema([{ name: "Result", path: "/result" }])} />
      <Breadcrumbs items={[{ label: "Result" }]} />

      <PageHeader
        title="Sarkari Exam Results 2026"
        subtitle="Results, merit lists and category-wise cutoffs, as declared on official portals."
        meta={
          results.length
            ? `Showing all ${results.length} declared results`
            : "No results declared yet"
        }
      />

      <DataTable
        columns={[
          {
            key: "title",
            header: "Exam / Post Name",
            cell: (r) => (
              <TitleCell href={`/result/${r.slug}`} title={r.title} job={r.jobs} />
            ),
          },
          {
            key: "date",
            header: "Result Date",
            cell: (r) => (
              <span className="whitespace-nowrap text-ink-muted">
                {formatDate(r.result_date)}
              </span>
            ),
          },
          {
            key: "merit",
            header: "Merit List",
            hideBelow: "md",
            cell: (r) => (
              <DownloadCell
                href={r.merit_list_link}
                label="Merit List / Check"
              />
            ),
          },
        ]}
        rows={results}
        rowKey={(r) => r.slug}
        caption="Latest government exam results."
        serialNumbers
        empty={
          <p>
            No results declared yet. New results appear here as soon as they are
            published on official websites.
          </p>
        }
      />
    </PageContainer>
  );
}