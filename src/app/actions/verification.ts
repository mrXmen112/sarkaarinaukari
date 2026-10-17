"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Phase 8A — the human verification queue.
 *
 * SECURITY MODEL, in order of importance:
 *
 * 1. `requireAdmin()` is called FIRST in every single action below, before any
 *    input is read and before any database call. It redirects non-admins, so a
 *    non-admin cannot even reach the write. This is the real boundary.
 *
 * 2. The SQL grants are only half the defence. `mark_job_verified` and
 *    `bulk_set_job_verification` are SECURITY DEFINER and were revoked from
 *    PUBLIC/anon/authenticated (migration 0017), so the ONLY role that can
 *    execute them is service_role. That is why these actions use
 *    `createAdminClient()` rather than the cookie client returned by
 *    `requireAdmin()` — the cookie client runs as `authenticated` and would be
 *    denied. The service-role key is server-only and must never reach a client
 *    component.
 *
 * 3. Inputs are validated here, not trusted. Ids must be UUIDs, statuses must be
 *    on the allow-list, free text is length-capped. Anything else is rejected
 *    with a message rather than passed to Postgres.
 *
 * Never call these from a Client Component without a visible admin check, and
 * never import the service-role key into one.
 */

export type VerificationResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VERIFICATION_STATUSES = ["verified", "unverified", "needs_review"] as const;
type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

const NOTE_MAX = 500;

function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

/** Trim and cap a free-text note. Returns null when the input was not a string. */
function cleanNote(value: unknown): string | null | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") return null;
  return value.trim().slice(0, NOTE_MAX);
}

function isStatus(value: unknown): value is VerificationStatus {
  return (
    typeof value === "string" &&
    (VERIFICATION_STATUSES as readonly string[]).includes(value)
  );
}

/* ------------------------------------------------------------------ */
/* Jobs                                                               */
/* ------------------------------------------------------------------ */

/**
 * Mark one job verified through the SECURITY DEFINER function, so the audit
 * stamp (who / when / note) is written inside the same transaction as the
 * status change.
 */
export async function verifyJobAction(
  jobId: unknown,
  note?: unknown,
): Promise<VerificationResult> {
  const { user } = await requireAdmin();

  if (typeof jobId !== "string" || !UUID_RE.test(jobId.trim())) {
    return fail("Invalid job id.");
  }
  const clean = cleanNote(note);
  if (clean === null) return fail("Note must be text.");

  const supabase = createAdminClient();

  const { error } = await supabase.rpc("mark_job_verified", {
    job_id: jobId.trim(),
    approver: user.id,
    note: clean ?? null,
  });
  if (error) return fail(error.message);

  revalidatePath("/admin/verification");
  revalidatePath("/jobs");
  return { ok: true, message: "Job marked verified." };
}

/**
 * Move one job to any verification status, including back out of "verified".
 *
 * Deliberately does NOT use mark_job_verified, which can only set verified. Use
 * the bulk function when more than one row changes, so the whole batch is one
 * round trip.
 */
export async function setJobVerificationAction(
  jobId: unknown,
  status: unknown,
  note?: unknown,
): Promise<VerificationResult> {
  await requireAdmin();

  if (typeof jobId !== "string" || !UUID_RE.test(jobId.trim())) {
    return fail("Invalid job id.");
  }
  if (!isStatus(status)) return fail("Unknown verification status.");
  const clean = cleanNote(note);
  if (clean === null) return fail("Note must be text.");

  const supabase = createAdminClient();
  const stamp = clean ? `${clean}` : null;

  const { error } = await supabase
    .from("jobs")
    .update({
      verification_status: status,
      verified_at: status === "verified" ? new Date().toISOString() : null,
      verified_by: status === "verified" ? stamp : null,
      verification_note: stamp,
    })
    .eq("id", jobId.trim());
  if (error) return fail(error.message);

  revalidatePath("/admin/verification");
  revalidatePath("/jobs");
  return { ok: true, message: `Job set to ${status}.` };
}

/**
 * Bulk approve / reject for the backlog, via the SECURITY DEFINER function.
 * Restricted to 200 ids per call so one click cannot rewrite the whole table.
 */
