import Link from "next/link";

import { PageContainer, Panel } from "@/components/layout/PageContainer";
import { JobTable } from "@/components/jobs/JobTable";
import type { JobWithCategory } from "@/types/database";

interface RecentlyClosedSectionProps {
  jobs: JobWithCategory[];
}

export function RecentlyClosedSection({ jobs }: RecentlyClosedSectionProps) {
  if (!jobs.length) return null;

  return (
    <section aria-labelledby="recently-closed" className="gov-panel mt-6">
      <div className="gov-panel-title flex items-center justify-between gap-3">
        <h2 id="recently-closed" className="font-serif text-base font-bold text-white">
          Recently Closed Applications
        </h2>
        <Link
          href="/jobs?status=recently_closed"
          className="text-xs font-semibold text-saffron no-underline hover:underline"
        >
          View All →
        </Link>
      </div>
      <div className="p-3">
        <JobTable
          jobs={jobs}
          caption="Jobs whose application window closed in the last 30 days"
          serialNumbers={false}
          empty="No recently closed jobs to show."
        />
      </div>
    </section>
  );
}
