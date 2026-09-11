import Link from "next/link";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { DeleteCurrentAffairButton } from "@/components/admin/DeleteCurrentAffairButton";
import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/date";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — Current Affairs",
};

export default async function AdminCurrentAffairsPage() {
  const { supabase } = await requireAdmin();

  const { data } = await supabase
    .from("current_affairs")
    .select("id, date, title, slug, is_published")
    .order("date", { ascending: false })
    .limit(200);

  const affairs = data ?? [];

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Admin" }]} />
      <PageHeader
        title="Current Affairs"
        subtitle={`${affairs.length} briefs`}
      />

      <div className="mb-4">
        <Link
          href="/admin/current-affairs/new"
          className="inline-block rounded bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"
        >
          + New Brief
        </Link>
      </div>

      {affairs.length === 0 ? (
        <p className="text-sm text-ink-muted">No current affairs yet.</p>
      ) : (
        <ul className="divide-y divide-rule rounded border border-rule">
          {affairs.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5">
              <div className="min-w-0">
                <Link
                  href={`/admin/current-affairs/${a.id}/edit`}
                  className="block truncate text-sm font-semibold text-navy no-underline hover:text-alert hover:underline"
                >
                  {a.title}
                </Link>
                <span className="text-xs text-ink-muted">
                  {formatDate(a.date)}
                  {a.is_published ? "" : " • draft"}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Link
                  href={`/current-affairs/${a.slug}`}
                  className="text-xs font-semibold text-navy hover:underline"
                >
                  View
                </Link>
                <DeleteCurrentAffairButton id={a.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}