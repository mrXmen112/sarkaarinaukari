import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { DataTable } from "@/components/ui/DataTable";
import { FilterBar } from "@/components/ui/FilterBar";
import { JsonLd } from "@/components/ui/JsonLd";
import { Pagination } from "@/components/ui/Pagination";
import { SearchBox } from "@/components/ui/SearchBox";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { TitleCell } from "@/components/updates/UpdatePanels";
import { listYojana } from "@/lib/queries";
import { breadcrumbSchema, buildMeta } from "@/lib/seo";
import { PAGE_SIZE, STATES } from "@/lib/site";
import { firstParam, formatIndianNumber, parsePage } from "@/lib/utils";
import { YOJANA_CATEGORIES, YOJANA_LEVELS, yojanaLevelLabel } from "@/lib/yojana";

export const revalidate = 3600;

export const metadata: Metadata = buildMeta({
  kind: "page",
  title: "Sarkari Yojana — Central & State Government Schemes",
  description:
    "Search 200+ official central, state and union territory government schemes: eligibility, benefits, documents, application procedure and verified official links.",
  path: "/yojana",
});

export default async function YojanaListingPage({
  searchParams,
}: PageProps<"/yojana">) {
  const sp = await searchParams;
  const level = firstParam(sp.level);
  const state = firstParam(sp.state);
  const category = firstParam(sp.category);
  const availability = firstParam(sp.availability);
  const q = firstParam(sp.q)?.trim() || undefined;
  const page = parsePage(firstParam(sp.page));

  const {
    schemes,
    total,
    page: servedPage,
    totalPages,
  } = await listYojana({ level, state, category, availability, q, page });
  const firstRow = total === 0 ? 0 : (servedPage - 1) * PAGE_SIZE + 1;
  const lastRow = Math.min(total, firstRow + schemes.length - 1);
  const carried = { level, state, category, availability, q };

  return (
    <PageContainer>
      <JsonLd
        data={breadcrumbSchema([{ name: "Sarkari Yojana", path: "/yojana" }])}
      />
      <Breadcrumbs items={[{ label: "Sarkari Yojana" }]} />

      <PageHeader
        title="Sarkari Yojana — Government Schemes"
        subtitle="Official central, state and union territory schemes, verified against the myScheme platform and official portals."
        meta={`Showing ${formatIndianNumber(firstRow)}–${formatIndianNumber(lastRow)} of ${formatIndianNumber(total)} schemes`}
      />

      <div className="mb-4 max-w-xl">
        <SearchBox action="/yojana" includeStatus={false} />
      </div>

      <FilterBar
        action="/yojana"
        carryParams={carried}
        filters={[
          {
            name: "level",
            label: "Government level",
            value: level,
            options: YOJANA_LEVELS,
            allLabel: "All levels",
          },
          {
            name: "state",
            label: "State / UT",
            value: state,
            options: STATES,
            allLabel: "All India",
          },
          {
            name: "category",
            label: "Category",
            value: category,
            options: YOJANA_CATEGORIES,
            allLabel: "All categories",
          },
          {
            name: "availability",
            label: "Availability",
            value: availability,
            options: [
              { value: "active", label: "Active" },
              { value: "closed", label: "Closed" },
              { value: "upcoming", label: "Upcoming" },
            ],
            allLabel: "Any status",
          },
        ]}
      />

      <DataTable
        columns={[
          {
            key: "title",
            header: "Scheme Name",
            cell: (yojana) => (
              <TitleCell href={`/yojana/${yojana.slug}`} title={yojana.title} />
            ),
          },
          {
            key: "level",
            header: "Level",
            hideBelow: "md",
            cell: (yojana) => (
              <span className="whitespace-nowrap text-ink-muted">
                {yojanaLevelLabel(yojana.level)}
              </span>
            ),
          },
          {
            key: "state",
            header: "State / UT",
            hideBelow: "lg",
            cell: (yojana) => (
              <span className="whitespace-nowrap capitalize text-ink-muted">
                {yojana.state?.replace(/-/g, " ") ?? "All India"}
              </span>
            ),
          },
          {
            key: "category",
            header: "Category",
            hideBelow: "lg",
            cell: (yojana) => (
              <span className="text-ink-muted">
                {(yojana.category ?? "General").replace(/_/g, " ")}
              </span>
            ),
          },
          {
            key: "benefits",
            header: "Benefits",
            cell: (yojana) => (
              <span className="text-ink-muted">
                {yojana.benefits_summary ?? "—"}
              </span>
            ),
          },
        ]}
        rows={schemes}
        rowKey={(yojana) => yojana.slug}
        caption="Official government schemes and yojana announcements."
        serialNumbers
        empty={
          <p>
            No schemes match these filters. Try a wider state or category.
          </p>
        }
      />

      <Pagination
        page={servedPage}
        totalPages={totalPages}
        basePath="/yojana"
        params={carried}
      />
    </PageContainer>
  );
}