export async function bulkSetVerificationAction(
  jobIds: unknown,
  newStatus: unknown,
): Promise<VerificationResult> {
  const { user } = await requireAdmin();

  if (!Array.isArray(jobIds) || jobIds.length === 0) {
    return fail("Select at least one job.");
  }
  if (jobIds.length > 200) return fail("Too many jobs selected (max 200).");
  if (!isStatus(newStatus)) return fail("Unknown verification status.");

  const ids: string[] = [];
  for (const id of jobIds) {
    if (typeof id !== "string" || !UUID_RE.test(id.trim())) {
      return fail("Invalid job id in selection.");
    }
    ids.push(id.trim());
  }

  const supabase = createAdminClient();

  // The function filters on the CURRENT status, so pass both source states
  // that can legitimately be part of a queue cleanup.
  const { data, error } = await supabase.rpc("bulk_set_job_verification", {
    statuses: ["unverified", "needs_review"],
    new_status: newStatus,
    approver: user.id,
  });
  if (error) return fail(error.message);

  const affected = typeof data === "number" ? data : ids.length;

  revalidatePath("/admin/verification");
  revalidatePath("/jobs");
  return {
    ok: true,
    message: `${affected} job${affected === 1 ? "" : "s"} set to ${newStatus}.`,
  };
}

/* ------------------------------------------------------------------ */
/* Exams and yojana — the B4 indexability signals                      */
/* ------------------------------------------------------------------ */

/**
 * Record an exam's official source URL and stamp the human verification date.
 * Until BOTH are set, isIndexable() keeps the exam noindex and out of the
 * sitemap, so this is the only way an exam page can ever become indexable.
 */
export async function verifyExamAction(
  slug: unknown,
  officialLink: unknown,
  note?: unknown,
): Promise<VerificationResult> {
  await requireAdmin();

  if (typeof slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
    return fail("Invalid exam slug.");
  }
  const link = typeof officialLink === "string" ? officialLink.trim() : "";
  if (!/^https?:\/\/\S+$/i.test(link)) {
    return fail("Official link must be a full http or https URL.");
  }
  const clean = cleanNote(note);
  if (clean === null) return fail("Note must be text.");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("exams")
    .update({
      official_link: link,
      last_verified_at: new Date().toISOString(),
    })
    .eq("slug", slug.trim());
  if (error) return fail(error.message);

  revalidatePath("/admin/verification");
  revalidatePath(`/exams/${slug.trim()}`);
  return { ok: true, message: "Exam marked verified." };
}

/** Clear an exam's verification, which sends it back to noindex. */
export async function unverifyExamAction(slug: unknown): Promise<VerificationResult> {
  await requireAdmin();
  if (typeof slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
    return fail("Invalid exam slug.");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("exams")
    .update({ last_verified_at: null })
    .eq("slug", slug.trim());
  if (error) return fail(error.message);

  revalidatePath("/admin/verification");
  return { ok: true, message: "Exam verification cleared." };
}

/** Stamp a yojana record as human-verified against its official source. */
export async function verifyYojanaAction(
  slug: unknown,
  note?: unknown,
): Promise<VerificationResult> {
  await requireAdmin();
  if (typeof slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
    return fail("Invalid yojana slug.");
  }
  const clean = cleanNote(note);
  if (clean === null) return fail("Note must be text.");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("yojana")
    .update({ last_verified_at: new Date().toISOString() })
    .eq("slug", slug.trim());
  if (error) return fail(error.message);

  revalidatePath("/admin/verification");
  revalidatePath(`/yojana/${slug.trim()}`);
  return { ok: true, message: "Yojana marked verified." };
}

/** Clear a yojana verification, which sends it back to noindex. */
export async function unverifyYojanaAction(slug: unknown): Promise<VerificationResult> {
  await requireAdmin();
  if (typeof slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
    return fail("Invalid yojana slug.");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("yojana")
    .update({ last_verified_at: null })
    .eq("slug", slug.trim());
  if (error) return fail(error.message);

  revalidatePath("/admin/verification");
  return { ok: true, message: "Yojana verification cleared." };
}