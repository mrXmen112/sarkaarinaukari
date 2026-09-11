import Link from "next/link";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { AdminDeleteButton } from "@/components/admin/AdminDeleteButton";
import { deleteExam } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — Exams",
};

export default async function AdminExamsPage() {
  const { supabase } = await requireAdmin();

  const { data } = await supabase
    .from("exams")
    .select("id, name, slug, short_name, is_published")
    .order("name", { ascending: true })
    .limit(300);

  const exams = data ?? [];

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Admin" }]} />
      <PageHeader title="Exams" subtitle={`${exams.length} exams`} />

      <div className="mb-4">
        <Link
          href="/admin/exams/new"
          className="inline-block rounded bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"
        >
          + New Exam
        </Link>
      </div>

      {exams.length === 0 ? (
        <p className="text-sm text-ink-muted">No exams yet.</p>
      ) : (
        <ul className="divide-y divide-rule rounded border border-rule">
          {exams.map((e) => (
            <li
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5"
            >
              <div className="min-w-0">
                <Link
                  href={`/admin/exams/${e.id}/edit`}
                  className="block truncate text-sm font-semibold text-navy no-underline hover:text-alert hover:underline"
                >
                  {e.name}
                </Link>
                <span className="text-xs text-ink-muted">
                  {e.short_name ?? ""}
                  {e.is_published ? "" : " • draft"}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Link
                  href={`/exams/${e.slug}`}
                  className="text-xs font-semibold text-navy hover:underline"
                >
                  View
                </Link>
                <AdminDeleteButton
                  id={e.id}
                  confirmText="Delete this exam? This cannot be undone."
                  action={deleteExam}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}