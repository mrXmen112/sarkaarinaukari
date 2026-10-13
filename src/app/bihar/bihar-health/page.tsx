import { LandingJobsPage, landingMetadata } from "@/components/jobs/LandingJobsPage";
import { BIHAR_ORG_PAGES_BY_SLUG } from "@/lib/landingPagesState";

const CONFIG = BIHAR_ORG_PAGES_BY_SLUG["bihar-health"];
const PATH = "/bihar/bihar-health";

export const revalidate = 1800;

export const metadata = landingMetadata(CONFIG, PATH);

export default function Page() {
  return (
    <LandingJobsPage config={CONFIG} path={PATH} breadcrumbName="Bihar Health Jobs" />
  );
}