import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/date";
import { listFlaggedJobs } from "@/lib/linkCheck";
import { RunLinkCheckButton } from "./RunLinkCheckButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Link Report — Admin",
};

/**
 * Dead-link audit (Phase 1): published jobs whose official apply URL or
 * notification PDF failed their last HTTP check. The page stays live with a
 * "verify" badge; the Apply button is the thing that gets flagged for fixing.
 */
export default async function AdminLinkReportPage() {
  await requireAdmin();
  const flagged = await listFlaggedJobs(100);

  return (
    <PageContainer>
      <Breadcrumbs
        items={[{ label: "Admin", href: "/admin" }, { label: "Link Report" }]}
      />
      <PageHeader
        title="Link Report"
        subtitle="Jobs with apply/notification links that failed their last check. Fix the link in the job editor; the public page keeps working with a verify badge."
      />

      <div className="mb-4">
        <RunLinkCheckButton />
      </div>

      <section aria-labelledby="flagged-links" className="gov-panel">
        <div className="gov-panel-title" id="flagged-links">
          Flagged Jobs ({flagged.length})
        </div>
        <div className="overflow-x-auto p-3">
          {flagged.length === 0 ? (
            <p className="text-sm text-ink-muted">
              No flagged links. Run a check to audit published jobs now (the daily
              cron checks 20 jobs per run, oldest first).
            </p>
          ) : (
            <table className="gov-table">
              <caption className="sr-only">Jobs with dead official links</caption>
              <thead>
                <tr>
                  <th scope="col">Job</th>
                  <th scope="col">Broken link</th>
                  <th scope="col">Status</th>
                  <th scope="col">Last checked</th>
                </tr>
              </thead>
              <tbody>
                {flagged.map((job) => (
                  <tr key={job.id}>
                    <th scope="row" className="text-left">
                      <a
                        href={`/admin/jobs/${job.id}/edit`}
                        className="font-semibold text-navy underline decoration-navy/30 underline-offset-2 hover:decoration-navy"
                      >
                        {job.title}
                      </a>
                    </th>
                    <td>
                      <a
                        href={job.official_link}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="break-all text-xs text-ink-muted underline decoration-ink-faint underline-offset-2"
                      >
                        {job.official_link}
                      </a>
                    </td>
                    <td className="font-semibold text-alert">
                      {job.link_http_status === 0
                        ? "unreachable"
                        : job.link_http_status != null
                          ? `HTTP ${job.link_http_status}`
                          : "—"}
                    </td>
                    <td>
                      {job.link_last_checked_at
                        ? formatDate(job.link_last_checked_at)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </PageContainer>
  );
}
