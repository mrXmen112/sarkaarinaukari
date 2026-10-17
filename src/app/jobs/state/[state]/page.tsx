import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LandingJobsPage, landingMetadata } from "@/components/jobs/LandingJobsPage";
import { countVerifiedOpenJobs } from "@/lib/queries";
import { STATE_SLUGS, buildStatePage } from "@/lib/landingPagesState";

export const revalidate = 1800;

export function generateStaticParams() {
  return STATE_SLUGS.map((state) => ({ state }));
}

export async function generateMetadata({
  params,
}: PageProps<"/jobs/state/[state]">): Promise<Metadata> {
  const { state } = await params;
  const config = buildStatePage(state);
  if (!config) return { title: "State Jobs Not Found" };
  // Phase 8A: state hubs follow the same >= 3 verified open jobs rule as every
// other landing page, so a state with almost no verified vacancies drops out of
// the index instead of competing with /jobs.
return landingMetadata(
    config,
    `/jobs/state/${state}`,
    await countVerifiedOpenJobs({ state }),
  );
}

export default async function StateJobsPage({
  params,
  searchParams,
}: PageProps<"/jobs/state/[state]">) {
  const { state } = await params;
  const sp = await searchParams;
  const pageNumber = Math.max(1, Number(sp.page) || 1);
  const config = buildStatePage(state);
  if (!config) notFound();

  const label = state
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <LandingJobsPage
      config={config}
      path={`/jobs/state/${state}`}
      breadcrumbName={`${label} Jobs`}
      pageNumber={pageNumber}
    />
  );
}