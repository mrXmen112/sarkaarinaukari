import { LandingJobsPage, landingMetadata } from "@/components/jobs/LandingJobsPage";
import { countVerifiedOpenJobs } from "@/lib/queries";
import { QUALIFICATION_PAGES_BY_SLUG } from "@/lib/landingPages";

const CONFIG = QUALIFICATION_PAGES_BY_SLUG["engineering"];
const PATH = "/jobs/engineering";

export const revalidate = 1800;

export async function generateMetadata() {
  return landingMetadata(CONFIG, PATH, await countVerifiedOpenJobs(CONFIG.filters));
}

export default function Page() {
  return (
    <LandingJobsPage config={CONFIG} path={PATH} breadcrumbName="Engineering Jobs" />
  );
}