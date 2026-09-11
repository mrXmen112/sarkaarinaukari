import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { DataTable } from "@/components/ui/DataTable";
import { JsonLd } from "@/components/ui/JsonLd";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { TitleCell } from "@/components/updates/UpdatePanels";
import { listYojana } from "@/lib/queries";
import { breadcrumbSchema } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const revalidate = 10800; // 3 hours

export const metadata: Metadata = {
  title: "Sarkari Yojana 2026 — Government Schemes List",
  description:
    "Central & state government schemes for all sections in India — eligibility, benefits, and how to apply. Yojana details for farmers, women, youth, students and more.",
  alternates: { canonical: "/yojana" },
};

export default async function YojanaListingPage() {
  const yojanas = await listYojana();

  return (
    <PageContainer>
      <JsonLd
        data={breadcrumbSchema([{ name: "Sarkari Yojana", path: "/yojana" }])}
      />
      <Breadcrumbs items={[{ label: "Sarkari Yojana" }]} />

      <PageHeader
        title="Sarkari Yojana 2026 — Government Schemes"
        subtitle="Latest central & state government schemes for farmers, women, youth, students and job seekers. Read eligibility, benefits and how to apply."
        meta={`${yojanas.length} schemes listed`}
      />

      <DataTable
        columns={[
          {
            key: "title",
            header: "Scheme Name",
            cell: (yojana) => (
              <TitleCell
                href={`/yojana/${yojana.slug}`}
                title={yojana.title}
              />
            ),
          },
          {
            key: "level",
            header: "Level",
            hideBelow: "md",
            cell: (yojana) => (
              <span className="whitespace-nowrap capitalize text-ink-muted">
                {yojana.level === "state" ? "State" : "Central"}
              </span>
            ),
          },
          {
            key: "state",
            header: "State",
            hideBelow: "lg",
            cell: (yojana) => (
              <span className="whitespace-nowrap capitalize text-ink-muted">
                {yojana.level === "state" && yojana.state
                  ? yojana.state.replace("-", " ")
                  : "—"}
              </span>
            ),
          },
          {
            key: "benefits",
            header: "Benefits",
            cell: (yojana) => (
              <span className="text-ink-muted">{yojana.benefits_summary ?? "—"}</span>
            ),
          },
        ]}
        rows={yojanas}
        rowKey={(yojana) => yojana.slug}
        caption="Latest government schemes and yojana announcements."
        serialNumbers
        empty={
          <p>
            No schemes listed yet. New yojana announcements appear here as soon
            as they are officially released.
          </p>
        }
      />
    </PageContainer>
  );
}
