import { LandingJobsPage, landingMetadata } from "@/components/jobs/LandingJobsPage";
import { QUALIFICATION_PAGES_BY_SLUG } from "@/lib/landingPages";

const CONFIG = QUALIFICATION_PAGES_BY_SLUG["graduate"];
const PATH = "/jobs/graduate";

export const revalidate = 1800;

export const metadata = landingMetadata(CONFIG, PATH);

export default function Page() {
  return (
    <LandingJobsPage config={CONFIG} path={PATH} breadcrumbName="Graduate Jobs" />
  );
}