import type { NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/server";
import { runLinkCheck } from "@/lib/linkCheck";

/**
 * Maintenance cron (Phase 1), runs once a day on Vercel:
 *   1) refresh_job_statuses() — flip past-deadline jobs to "closed" (kept, never deleted)
 *   2) a bounded batch of HTTP link validation on published job links
 *
 * Protected by CRON_SECRET (Authorization: Bearer ...) on Vercel Cron calls.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

function authorize(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorize(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createAdminClient();

  const { error: refreshError } = await supabase.rpc("refresh_job_statuses");

  // ?only_flagged=true re-checks currently flagged jobs (e.g. after a checker
  // improvement or a suspected false positive batch). Default sweeps oldest.
  const onlyFlagged =
    new URL(req.url).searchParams.get("only_flagged") === "true";

  let linkCheck = null;
  try {
    linkCheck = await runLinkCheck({ limit: 20, onlyFlagged });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    linkCheck = { error: message };
  }

  return Response.json({
    ok: true,
    jobStatusesRefreshed: !refreshError,
    refreshError: refreshError?.message ?? null,
    linkCheck,
  });
}
