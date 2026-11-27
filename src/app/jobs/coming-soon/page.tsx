import type { Metadata } from "next";

import {
  UpcomingListingPage,
  upcomingMetadata,
  type UpcomingPageConfig,
} from "@/components/jobs/UpcomingListingPage";
import { COMING_SOON_STATUSES } from "@/lib/upcoming";

export const revalidate = 1800;

const config: UpcomingPageConfig = {
  title: "Coming Soon Government Jobs",
  description:
    "Recruitments whose notification dates are officially confirmed in government examination calendars. Detailed vacancy advertisements are awaited.",
  path: "/jobs/coming-soon",
  breadcrumb: "Coming Soon Jobs",
  statuses: COMING_SOON_STATUSES,
};

export const metadata: Metadata = upcomingMetadata(config);

export default async function ComingSoonPage({
  searchParams,
}: PageProps<"/jobs/coming-soon">) {
  return <UpcomingListingPage config={config} searchParams={await searchParams} />;
}
