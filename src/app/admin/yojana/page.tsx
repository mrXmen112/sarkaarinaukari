import Link from "next/link";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { AdminDeleteButton } from "@/components/admin/AdminDeleteButton";
import { deleteYojana } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/admin";
import { unslugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — Yojana",
};

export default async function AdminYojanaPage() {
  const { supabase } = await requireAdmin();

  const { data } = await supabase
    .from("yojana")
    .select("id, title, slug, level, state, is_published")
    .order("created_at", { ascending: false })
    .limit(300);

  const yojanas = data ?? [];

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Admin" }]} />
      <PageHeader title="Yojana" subtitle={`${yojanas.length} schemes`} />

      <div className="mb-4">
        <Link
          href="/admin/yojana/new"
          className="inline-block rounded bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"
        >
          + New Yojana
        </Link>
      </div>

      {yojanas.length === 0 ? (
        <p className="text-sm text-ink-muted">No yojana yet.</p>
      ) : (
        <ul className="divide-y divide-rule rounded border border-rule">
          {yojanas.map((y) => (
            <li
              key={y.id}
              className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5"
            >
              <div className="min-w-0">
                <Link
                  href={`/admin/yojana/${y.id}/edit`}
                  className="block truncate text-sm font-semibold text-navy no-underline hover:text-alert hover:underline"
                >
                  {y.title}
                </Link>
                <span className="text-xs text-ink-muted">
                  {y.level === "state" && y.state
                    ? `State — ${unslugify(y.state)}`
                    : "Central"}
                  {y.is_published ? "" : " • draft"}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Link
                  href={`/yojana/${y.slug}`}
                  className="text-xs font-semibold text-navy hover:underline"
                >
                  View
                </Link>
                <AdminDeleteButton
                  id={y.id}
                  confirmText="Delete this yojana? This cannot be undone."
                  action={deleteYojana}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}