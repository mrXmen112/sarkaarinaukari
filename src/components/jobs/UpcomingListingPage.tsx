import type { Metadata } from "next";

import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { FilterBar } from "@/components/ui/FilterBar";
import { JsonLd } from "@/components/ui/JsonLd";
import { Pagination } from "@/components/ui/Pagination";
import { UpcomingTable } from "@/components/jobs/UpcomingTable";
import { STATES } from "@/lib/site";
import { breadcrumbSchema, buildMeta } from "@/lib/seo";
import { listUpcoming } from "@/lib/upcoming";
import { firstParam, formatIndianNumber, parsePage } from "@/lib/utils";

export type UpcomingPageConfig = {
  title: string;
  description: string;
  path: string;
  breadcrumb: string;
  statuses: string[];
};

export function upcomingMetadata(config: UpcomingPageConfig): Metadata {
  return buildMeta({
    kind: "page",
    title: config.title,
    description: config.description,
    path: config.path,
  });
}

const LEVELS = [
  { value: "central", label: "Central Government" },
  { value: "state", label: "State Government" },
  { value: "ut", label: "Union Territory" },
];

const QUALIFICATIONS = [
  { value: "graduate", label: "Graduate" },
  { value: "engineering", label: "Engineering" },
  { value: "medical", label: "Medical" },
  { value: "defence", label: "Defence / CAPF" },
];

export async function UpcomingListingPage({
  config,
  searchParams,
}: {
  config: UpcomingPageConfig;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const level = firstParam(searchParams.level);
  const state = firstParam(searchParams.state);
  const organization = firstParam(searchParams.organization);
  const qualification = firstParam(searchParams.qualification);
  const month = firstParam(searchParams.month);
  const q = firstParam(searchParams.q)?.trim() || undefined;
  const page = parsePage(firstParam(searchParams.page));

  const { rows, total, page: servedPage, totalPages } = await listUpcoming({
    statuses: config.statuses,
    level,
    state,
    organization,
    qualification,
    month,
    q,
    page,
  });

  const carried = { level, state, organization, qualification, month, q };

  return (
    <PageContainer>
      <JsonLd data={breadcrumbSchema([{ name: config.breadcrumb, path: config.path }])} />
      <Breadcrumbs items={[{ label: config.breadcrumb }]} />
      <PageHeader
        title={config.title}
        subtitle={config.description}
        meta={`${formatIndianNumber(total)} officially listed ${total === 1 ? "entry" : "entries"}`}
      />

      <FilterBar
        action={config.path}
        carryParams={carried}
        filters={[
          { name: "level", label: "Government level", value: level, options: LEVELS, allLabel: "All levels" },
          { name: "state", label: "State / UT", value: state, options: STATES, allLabel: "All India" },
          {
            name: "organization",
            label: "Recruitment authority",
            value: organization,
            options: [
              { value: "Union Public Service Commission", label: "UPSC" },
              { value: "Staff Selection Commission", label: "SSC" },
              { value: "Railway Recruitment Board", label: "RRB" },
            ],
            allLabel: "All departments",
          },
          { name: "qualification", label: "Qualification", value: qualification, options: QUALIFICATIONS, allLabel: "Any qualification" },
          {
            name: "month",
            label: "Notification month",
            value: month,
            options: [
              { value: "2026-12", label: "December 2026" },
              { value: "2027-01", label: "January 2027" },
              { value: "2027-02", label: "February 2027" },
              { value: "2027-03", label: "March 2027" },
            ],
            allLabel: "Any month",
          },
        ]}
      />

      <section className="gov-panel">
        <div className="gov-panel-title">Recruitments</div>
        <div className="p-3">
          <UpcomingTable rows={rows} />
        </div>
      </section>

      <Pagination page={servedPage} totalPages={totalPages} basePath={config.path} params={carried} />
    </PageContainer>
  );
}
