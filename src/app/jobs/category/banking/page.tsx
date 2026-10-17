import { LandingJobsPage, landingMetadata } from "@/components/jobs/LandingJobsPage";
import { countVerifiedOpenJobs } from "@/lib/queries";
import { CATEGORY_PAGES_BY_SLUG } from "@/lib/landingPages";

const CONFIG = CATEGORY_PAGES_BY_SLUG["banking"];
const PATH = "/jobs/category/banking";

export const revalidate = 1800;

export async function generateMetadata() {
  return landingMetadata(CONFIG, PATH, await countVerifiedOpenJobs(CONFIG.filters));
}

export default function Page() {
  return (
    <LandingJobsPage config={CONFIG} path={PATH} breadcrumbName="Banking Jobs" />
  );
}