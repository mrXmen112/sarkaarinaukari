import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { FilterBar } from "@/components/ui/FilterBar";
import { JsonLd } from "@/components/ui/JsonLd";
import { Pagination } from "@/components/ui/Pagination";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { JobTable } from "@/components/jobs/JobTable";
import { listCategories, listJobs, stateLabel } from "@/lib/queries";
import { breadcrumbSchema } from "@/lib/seo";
import { formatIndianNumber, firstParam, parsePage } from "@/lib/utils";
import { JOB_STATUSES, PAGE_SIZE, QUALIFICATIONS, STATES } from "@/lib/site";

export const revalidate = 1800; // 30 min — listings change often

export const metadata: Metadata = {
  title: "Latest Sarkari Naukri 2026 — Government Jobs List",
  description:
    "Browse the latest central & state government job notifications in India. Filter by category, state and qualification. Updated daily with last dates, vacancies and official apply links.",
  alternates: { canonical: "/jobs" },
};

const SORTS = [
  { label: "Newest first", value: "newest" },
  { label: "Closing soon", value: "closing" },
];

/**
 * All-jobs listing with server-rendered filters. Page is regenerated on an
 * ISR schedule and cached per URL, so every filter combination is crawlable
 * and served from CDN.
 */
export default async function JobsPage({
  searchParams,
}: PageProps<"/jobs">) {
  const sp = await searchParams;
  const category = firstParam(sp.category);
  const state = firstParam(sp.state);
  const status = firstParam(sp.status) ?? "active";
  const qualification = firstParam(sp.qualification);
  const sort = (firstParam(sp.sort) === "closing" ? "closing" : "newest") as
    | "newest"
    | "closing";
  const page = parsePage(sp.page);

  const [categories, { jobs, total, totalPages }] = await Promise.all([
    listCategories(),
    listJobs({ categorySlug: category, state, status, qualification, sort, page }),
  ]);

  const carriable = {
    category,
    state,
    status: status === "active" ? undefined : status,
    qualification,
    sort,
  };

  return (
    <PageContainer>
      <JsonLd
        data={breadcrumbSchema([{ name: "Latest Jobs", path: "/jobs" }])}
      />
      <Breadcrumbs items={[{ label: "Latest Jobs" }]} />

      <PageHeader
        title={`Sarkari Jobs — ${total > 0 ? formatIndianNumber(total) : "Latest"} Vacancies`}
        subtitle="Central & state government job notifications, updated daily."
        meta={`Showing ${jobs.length} of ${formatIndianNumber(total)}${state ? ` in ${stateLabel(state)}` : ""}`}
      />

      <FilterBar
        action="/jobs"
        filters={[
          {
            name: "category",
            label: "Category",
            value: category,
            options: categories.map((c) => ({ label: c.name, value: c.slug })),
            allLabel: "All Categories",
          },
          {
            name: "state",
            label: "State",
            value: state,
            options: STATES,
            allLabel: "All India",
          },
          {
            name: "status",
            label: "Status",
            value: status === "active" ? undefined : status,
            options: JOB_STATUSES,
            allLabel: "Active",
          },
          {
            name: "qualification",
            label: "Qualification",
            value: qualification,
            options: QUALIFICATIONS,
            allLabel: "Any Qualification",
          },
          {
            name: "sort",
            label: "Sort By",
            value: sort,
            options: SORTS,
            allLabel: "Newest first",
          },
        ]}
        carryParams={carriable}
      />

      <JobTable
        jobs={jobs}
        caption="List of government job vacancies."
        startIndex={(page - 1) * PAGE_SIZE}
        empty={
          <p>
            No jobs match these filters. Try widening{" "}
            <a href="/jobs">the search</a>.
          </p>
        }
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/jobs"
        params={carriable}
      />
    </PageContainer>
  );
}