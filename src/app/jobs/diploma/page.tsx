import { LandingJobsPage, landingMetadata } from "@/components/jobs/LandingJobsPage";
import { countVerifiedOpenJobs } from "@/lib/queries";
import { QUALIFICATION_PAGES_BY_SLUG } from "@/lib/landingPages";

const CONFIG = QUALIFICATION_PAGES_BY_SLUG["diploma"];
const PATH = "/jobs/diploma";

export const revalidate = 1800;

export async function generateMetadata() {
  return landingMetadata(CONFIG, PATH, await countVerifiedOpenJobs(CONFIG.filters));
}

export default function Page() {
  return (
    <LandingJobsPage config={CONFIG} path={PATH} breadcrumbName="Diploma Jobs" />
  );
}