"use server";

import { revalidatePath } from "next/cache";

import {
  createAdmitCard,
  createJob,
  createResult,
  type AdminResult,
} from "@/app/actions/admin";
import { requireAdmin } from "@/lib/admin";
import {
  buildAdmitCardInput,
  buildJobInput,
  buildResultInput,
  isSupportedTarget,
  prettyLabel,
  type FlatFields,
} from "@/lib/reviewQueue";

function err(message: string): AdminResult {
  return { ok: false, error: message };
}

type PendingRow = {
  id: string;
  target_type: string;
  status: string;
  raw_scrape_id: string | null;
};

type ReviewExtra = {
  category_id: string;
  state: string;
  status: string;
  job_id: string;
  is_published: boolean;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const JOB_STATUSES = new Set(["active", "upcoming", "closed"]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function normalizeFields(input: unknown): FlatFields | null {
  if (!isPlainObject(input)) return null;
  const normalized: FlatFields = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value !== "string") return null;
    normalized[key] = value;
  }
  return normalized;
}

function optionalText(value: unknown): string | null {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") return null;
  return value.trim();
}

function normalizeExtra(input: unknown): ReviewExtra | null {
  if (!isPlainObject(input)) return null;
  const categoryId = optionalText(input.category_id);
  const state = optionalText(input.state);
  const status = optionalText(input.status);
  const jobId = optionalText(input.job_id);
  const isPublished = input.is_published ?? true;
  if (
    categoryId === null ||
    state === null ||
    status === null ||
    jobId === null ||
    typeof isPublished !== "boolean"
  ) {
    return null;
  }
  return {
    category_id: categoryId,
    state,
    status: status || "active",
    job_id: jobId,
    is_published: isPublished,
  };
}

function isValidId(value: string): boolean {
  return value === "" || UUID_RE.test(value);
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isWholeNumber(value: string): boolean {
  return /^\d+$/.test(value);
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function firstInvalidFormat(
  fields: FlatFields,
  keys: string[],
  isValid: (value: string) => boolean,
  requirement: string,
): string | null {
  for (const key of keys) {
    const value = (fields[key] ?? "").trim();
    if (value && !isValid(value)) {
      return `${prettyLabel(key)} ${requirement}.`;
    }
  }
  return null;
}

function validateReviewInput(
  targetType: string,
  fields: FlatFields,
  extra: ReviewExtra,
): string | null {
  if (!(fields.title ?? "").trim()) return "Title is required.";

  if (targetType === "job") {
    if (!isValidId(extra.category_id)) {
      return "Category must be a valid job-category record.";
    }
    if (extra.state && !STATE_RE.test(extra.state)) {
      return "State must be a lowercase slug such as bihar or central-services.";
    }
    if (!JOB_STATUSES.has(extra.status)) {
      return "Status must be active, upcoming, or closed.";
    }
    return (
      firstInvalidFormat(
        fields,
        ["notification_date", "application_start", "application_end", "exam_date"],
        isValidDate,
        "must use YYYY-MM-DD format",
      ) ??
      firstInvalidFormat(
        fields,
        ["eligibility_age_min", "eligibility_age_max", "vacancy_total"],
        isWholeNumber,
        "must be a whole number",
      ) ??
      firstInvalidFormat(
        fields,
        ["notification_pdf_link", "official_link"],
        isValidUrl,
        "must be a valid http or https URL",
      )
    );
  }

  if (!isValidId(extra.job_id)) {
    return "Linked job must be a valid job record.";
  }

  if (targetType === "result") {
    return (
      firstInvalidFormat(fields, ["result_date"], isValidDate, "must use YYYY-MM-DD format") ??
      firstInvalidFormat(
        fields,
        ["merit_list_link", "official_link"],
        isValidUrl,
        "must be a valid http or https URL",
      )
    );
  }

  return (
    firstInvalidFormat(
      fields,
      ["release_date", "exam_date"],
      isValidDate,
      "must use YYYY-MM-DD format",
    ) ??
    firstInvalidFormat(
      fields,
      ["download_link", "official_link"],
      isValidUrl,
      "must be a valid http or https URL",
    )
  );
}

export async function approvePendingEntry(
  id: unknown,
  fieldsInput: unknown,
  extraInput: unknown,
): Promise<AdminResult> {
  const { supabase, user } = await requireAdmin();

  const entryId = typeof id === "string" ? id.trim() : "";
  const fields = normalizeFields(fieldsInput);
  const extra = normalizeExtra(extraInput);
  if (!entryId || !UUID_RE.test(entryId) || !fields || !extra) {
    return err("Invalid review submission.");
  }

  const { data: entry, error: fetchError } = await supabase
    .from("pending_entries")
    .select("id, target_type, status, raw_scrape_id")
    .eq("id", entryId)
    .single<PendingRow>();
  if (fetchError || !entry) return err("Review entry not found.");
  if (entry.status !== "pending_review") {
    return err(`Entry is already ${entry.status}; only pending entries can be approved.`);
  }
  if (!isSupportedTarget(entry.target_type)) {
    return err(
      `Auto-approve for "${entry.target_type}" is not wired yet — please add it manually for now.`,
    );
  }
  const validationError = validateReviewInput(entry.target_type, fields, extra);
  if (validationError) return err(validationError);

  let sourceUrl: string | null = null;
  if (entry.raw_scrape_id) {
    const { data: raw } = await supabase
      .from("raw_scrapes")
      .select("source_url")
      .eq("id", entry.raw_scrape_id)
      .single<{ source_url: string }>();
    sourceUrl = raw?.source_url ?? null;
  }

  let res: AdminResult;
  if (entry.target_type === "job") {
    res = await createJob(
      buildJobInput(fields, {
        category_id: extra.category_id,
        state: extra.state,
        status: extra.status,
        is_published: extra.is_published,
        source_url: sourceUrl,
      }),
    );
  } else if (entry.target_type === "result") {
    res = await createResult(
      buildResultInput(fields, {
        job_id: extra.job_id,
        is_published: extra.is_published,
      }),
    );
  } else {
    res = await createAdmitCard(
      buildAdmitCardInput(fields, {
        job_id: extra.job_id,
        is_published: extra.is_published,
      }),
    );
  }
  if (!res.ok) return res;

  const { error: markError } = await supabase
    .from("pending_entries")
    .update({
      status: "approved",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", entryId);
  if (markError) return err(markError.message);

  revalidatePath("/admin/review-queue");
  return { ok: true };
}

export async function rejectPendingEntry(id: string): Promise<AdminResult> {
  const { supabase, user } = await requireAdmin();

  const { data: entry } = await supabase
    .from("pending_entries")
    .select("id, status")
    .eq("id", id)
    .single<{ id: string; status: string }>();
  if (!entry) return err("Review entry not found.");
  if (entry.status !== "pending_review") {
    return err(`Entry is already ${entry.status}.`);
  }

  const { error } = await supabase
    .from("pending_entries")
    .update({
      status: "rejected",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return err(error.message);

  revalidatePath("/admin/review-queue");
  return { ok: true };
}
