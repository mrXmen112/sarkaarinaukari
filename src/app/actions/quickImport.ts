"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin";
import { slugify } from "@/lib/utils";
import { crossCheckSourceText, validateRequiredFields, type AutoPublishDraft } from "@/lib/autoPublish";
import { revalidateJobSurfaces } from "@/lib/revalidatePublic";
import { createAdminClient } from "@/lib/supabase/server";

export type QuickImportResult = { ok: boolean; message: string; slug?: string };

const UA =
  "Mozilla/5.0 (compatible; SarkaariNaukriBot/1.0; +https://sarkaarinaukri.online/contact)";

function text(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

function parseDate(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : value;
}

async function fetchOfficialText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/html" },
    redirect: "follow",
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Official URL returned HTTP ${res.status}`);
  const html = await res.text();
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Manual entry fallback for official notices whose listing pages block the
 * automated collector (UPSC, SSC, RRB...). It is NOT an approval bypass: the
 * entered values must still be found verbatim in the official source text.
 */
export async function quickImportOfficial(
  _prev: QuickImportResult,
  formData: FormData,
): Promise<QuickImportResult> {
  await requireAdmin();

  const draft: AutoPublishDraft = {
    title: text(formData.get("title")),
    department: text(formData.get("department")),
    state: text(formData.get("state")) || null,
    official_link: text(formData.get("official_link")),
    official_apply_url: text(formData.get("apply_url")) || null,
    notification_pdf_link: text(formData.get("notification_pdf")) || null,
    notice_number: text(formData.get("notice_number")) || null,
    vacancy_total: Number(text(formData.get("vacancy_total"))) || null,
    eligibility_education: text(formData.get("eligibility")) || null,
    application_start: parseDate(text(formData.get("start_date"))),
    application_end: parseDate(text(formData.get("end_date"))),
    pay_scale: text(formData.get("pay_scale")) || null,
    type: "job",
  };

  const required = validateRequiredFields(draft);
  if (!required.ok) {
    return { ok: false, message: required.errors.map((e) => e.message).join("; ") };
  }

  let sourceText = text(formData.get("source_text"));
  try {
    sourceText = `${await fetchOfficialText(String(draft.official_link))} ${sourceText}`;
  } catch (error) {
    if (!sourceText) {
      const message = error instanceof Error ? error.message : String(error);
      return { ok: false, message: `Official URL could not be fetched and no notice text was pasted: ${message}` };
    }
  }

  const checked = crossCheckSourceText(draft, sourceText);
  if (!checked.ok) {
    const message = `Source cross-check failed: ${checked.errors.map((e) => e.code).join(", ")}`;
    const db = createAdminClient();
    await db.from("import_errors").insert({
      phase: "validate",
      code: checked.errors[0].code,
      message,
      details: { title: draft.title, url: draft.official_link },
    });
    return { ok: false, message };
  }

  const db = createAdminClient();
  const slug = slugify(`${draft.title} ${draft.notice_number ?? ""}`);
  const { data: existing } = await db.from("jobs").select("slug").eq("slug", slug).limit(1);
  if (existing?.length) return { ok: false, message: `Already imported: /jobs/${slug}` };

  const { data: inserted, error } = await db
    .from("jobs")
    .insert({
      title: String(draft.title),
      slug,
      department: draft.department ?? undefined,
      state: draft.state ?? undefined,
      eligibility_education: draft.eligibility_education ?? undefined,
      vacancy_total: Number(draft.vacancy_total) || undefined,
      pay_scale: draft.pay_scale ?? undefined,
      application_start: draft.application_start ?? undefined,
      application_end: String(draft.application_end),
      official_link: String(draft.official_link),
      official_apply_url: draft.official_apply_url ?? undefined,
      notification_pdf_link: draft.notification_pdf_link
        ? String(draft.notification_pdf_link)
        : undefined,
      notice_number: draft.notice_number ?? undefined,
      source_url: draft.official_link,
      status: "active",
      type: "job",
      is_published: true,
      auto_published: true,
      verification_status: "unverified",
    })
    .select("id, slug")
    .single();
  if (error || !inserted) return { ok: false, message: error?.message ?? "Insert failed" };

  const { error: verifyError } = await db.rpc("mark_auto_verified", {
    p_job_id: inserted.id,
    p_source: "quick-import",
    p_note: "Admin-entered notice cross-checked against official source text",
  });
  if (verifyError) {
    await db.from("jobs").update({ is_published: false }).eq("id", inserted.id);
    return { ok: false, message: `Verification failed: ${verifyError.message}` };
  }

  revalidateJobSurfaces(slug);
  revalidatePath("/admin/quick-import");
  return { ok: true, message: `Published /jobs/${slug}`, slug };
}
