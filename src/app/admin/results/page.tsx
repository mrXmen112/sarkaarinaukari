import Link from "next/link";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { AdminDeleteButton } from "@/components/admin/AdminDeleteButton";
import { deleteResult } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/date";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — Results",
};

export default async function AdminResultsPage() {
  const { supabase } = await requireAdmin();

  const { data } = await supabase
    .from("results")
    .select("id, title, slug, result_date, is_published")
    .order("result_date", { ascending: false })
    .limit(300);

  const rows = data ?? [];

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Admin" }]} />
      <PageHeader title="Results" subtitle={`${rows.length} results`} />

      <div className="mb-4">
        <Link
          href="/admin/results/new"
          className="inline-block rounded bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"
        >
          + New Result
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-ink-muted">No results yet.</p>
      ) : (
        <ul className="divide-y divide-rule rounded border border-rule">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5"
            >
              <div className="min-w-0">
                <Link
                  href={`/admin/results/${r.id}/edit`}
                  className="block truncate text-sm font-semibold text-navy no-underline hover:text-alert hover:underline"
                >
                  {r.title}
                </Link>
                <span className="text-xs text-ink-muted">
                  {r.result_date ? formatDate(r.result_date) : "No date"}
                  {r.is_published ? "" : " • draft"}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Link
                  href={`/result/${r.slug}`}
                  className="text-xs font-semibold text-navy hover:underline"
                >
                  View
                </Link>
                <AdminDeleteButton
                  id={r.id}
                  confirmText="Delete this result?"
                  action={deleteResult}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}