import type { Metadata } from "next";

import { JobTable } from "@/components/jobs/JobTable";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { listArchivedJobs } from "@/lib/queries";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Closed Job Archive — Old Sarkari Naukri Notifications",
  description:
    "Archive of government job notifications closed more than 90 days ago. Pages stay live for reference — check Latest Jobs for currently open vacancies.",
  alternates: { canonical: "/jobs/archive" },
  robots: { index: true, follow: true },
};

/**
 * Archive listing (Phase 1): closed vacancies older than 90 days stay live
 * and indexable — they are never deleted — but move out of Latest Jobs and
 * the Recently Closed section.
 */
export default async function ArchivePage() {
  const archived = await listArchivedJobs(200);

  return (
    <PageContainer>
      <PageHeader
        title="Closed Job Archive"
        subtitle="Notifications closed for more than 90 days — kept for reference. For open vacancies see Latest Jobs."
      />

      <section aria-labelledby="archive-jobs" className="gov-panel">
        <div className="gov-panel-title" id="archive-jobs">
          Archived Vacancies ({archived.length})
        </div>
        <div className="p-3">
          <JobTable
            jobs={archived}
            caption="Archived government job notifications"
            empty="No archived vacancies yet."
          />
        </div>
      </section>
    </PageContainer>
  );
}
