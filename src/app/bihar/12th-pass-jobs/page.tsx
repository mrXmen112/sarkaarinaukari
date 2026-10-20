import { LandingJobsPage, landingMetadata } from "@/components/jobs/LandingJobsPage";
import { BIHAR_GUIDE_PAGES_BY_SLUG } from "@/lib/landingPagesState";
import { countVerifiedOpenJobs } from "@/lib/queries";

const CONFIG = BIHAR_GUIDE_PAGES_BY_SLUG["12th-pass-jobs"];
const PATH = "/bihar/12th-pass-jobs";

export const revalidate = 1800;

export async function generateMetadata() {
  const verifiedOpenJobs = await countVerifiedOpenJobs(CONFIG.filters);
  return landingMetadata(CONFIG, PATH, verifiedOpenJobs);
}

export default function Page() {
  return (
    <LandingJobsPage
      config={CONFIG}
      path={PATH}
      breadcrumbName="Bihar 12th Pass Jobs"
    />
  );
}
