import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { requireAdmin } from "@/lib/admin";
import type { Job, JobCategory } from "@/types/database";

import { ReviewEntryForm, type ReviewEntry } from "./ReviewEntryForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — Review Queue",
};

const GROUP_ORDER = ["job", "admit_card", "result", "answer_key", "yojana"];
const GROUP_LABEL: Record<string, string> = {
  job: "Jobs",
  admit_card: "Admit Cards",
  result: "Results",
  answer_key: "Answer Keys",
  yojana: "Yojana",
};

export default async function ReviewQueuePage() {
  const { supabase } = await requireAdmin();

  const [{ data: entries }, { data: categories }, { data: jobs }] = await Promise.all([
    supabase
      .from("pending_entries")
      .select(
        "id, target_type, structured_data, confidence_flags, status, created_at, raw_scrape_id",
      )
      .eq("status", "pending_review")
      .order("created_at", { ascending: true })
      .limit(200),
    supabase
      .from("job_categories")
      .select("id, name, slug, parent_category, sort_order, created_at")
      .order("sort_order", { ascending: true }),
    supabase
      .from("jobs")
      .select("id, title")
      .order("title"),
  ]);

  const rawIds = (entries ?? [])
    .map((entry) => entry.raw_scrape_id)
    .filter((id): id is string => Boolean(id));
  const sourceUrls = new Map<string, string>();
  if (rawIds.length > 0) {
    const { data: rawScrapes } = await supabase
      .from("raw_scrapes")
      .select("id, source_url")
      .in("id", rawIds);
    for (const raw of rawScrapes ?? []) sourceUrls.set(raw.id, raw.source_url);
  }

  const list: ReviewEntry[] = (entries ?? []).map((e) => ({
    id: e.id,
    target_type: e.target_type,
    structured_data: (e.structured_data ?? {}) as Record<string, unknown>,
    confidence_flags: (e.confidence_flags ?? {}) as Record<string, unknown>,
    created_at: e.created_at,
    source_url: e.raw_scrape_id ? (sourceUrls.get(e.raw_scrape_id) ?? null) : null,
  }));

  const groups = GROUP_ORDER.map((t) => ({
    type: t,
    label: GROUP_LABEL[t] ?? t,
    items: list.filter((e) => e.target_type === t),
  })).filter((g) => g.items.length > 0);

  const others = list.filter((e) => !GROUP_ORDER.includes(e.target_type));
  if (others.length > 0) {
    groups.push({ type: "other", label: "Other", items: others });
  }

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Admin" }, { label: "Review Queue" }]} />
      <PageHeader
        title="Review Queue"
        subtitle={`${list.length} entr${list.length === 1 ? "y" : "ies"} awaiting human review`}
      />

      <p className="mb-4 max-w-3xl text-sm text-ink-muted">
        Automated scraper output lands here first — nothing here is live.
        Check each entry against its original source link, correct fields
        inline if needed, then <strong>Approve</strong> (writes via the same
        insert as manual add) or <strong>Reject</strong>. Red tags mark fields
        the extractor could not find; amber tags are warnings.
      </p>

      {list.length === 0 ? (
        <p className="text-sm text-ink-muted">
          Queue is empty. New scraper output will appear here.
        </p>
      ) : (
        groups.map((g) => (
          <section key={g.type} className="mb-8">
            <h2 className="mb-3 text-base font-bold">
              {g.label}{" "}
              <span className="text-sm font-normal text-ink-muted">
                ({g.items.length})
              </span>
            </h2>
            <div className="space-y-4">
              {g.items.map((entry) => (
                <ReviewEntryForm
                  key={entry.id}
                  entry={entry}
                  categories={(categories ?? []) as JobCategory[]}
                  jobs={(jobs ?? []) as Pick<Job, "id" | "title">[]}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </PageContainer>
  );
}
