import type { Metadata } from "next";

import {
  UpcomingListingPage,
  upcomingMetadata,
  type UpcomingPageConfig,
} from "@/components/jobs/UpcomingListingPage";
import { EXPECTED_STATUSES } from "@/lib/upcoming";

export const revalidate = 1800;

const config: UpcomingPageConfig = {
  title: "Expected Government Jobs",
  description:
    "Recruitments mentioned in official tentative calendars without a confirmed notification date. Every date is labelled tentative until the authority confirms it.",
  path: "/jobs/expected",
  breadcrumb: "Expected Jobs",
  statuses: EXPECTED_STATUSES,
};

export const metadata: Metadata = upcomingMetadata(config);

export default async function ExpectedJobsPage({
  searchParams,
}: PageProps<"/jobs/expected">) {
  return <UpcomingListingPage config={config} searchParams={await searchParams} />;
}
