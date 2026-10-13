"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin";
import { setTelegramAutoPost } from "@/lib/telegram";
import { runLinkCheck } from "@/lib/linkCheck";
import type { AdminResult } from "@/app/actions/admin";

/** Toggle a scrape source on/off (staging rotation). */
export async function toggleSourceActive(
  id: string,
  isActive: boolean,
): Promise<AdminResult> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("scrape_sources")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/sources");
  return { ok: true };
}

/** Trusted-source switch (reserved for later auto-publish tooling). */
export async function toggleSourceAutoPublish(
  id: string,
  autoPublish: boolean,
): Promise<AdminResult> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("scrape_sources")
    .update({ auto_publish: autoPublish })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/sources");
  return { ok: true };
}

/** Telegram auto-post toggle for approved jobs. */
export async function toggleTelegramAutoPost(enabled: boolean): Promise<AdminResult> {
  await requireAdmin();
  const res = await setTelegramAutoPost(enabled);
  if (!res.ok) return { ok: false, error: res.error ?? "Failed to save setting" };
  revalidatePath("/admin");
  revalidatePath("/admin/review-queue");
  return { ok: true };
}

/** Manual link-check run (same bounded batch the cron uses). */
export async function runLinkCheckNow(): Promise<AdminResult & { flagged?: number }> {
  await requireAdmin();
  try {
    const report = await runLinkCheck({ limit: 25 });
    revalidatePath("/admin/link-report");
    return { ok: true, flagged: report.flagged.length };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
