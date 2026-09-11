import Link from "next/link";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { AdminDeleteButton } from "@/components/admin/AdminDeleteButton";
import { deleteJobCategory } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — Categories",
};

export default async function AdminJobCategoriesPage() {
  const { supabase } = await requireAdmin();

  const { data } = await supabase
    .from("job_categories")
    .select("id, name, slug, parent_category, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
    .limit(300);

  const categories = data ?? [];

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Admin" }]} />
      <PageHeader
        title="Job Categories"
        subtitle={`${categories.length} categories`}
      />

      <div className="mb-4">
        <Link
          href="/admin/job-categories/new"
          className="inline-block rounded bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"
        >
          + New Category
        </Link>
      </div>

      {categories.length === 0 ? (
        <p className="text-sm text-ink-muted">No categories yet.</p>
      ) : (
        <ul className="divide-y divide-rule rounded border border-rule">
          {categories.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5"
            >
              <div className="min-w-0">
                <Link
                  href={`/jobs/${c.slug}`}
                  className="block truncate text-sm font-semibold text-navy no-underline hover:text-alert hover:underline"
                >
                  {c.name}
                </Link>
                <span className="text-xs text-ink-muted">
                  {c.sort_order}
                  {c.parent_category ? ` • ${c.parent_category}` : ""}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Link
                  href={`/admin/job-categories/${c.id}/edit`}
                  className="text-xs font-semibold text-navy hover:underline"
                >
                  Edit
                </Link>
                <AdminDeleteButton
                  id={c.id}
                  confirmText="Delete this category? Jobs referencing it will keep their data but lose the link."
                  action={deleteJobCategory}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}