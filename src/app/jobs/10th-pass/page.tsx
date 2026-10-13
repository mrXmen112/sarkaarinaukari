import { LandingJobsPage, landingMetadata } from "@/components/jobs/LandingJobsPage";
import { QUALIFICATION_PAGES_BY_SLUG } from "@/lib/landingPages";

const CONFIG = QUALIFICATION_PAGES_BY_SLUG["10th-pass"];
const PATH = "/jobs/10th-pass";

export const revalidate = 1800;

export const metadata = landingMetadata(CONFIG, PATH);

export default function Page() {
  return (
    <LandingJobsPage config={CONFIG} path={PATH} breadcrumbName="10th Pass" />
  );
}