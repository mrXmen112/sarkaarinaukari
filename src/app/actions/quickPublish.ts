"use server";

import { revalidatePath } from "next/cache";

import {
  createAdmitCard,
  createAnswerKey,
  createJob,
  createResult,
  type AdminResult,
} from "@/app/actions/admin";
import { requireAdmin } from "@/lib/admin";
import { pingIndexNow, targetUrl } from "@/lib/indexNow";
import { validateOfficialUrl } from "@/lib/linkCheck";
import {
  buildAdmitCardInput,
  buildJobInput,
  buildResultInput,
} from "@/lib/reviewQueue";
import { normaliseJobJsonFields, validateJobJsonFields } from "@/lib/sanity";
import {
  extractQuickDraft,
  isQuickKind,
  type QuickDraft,
  type QuickKind,
} from "@/lib/quickPublish";
import { isTelegramAutoPostEnabled, postJobToTelegram } from "@/lib/telegram";
import { slugify } from "@/lib/utils";

/**
 * Phase 7D — Quick Publish server actions.
 *
 * Two steps: extract (read-only, produces an editable draft) and publish
 * (validates the main official link FIRST, then inserts, links into the job's
 * Recruitment Timeline, pings IndexNow and — for jobs — posts to Telegram).
 * Publishing is blocked outright if the official link is provably dead, and a
 * new row is always written unverified.
 */

export type ExtractResult =
  | { ok: true; draft: QuickDraft }
  | { ok: false; error: string };

export async function extractQuickDraftAction(
  kind: string,
  url: string,
): Promise<ExtractResult> {
  await requireAdmin();
  const cleanUrl = (url ?? "").trim();
  if (!/^https?:\/\//i.test(cleanUrl)) {
    return { ok: false, error: "Paste a full http(s) URL of the official page or PDF." };
  }
  if (!isQuickKind(kind)) {
    return { ok: false, error: "Choose what you are publishing." };
  }
  try {
    const draft = await extractQuickDraft(kind, cleanUrl);
    return { ok: true, draft };
  } catch (error) {
    return { ok: false, error: (error as Error)?.message ?? "Extraction failed." };
  }
}

/** Client-side gate: check the pasted official link before enabling Publish. */
export async function validateOfficialLinkAction(
  url: string,
): Promise<{ ok: boolean; reason: string }> {
  await requireAdmin();
  const clean = (url ?? "").trim();
  if (!/^https?:\/\//i.test(clean)) return { ok: false, reason: "not an http(s) URL" };
  const result = await validateOfficialUrl(clean);
  return { ok: result.ok, reason: result.reason };
}

export type QuickPublishInput = {
  kind: QuickKind;
  officialLink: string;
  /** Optional link target: the job this admit card / result / answer key belongs to. */
  jobId: string;
  fields: Record<string, string>;
  isPublished: boolean;
};

export async function publishQuick(input: QuickPublishInput): Promise<AdminResult> {
  await requireAdmin();

  const officialLink = (input.officialLink ?? "").trim();
  if (!/^https?:\/\//i.test(officialLink)) {
    return { ok: false, error: "An official http(s) link is required." };
  }
  const title = (input.fields?.title ?? "").trim();
  if (!title) return { ok: false, error: "Title is required." };

  // GATE: never publish until the main official link passes validation.
  const check = await validateOfficialUrl(officialLink);
  if (!check.ok) {
    return {
      ok: false,
      error: `Official link did not validate (${check.reason}) — publishing is blocked.`,
    };
  }

  const slug = slugify(title);
  const isPublished = Boolean(input.isPublished);

  if (input.kind === "job") {
    const fields: Record<string, string> = {
      ...normaliseJobJsonFields(input.fields),
      official_link: officialLink,
    };
    const jsonError = validateJobJsonFields(fields);
    if (jsonError) return { ok: false, error: jsonError };

    const jobInput = buildJobInput(fields, {
      category_id: "",
      state: (fields.state ?? "").trim(),
      status: "active",
      is_published: isPublished,
      source_url: officialLink,
    });
    jobInput.official_link = officialLink;

    const res = await createJob(jobInput);
    if (!res.ok) return res;

    if (isPublished) {
      try {
        if (await isTelegramAutoPostEnabled()) {
          await postJobToTelegram({
            title,
            slug,
            application_end: jobInput.application_end,
            vacancy_total: Number(jobInput.vacancy_total) || null,
          });
        }
      } catch (error) {
        console.error("[quick-publish] telegram failed:", error);
      }
    }
    revalidatePath("/admin/quick-publish");
    return { ok: true };
  }

  if (input.kind === "answer-key") {
    const res = await createAnswerKey({
      job_id: input.jobId || "",
      title,
      description: (input.fields.description ?? "").trim(),
      is_published: isPublished,
      type: (input.fields.type ?? "").trim() === "final" ? "final" : "provisional",
      release_date: (input.fields.release_date ?? "").trim(),
      objection_last_date: (input.fields.objection_last_date ?? "").trim(),
      download_link: (input.fields.download_link ?? "").trim(),
      official_link: officialLink,
    });
    if (!res.ok) return res;
    await pingPublished(`/answer-key/${slug}`, isPublished);
    revalidatePath("/admin/quick-publish");
    return { ok: true };
  }

  if (input.kind === "result") {
    const resultInput = buildResultInput(
      { ...input.fields, official_link: officialLink },
      { job_id: input.jobId || "", is_published: isPublished },
    );
    const res = await createResult(resultInput);
    if (!res.ok) return res;
    await pingPublished(targetUrl("result", slug), isPublished);
    revalidatePath("/admin/quick-publish");
    return { ok: true };
  }

  // admit-card
  const admitInput = buildAdmitCardInput(
    { ...input.fields, official_link: officialLink },
    { job_id: input.jobId || "", is_published: isPublished },
  );
  const res = await createAdmitCard(admitInput);
  if (!res.ok) return res;
  await pingPublished(targetUrl("admit_card", slug), isPublished);
  revalidatePath("/admin/quick-publish");
  return { ok: true };
}

/** IndexNow ping for a published detail URL; never blocks the publish. */
async function pingPublished(path: string | null, isPublished: boolean): Promise<void> {
  if (!isPublished || !path) return;
  try {
    const result = await pingIndexNow([path]);
    if (!result.ok) console.error("[quick-publish] indexnow failed:", result.error);
  } catch (error) {
    console.error("[quick-publish] indexnow threw:", error);
  }
}
