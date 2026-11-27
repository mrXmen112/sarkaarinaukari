import type { Metadata } from "next";

import {
  UpcomingListingPage,
  upcomingMetadata,
  type UpcomingPageConfig,
} from "@/components/jobs/UpcomingListingPage";
import { UPCOMING_EXAM_STATUSES } from "@/lib/upcoming";

export const revalidate = 1800;

const config: UpcomingPageConfig = {
  title: "Upcoming Government Exams",
  description:
    "Examinations whose recruitment advertisements are already published and whose examination dates are in the future.",
  path: "/exams/upcoming",
  breadcrumb: "Upcoming Exams",
  statuses: UPCOMING_EXAM_STATUSES,
};

export const metadata: Metadata = upcomingMetadata(config);

export default async function UpcomingExamsPage({
  searchParams,
}: PageProps<"/exams/upcoming">) {
  return <UpcomingListingPage config={config} searchParams={await searchParams} />;
}
