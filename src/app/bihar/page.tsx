import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/ui/JsonLd";
import { BIHAR_GUIDE_PAGES, BIHAR_ORG_PAGES } from "@/lib/landingPagesState";
import { LANDING_LABELS } from "@/lib/landingPages";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { JobTable } from "@/components/jobs/JobTable";
import { RecentUpdatesPanel } from "@/components/updates/RecentUpdatesPanel";
import { listJobs, listRecentUpdates } from "@/lib/queries";
import { breadcrumbSchema } from "@/lib/seo";
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
 * Deep Bihar organisation landing pages (Phase 3) — each has its own H1,
 * intro, eligibility FAQ and live filtered table.
 */
const BIHAR_ORG_LINKS = BIHAR_ORG_PAGES.map((org) => ({
  slug: org.slug,
  label: LANDING_LABELS[org.slug] ?? org.slug,
  href: `/bihar/${org.slug}`,
}));

const BIHAR_GUIDE_LINKS = BIHAR_GUIDE_PAGES.map((guide) => ({
  slug: guide.slug,
  label: "Bihar 12th Pass Jobs",
  href: `/bihar/${guide.slug}`,
}));

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
    listJobs({ state: "bihar", department: activeDept?.slug, status: "open", sort: "newest" }),
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
          <RecentUpdatesPanel
            updates={updates}
            ariaLabel="Recent Bihar & central exam updates"
          />
      }
    >
      <JsonLd data={breadcrumbSchema([{ name: "Bihar Jobs", path: "/bihar" }])} />
      <Breadcrumbs items={[{ label: "Bihar Jobs" }]} />

      <PageHeader
        title={title}
        subtitle={subtitle}
        meta={`Showing ${formatIndianNumber(total)} Bihar government vacanc${total === 1 ? "y" : "ies"} · updated daily`}
      />

      <nav aria-label="Bihar departments" className="mb-4 flex flex-wrap gap-2">
        <DepartmentChip href="/bihar" active={!activeDept} label="All Bihar" />
        {BIHAR_ORG_LINKS.map((d) => (
          <DepartmentChip
            key={d.slug}
            href={d.href}
            active={activeDept?.slug === d.slug}
            label={d.label}
          />
        ))}
      </nav>

      <nav aria-label="Bihar job guides" className="mb-4 flex flex-wrap gap-2">
        {BIHAR_GUIDE_LINKS.map((guide) => (
          <DepartmentChip
            key={guide.slug}
            href={guide.href}
            active={false}
            label={guide.label}
          />
        ))}
      </nav>

      <JobTable
        jobs={jobs}
        caption="Bihar government job vacancies."
        empty={
          <p>
            No open Bihar jobs for this department right now.{" "}
            <Link href="/bihar">Browse all Bihar jobs</Link>.
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
