import type { Metadata } from "next";

import { PageContainer, PageHeader, Panel } from "@/components/layout/PageContainer";
import { createAdminClient } from "@/lib/supabase/server";
import { isoDatePlusDays } from "@/lib/date";
import { formatIndianNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Automation Monitoring — Admin",
  robots: { index: false, follow: false },
};

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-sm border border-rule bg-surface p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {label}
      </p>
      <p className="mt-1 font-serif text-xl font-bold text-navy">
        {typeof value === "number" ? formatIndianNumber(value) : value}
      </p>
    </div>
  );
}

export default async function AutomationPage() {
  const db = createAdminClient();
  const since = isoDatePlusDays(-1);

  const [sources, logs, errors, published, expired, pending] = await Promise.all([
    db
      .from("scrape_sources")
      .select("id, name, is_active, auto_publish, source_group, last_scraped_at")
      .order("name"),
    db
      .from("scrape_logs")
      .select("id, run_at, status, source_id, items_found, items_new, items_updated, items_duplicate, items_failed, error_message")
      .order("run_at", { ascending: false })
      .limit(20),
    db
      .from("import_errors")
      .select("id, created_at, phase, code, message, source_id")
      .order("created_at", { ascending: false })
      .limit(30),
    db
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("auto_published", true)
      .gte("created_at", since),
    db
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true)
      .lt("application_end", isoDatePlusDays(0)),
    db
      .from("pending_entries")
      .select("status", { count: "exact", head: true })
      .eq("status", "auto_pending"),
  ]);

  const logRows = logs.data ?? [];
  const errorRows = errors.data ?? [];
  const sourceRows = sources.data ?? [];
  const successful = logRows.find((l) => l.status === "success");
  const activeSources = sourceRows.filter((s) => s.is_active).length;
  const duplicates =
    logRows.reduce((n, l) => n + (l.items_duplicate ?? 0), 0) +
    errorRows.filter((e) => e.code === "duplicate_notice").length;

  return (
    <PageContainer>
      <PageHeader
        title="Automation Monitoring"
        subtitle="Collection, validation and publishing health. This page is for monitoring only — verified notices publish without manual approval."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric
          label="Last successful sync"
          value={successful ? new Date(successful.run_at).toLocaleString("en-IN") : "Never"}
        />
        <Metric label="Active sources" value={`${activeSources} / ${sourceRows.length}`} />
        <Metric label="New jobs (24h)" value={published.count ?? 0} />
        <Metric label="Pending automated" value={pending.count ?? 0} />
        <Metric label="Expired notices" value={expired.count ?? 0} />
        <Metric
          label="Duplicates skipped"
          value={duplicates}
        />
        <Metric
          label="Failed source requests"
          value={logRows.filter((l) => l.status === "failed").length}
        />
        <Metric label="Validation errors" value={errorRows.length} />
      </div>

      <Panel title="Import & validation errors" className="mb-5">
        {errorRows.length === 0 ? (
          <p className="p-3 text-sm text-ink-muted">No recent processing errors.</p>
        ) : (
          <div className="overflow-x-auto p-3">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-rule text-ink-muted">
                  <th className="py-2">When</th>
                  <th>Phase</th>
                  <th>Code</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {errorRows.map((e) => (
                  <tr key={e.id}>
                    <td className="py-2">{new Date(e.created_at).toLocaleString("en-IN")}</td>
                    <td>{e.phase}</td>
                    <td><code>{e.code}</code></td>
                    <td>{e.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Recent source runs" className="mb-5">
        {logRows.length === 0 ? (
          <p className="p-3 text-sm text-ink-muted">No runs recorded yet.</p>
        ) : (
          <div className="overflow-x-auto p-3">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-rule text-ink-muted">
                  <th className="py-2">When</th>
                  <th>Status</th>
                  <th>Found</th>
                  <th>New</th>
                  <th>Updated</th>
                  <th>Duplicates</th>
                  <th>Failed</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {logRows.map((l) => (
                  <tr key={l.id}>
                    <td className="py-2">{new Date(l.run_at).toLocaleString("en-IN")}</td>
                    <td>{l.status}</td>
                    <td>{l.items_found}</td>
                    <td>{l.items_new}</td>
                    <td>{l.items_updated}</td>
                    <td>{l.items_duplicate}</td>
                    <td>{l.items_failed}</td>
                    <td>{l.error_message ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Source registry">
        <div className="overflow-x-auto p-3">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-rule text-ink-muted">
                <th className="py-2">Source</th>
                <th>Group</th>
                <th>Active</th>
                <th>Auto-publish</th>
                <th>Last scraped</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {sourceRows.map((s) => (
                <tr key={s.id}>
                  <td className="py-2">{s.name}</td>
                  <td>{s.source_group ?? "—"}</td>
                  <td>{s.is_active ? "Yes" : "No"}</td>
                  <td>{s.auto_publish ? "Yes" : "No"}</td>
                  <td>
                    {s.last_scraped_at
                      ? new Date(s.last_scraped_at).toLocaleString("en-IN")
                      : "Never"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </PageContainer>
  );
}
