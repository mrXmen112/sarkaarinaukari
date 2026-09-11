import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/ui/JsonLd";
import { PageContainer, PageHeader, Panel } from "@/components/layout/PageContainer";
import { JobTable } from "@/components/jobs/JobTable";
import { listJobs, listRecentUpdates, type RecentUpdate } from "@/lib/queries";
import { breadcrumbSchema } from "@/lib/seo";
import { formatDate } from "@/lib/date";
import { firstParam, formatIndianNumber } from "@/lib/utils";
import { BIHAR_DEPARTMENTS } from "@/lib/site";

export const revalidate = 1800; // 30 min

export const metadata: Metadata = {
  title: "Bihar Sarkari Jobs 2026 — BPSC, BSSC, Bihar Police & TRE",
  description:
    "Bihar government jobs hub: BPSC, BSSC, Bihar Police, Bihar TRE (teachers), Health Department & Panchayati Raj vacancies. Updated daily with last dates and official apply links.",
  alternates: { canonical: "/bihar" },
};

/**
 * Bihar Hub (Section 4.7): department chips + live job table + a rail of the
 * latest exam updates. Department is a stable slug filter (`department_slug`),
 * not a fragile text match.
 */
export default async function BiharHubPage({
  searchParams,
}: PageProps<"/bihar">) {
  const sp = await searchParams;
  const department = firstParam(sp.department);
  const activeDept = BIHAR_DEPARTMENTS.find((d) => d.slug === department);

  const [{ jobs, total }, updates] = await Promise.all([
    listJobs({ state: "bihar", department: activeDept?.slug, status: "all", sort: "newest" }),
    listRecentUpdates(6),
  ]);

  const title = activeDept
    ? `${activeDept.label} Jobs in Bihar 2026`
    : "Bihar Sarkari Jobs 2026";
  const subtitle = activeDept
    ? `${activeDept.hint ?? "Bihar department"} vacancies, updated daily.`
    : "Government job notifications across BPSC, BSSC, Bihar Police, TRE, Health & Panchayati Raj.";

  return (
    <PageContainer
      aside={
        <UpdatesRail updates={updates} ariaLabel="Recent Bihar & central exam updates" />
      }
    >
      <JsonLd data={breadcrumbSchema([{ name: "Bihar Jobs", path: "/bihar" }])} />
      <Breadcrumbs items={[{ label: "Bihar Jobs" }]} />

      <PageHeader
        title={title}
        subtitle={subtitle}
        meta={`Showing ${formatIndianNumber(total)} Bihar government vacancy${total === 1 ? "" : "ies"} · updated daily`}
      />

      <nav aria-label="Bihar departments" className="mb-4 flex flex-wrap gap-2">
        <DepartmentChip href="/bihar" active={!activeDept} label="All Bihar" />
        {BIHAR_DEPARTMENTS.map((d) => (
          <DepartmentChip
            key={d.slug}
            href={`/bihar?department=${d.slug}`}
            active={activeDept?.slug === d.slug}
            label={d.label}
          />
        ))}
      </nav>

      <JobTable
        jobs={jobs}
        caption="Bihar government job vacancies."
        empty={
          <p>
            No open Bihar jobs for this department right now.{" "}
            <a href="/bihar">Browse all Bihar jobs</a>.
          </p>
        }
      />
    </PageContainer>
  );
}

function DepartmentChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-sm bg-navy px-3 py-1.5 text-sm font-semibold text-white no-underline"
          : "rounded-sm border border-rule bg-surface px-3 py-1.5 text-sm font-semibold text-navy no-underline hover:bg-navy-50"
      }
    >
      {label}
    </Link>
  );
}

function UpdatesRail({
  updates,
  ariaLabel,
}: {
  updates: Awaited<ReturnType<typeof listRecentUpdates>>;
  ariaLabel: string;
}) {
  const base: Record<RecentUpdate["kind"], string> = {
    "admit-card": "admit-card",
    result: "result",
    "answer-key": "answer-key",
  };
  const label: Record<RecentUpdate["kind"], string> = {
    "admit-card": "Admit Card",
    result: "Result",
    "answer-key": "Answer Key",
  };

  return (
    <section aria-label={ariaLabel} className="gov-panel">
      <div className="gov-panel-title">
        <h2 className="font-serif text-base font-bold text-white">
          Recent Exam Updates
        </h2>
      </div>
      <ul className="divide-y divide-rule p-2">
        {updates.map((u) => (
          <li key={u.slug} className="py-2">
            <p className="mb-0.5 text-[0.6875rem] font-bold tracking-wide uppercase text-ingreen">
              {label[u.kind]}
            </p>
            <Link
              href={`/${base[u.kind]}/${u.slug}`}
              className="font-semibold text-navy no-underline hover:text-alert hover:underline"
            >
              {u.title}
            </Link>
            <p className="mt-0.5 text-xs text-ink-faint">
              {u.date ? formatDate(u.date) : ""}
            </p>
          </li>
        ))}
      </ul>
      <div className="border-t border-rule p-2">
        <Link
          href="/admit-card"
          className="text-xs font-semibold text-navy no-underline hover:text-alert hover:underline"
        >
          View all admit cards & results →
        </Link>
      </div>
    </section>
  );
}