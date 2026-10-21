import { LandingJobsPage, landingMetadata } from "@/components/jobs/LandingJobsPage";
import { BIHAR_ORG_PAGES_BY_SLUG } from "@/lib/landingPagesState";
import { countVerifiedOpenJobs } from "@/lib/queries";

const CONFIG = BIHAR_ORG_PAGES_BY_SLUG["bihar-panchayat"];
const PATH = "/bihar/bihar-panchayat";

export const revalidate = 1800;

export async function generateMetadata() {
  return landingMetadata(CONFIG, PATH, await countVerifiedOpenJobs(CONFIG.filters));
}

export default function Page() {
  return (
    <LandingJobsPage config={CONFIG} path={PATH} breadcrumbName="Bihar Panchayat Jobs" />
  );
}