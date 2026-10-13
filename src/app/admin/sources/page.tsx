import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/date";
import { SourceToggles } from "./SourceToggles";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Scrape Sources — Admin",
};

/**
 * Pipeline source management (Phase 1): which official sites the scraper
 * visits, plus the per-source "trusted, auto-publish" switch reserved for
 * later automation. Publishing itself always stays in the review queue.
 */
export default async function AdminSourcesPage() {
  const { supabase } = await requireAdmin();

  const { data: sources } = await supabase
    .from("scrape_sources")
    .select("*")
    .order("name");

  const rows = (sources ?? []) as {
    id: string;
    name: string;
    base_url: string;
    target_type: string;
    scrape_frequency_hours: number;
    is_active: boolean;
    auto_publish: boolean;
    last_scraped_at: string | null;
  }[];

  return (
    <PageContainer>
      <Breadcrumbs
        items={[{ label: "Admin", href: "/admin" }, { label: "Scrape Sources" }]}
      />
      <PageHeader
        title="Scrape Sources"
        subtitle="Official recruitment sites feeding the vacancy pipeline. Only active sources with a live adapter are scraped (rotation, oldest first)."
      />

      <section aria-labelledby="sources-table" className="gov-panel">
        <div className="gov-panel-title" id="sources-table">
          Sources ({rows.length})
        </div>
        <div className="overflow-x-auto p-3">
          {rows.length === 0 ? (
            <p className="text-sm text-ink-muted">No sources configured yet.</p>
          ) : (
            <table className="gov-table">
              <caption className="sr-only">Configured scrape sources</caption>
              <thead>
                <tr>
                  <th scope="col">Source</th>
                  <th scope="col">Type</th>
                  <th scope="col">Every</th>
                  <th scope="col">Last scraped</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id}>
                    <th scope="row" className="text-left">
                      <span className="block font-semibold text-navy">{s.name}</span>
                      <a
                        href={s.base_url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="text-xs text-ink-muted underline decoration-ink-faint underline-offset-2"
                      >
                        {s.base_url}
                      </a>
                    </th>
                    <td className="capitalize">{s.target_type.replace("_", " ")}</td>
                    <td>{s.scrape_frequency_hours}h</td>
                    <td>
                      {s.last_scraped_at ? formatDate(s.last_scraped_at) : "never"}
                    </td>
                    <td>
                      <SourceToggles
                        id={s.id}
                        isActive={s.is_active}
                        autoPublish={s.auto_publish}
                      />
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
