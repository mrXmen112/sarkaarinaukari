import Link from "next/link";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { AdminDeleteButton } from "@/components/admin/AdminDeleteButton";
import { deleteAdmitCard } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/date";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — Admit Cards",
};

export default async function AdminAdmitCardsPage() {
  const { supabase } = await requireAdmin();

  const { data } = await supabase
    .from("admit_cards")
    .select("id, title, slug, release_date, is_published")
    .order("release_date", { ascending: false })
    .limit(300);

  const rows = data ?? [];

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Admin" }]} />
      <PageHeader title="Admit Cards" subtitle={`${rows.length} cards`} />

      <div className="mb-4">
        <Link
          href="/admin/admit-cards/new"
          className="inline-block rounded bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"
        >
          + New Admit Card
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-ink-muted">No admit cards yet.</p>
      ) : (
        <ul className="divide-y divide-rule rounded border border-rule">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5"
            >
              <div className="min-w-0">
                <Link
                  href={`/admin/admit-cards/${r.id}/edit`}
                  className="block truncate text-sm font-semibold text-navy no-underline hover:text-alert hover:underline"
                >
                  {r.title}
                </Link>
                <span className="text-xs text-ink-muted">
                  {r.release_date ? formatDate(r.release_date) : "No date"}
                  {r.is_published ? "" : " • draft"}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Link
                  href={`/admit-card/${r.slug}`}
                  className="text-xs font-semibold text-navy hover:underline"
                >
                  View
                </Link>
                <AdminDeleteButton
                  id={r.id}
                  confirmText="Delete this admit card?"
                  action={deleteAdmitCard}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}