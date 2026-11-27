import { createAdminClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import { validateOfficialUrl } from "@/lib/linkCheck";
import { deriveJobStatus } from "@/lib/jobStatus";
import {
  assessAutoPublish,
  duplicateKey,
  hostnameOf,
  type AutoPublishDraft,
  type RegisteredSource,
} from "@/lib/autoPublish";
import { revalidateJobSurfaces } from "@/lib/revalidatePublic";
import type { Job, JobStatus, Json } from "@/types/database";

/**
 * Server-side automated publishing runner.
 *
 * Called by the pipeline cron AFTER collection and structuring. It never
 * publishes a row that fails the source, field and source-text checks; failed
 * rows become `automated_error` entries in import_errors for monitoring.
 * No administrator action is required for a notice that passes.
 */
export type AutoPublishSummary = {
  examined: number;
  published: string[];
  errors: { code: string; message: string; pendingId: string }[];
  duplicates: number;
};

type PendingRow = {
  id: string;
  raw_scrape_id: string | null;
  target_type: string;
  structured_data: unknown;
  status: string;
};

type RawRow = {
  id: string;
  source_id: string | null;
  source_url: string;
  raw_content: string;
};

type SourceRow = RegisteredSource & { id: string };

async function recordError(
  db: ReturnType<typeof createAdminClient>,
  input: {
    phase: "scrape" | "structure" | "validate" | "publish";
    code: string;
    message: string;
    sourceId?: string | null;
    pendingId?: string | null;
    rawScrapeId?: string | null;
    details?: Record<string, unknown>;
  },
) {
  await db.from("import_errors").insert({
    phase: input.phase,
    code: input.code,
    message: input.message.slice(0, 2000),
    source_id: input.sourceId ?? null,
    pending_entry_id: input.pendingId ?? null,
    raw_scrape_id: input.rawScrapeId ?? null,
    details: (input.details ?? {}) as Json,
  });
}

async function uniqueSlug(
  db: ReturnType<typeof createAdminClient>,
  title: string,
): Promise<string> {
  const base = slugify(title) || "government-job";
  const { data } = await db
    .from("jobs")
    .select("slug")
    .or(`slug.eq.${base},slug.like.${base}-%`);
  const taken = new Set((data ?? []).map((r) => r.slug));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

function toDraft(value: unknown): AutoPublishDraft {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as AutoPublishDraft;
}

function asArray(value: unknown): string[] | null {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
  }
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return null;
}

export async function runAutoPublish(limit = 10): Promise<AutoPublishSummary> {
  const db = createAdminClient();
  const summary: AutoPublishSummary = {
    examined: 0,
    published: [],
    errors: [],
    duplicates: 0,
  };

  const { data: pending, error: pendingError } = await db
    .from("pending_entries")
    .select("id, raw_scrape_id, target_type, structured_data, status")
    .eq("status", "auto_pending")
    .order("created_at", { ascending: true })
    .limit(limit);
  if (pendingError || !pending?.length) return summary;
  summary.examined = pending.length;

  const rows = pending as PendingRow[];
  const rawIds = rows.flatMap((r) => (r.raw_scrape_id ? [r.raw_scrape_id] : []));
  const { data: raws } = rawIds.length
    ? await db
        .from("raw_scrapes")
        .select("id, source_id, source_url, raw_content")
        .in("id", rawIds)
    : { data: [] as RawRow[] };
  const rawById = new Map<string, RawRow>(((raws ?? []) as RawRow[]).map((r) => [r.id, r]));

  const sourceIds = [...new Set([...rawById.values()].flatMap((r) => (r.source_id ? [r.source_id] : [])))];
  const { data: sources } = sourceIds.length
    ? await db
        .from("scrape_sources")
        .select("id, name, base_url, allowed_domains, auto_publish")
        .in("id", sourceIds)
    : { data: [] as SourceRow[] };
  const sourceById = new Map<string, SourceRow>(((sources ?? []) as SourceRow[]).map((s) => [s.id, s]));

  for (const entry of rows) {
    const raw = entry.raw_scrape_id ? rawById.get(entry.raw_scrape_id) : undefined;
    const source = raw?.source_id ? sourceById.get(raw.source_id) : undefined;
    const draft = toDraft(entry.structured_data);
    const label = draft.title ? String(draft.title).slice(0, 80) : entry.id;

    const fail = async (code: string, message: string, phase: "validate" | "publish" = "validate") => {
      summary.errors.push({ code, message, pendingId: entry.id });
      await recordError(db, {
        phase,
        code,
        message,
        sourceId: source?.id ?? raw?.source_id ?? null,
        pendingId: entry.id,
        rawScrapeId: entry.raw_scrape_id,
        details: { title: label },
      });
      await db
        .from("pending_entries")
        .update({ status: "automated_error" })
        .eq("id", entry.id);
    };

    if (entry.target_type !== "job") {
      await fail("unsupported_target_type", `Automated publishing handles jobs only (got ${entry.target_type})`);
      continue;
    }
    if (!raw) {
      await fail("missing_raw_source", "No stored official source text for this entry");
      continue;
    }

    const assessment = assessAutoPublish(draft, source ?? null, raw.raw_content);
    if (!assessment.ok) {
      for (const problem of assessment.errors) {
        await fail(problem.code, `${label}: ${problem.message}`);
      }
      continue;
    }

    const key = duplicateKey(draft);
    if (key) {
      let duplicate: string | null = null;
      if (key.startsWith("notice:")) {
        const { data } = await db
          .from("jobs")
          .select("slug")
          .eq("notice_number", String(draft.notice_number))
          .limit(1);
        duplicate = data?.[0]?.slug ?? null;
      } else if (key.startsWith("url:")) {
        const { data } = await db
          .from("jobs")
          .select("slug")
          .eq("official_link", String(draft.official_link))
          .limit(1);
        duplicate = data?.[0]?.slug ?? null;
      }
      if (duplicate) {
        summary.duplicates++;
        await fail("duplicate_notice", `Duplicate of /jobs/${duplicate}`, "publish");
        continue;
      }
    }

    const link = await validateOfficialUrl(String(draft.official_link));
    if (!link.ok) {
      await fail("official_link_unreachable", `${label}: ${link.reason}`, "publish");
      continue;
    }

    const slug = await uniqueSlug(db, String(draft.title));
    const derived = deriveJobStatus({
      status: String(draft.status ?? "active"),
      application_start: draft.application_start as string | null,
      application_end: draft.application_end as string | null,
    });
    const status: JobStatus =
      derived === "open" || derived === "closing_soon" ? "active" : derived;
    const payload: Partial<Job> = {
      title: String(draft.title),
      slug,
      department: draft.department ? String(draft.department) : null,
      department_slug: draft.department_slug ? String(draft.department_slug) : null,
      state: draft.state ? String(draft.state) : null,
      eligibility_education: draft.eligibility_education ? String(draft.eligibility_education) : null,
      vacancy_total: Number(draft.vacancy_total),
      application_fee: (draft.application_fee as Record<string, number>) ?? null,
      selection_process: asArray(draft.selection_process),
      how_to_apply: asArray(draft.how_to_apply),
      pay_scale: draft.pay_scale ? String(draft.pay_scale) : null,
      notification_pdf_link: draft.notification_pdf_link ? String(draft.notification_pdf_link) : null,
      notice_number: draft.notice_number ? String(draft.notice_number) : null,
      notification_date: draft.notification_date ? String(draft.notification_date).slice(0, 10) : null,
      application_start: draft.application_start ? String(draft.application_start).slice(0, 10) : null,
      application_end: String(draft.application_end).slice(0, 10),
      exam_date: draft.exam_date ? String(draft.exam_date).slice(0, 10) : null,
      official_link: String(draft.official_link),
      official_apply_url: draft.official_apply_url ? String(draft.official_apply_url) : null,
      official_site_url: source?.base_url ?? null,
      source_url: raw.source_url,
      status,
      type: "job" as const,
      is_published: true,
      source_verified: false,
      verification_status: "unverified",
      source_id: source?.id ?? null,
      raw_scrape_id: raw.id,
      pending_entry_id: entry.id,
      auto_published: true,
      verified_at: null,
      verified_by: null,
    };

    const { data: inserted, error: insertError } = await db
      .from("jobs")
      .insert(payload)
      .select("id, slug")
      .single();
    if (insertError || !inserted) {
      await fail("job_insert_failed", `${label}: ${insertError?.message ?? "unknown error"}`, "publish");
      continue;
    }

    const { error: verifyError } = await db.rpc("mark_auto_verified", {
      p_job_id: inserted.id,
      p_source: source?.name ?? hostnameOf(String(draft.official_link)) ?? "unknown",
      p_note: `Automatically cross-checked against ${raw.source_url}`,
    });
    if (verifyError) {
      // Never leave an unverified row publicly visible after a failed stamp.
      await db.from("jobs").update({ is_published: false }).eq("id", inserted.id);
      await fail("verification_stamp_failed", `${label}: ${verifyError.message}`, "publish");
      continue;
    }

    await db
      .from("pending_entries")
      .update({
        status: "auto_published",
        reviewed_by: `auto:${source?.name ?? "unknown"}`,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", entry.id);

    summary.published.push(inserted.slug);
    try {
      revalidateJobSurfaces(inserted.slug);
    } catch {
      // Standalone CLI runs have no Next request cache to purge.
    }
  }

  return summary;
}
