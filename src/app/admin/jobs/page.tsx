import Link from "next/link";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { AdminDeleteButton } from "@/components/admin/AdminDeleteButton";
import { deleteJob } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/date";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — Jobs",
};

export default async function AdminJobsPage() {
  const { supabase } = await requireAdmin();

  const { data } = await supabase
    .from("jobs")
    .select(
      "id, title, slug, state, department_slug, status, is_published, application_end, job_categories(id, name)",
    )
    .order("application_end", { ascending: false })
    .limit(300);

  const jobs = data ?? [];

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Admin" }]} />
      <PageHeader title="Jobs" subtitle={`${jobs.length} jobs`} />

      <div className="mb-4">
        <Link
          href="/admin/jobs/new"
          className="inline-block rounded bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"
        >
          + New Job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <p className="text-sm text-ink-muted">No jobs yet.</p>
      ) : (
        <ul className="divide-y divide-rule rounded border border-rule">
          {jobs.map((j) => (
            <li
              key={j.id}
              className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5"
            >
              <div className="min-w-0">
                <Link
                  href={`/admin/jobs/${j.id}/edit`}
                  className="block truncate text-sm font-semibold text-navy no-underline hover:text-alert hover:underline"
                >
                  {j.title}
                </Link>
                <span className="text-xs text-ink-muted">
                  <span
                    className={
                      j.status === "closed"
                        ? "font-medium text-red-700"
                        : j.status === "upcoming"
                          ? "font-medium text-amber-700"
                          : ""
                    }
                  >
                    {j.status}
                  </span>
                  {" • "}
                  {j.job_categories?.name ?? "Uncategorised"}
                  {j.state ? ` • ${j.state}` : ""}
                  {j.department_slug ? ` • ${j.department_slug}` : ""}
                  {j.is_published ? "" : " • draft"}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-xs text-ink-muted">
                  ends {formatDate(j.application_end)}
                </span>
                <Link
                  href={`/jobs/${j.slug}`}
                  className="text-xs font-semibold text-navy hover:underline"
                >
                  View
                </Link>
                <AdminDeleteButton
                  id={j.id}
                  confirmText="Delete this job? Its admit cards, results and answer keys will also be deleted (FK cascade)."
                  action={deleteJob}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}