import type { NextRequest } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const runProcess = promisify(execFile);

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
  const params = new URL(req.url).searchParams;
  const onlyFlagged = params.get("only_flagged") === "true";

  // Bounded batch. The audit's verified-apply sweep uses ?limit=25 and calls
  // this until every row has been seen; 50 is the hard ceiling so one request
  // cannot exceed the function duration limit.
  const requestedLimit = Number(params.get("limit"));
  const limit =
    Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(Math.floor(requestedLimit), 50)
      : 20;
  const verifyApply = params.get("verify_apply") !== "0";

  let linkCheck = null;
  try {
    linkCheck = await runLinkCheck({ limit, onlyFlagged, verifyApply });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    linkCheck = { error: message };
  }

  // Official recruitment-calendar sync (UPSC and future calendars).
  let calendarSync = null;
  try {
    const script = path.join(process.cwd(), "scripts", "scraper", "sync-calendars.mjs");
    const { stdout } = await runProcess(process.execPath, [script], {
      cwd: process.cwd(),
      timeout: 20_000,
      maxBuffer: 1024 * 1024,
      env: process.env,
    });
    calendarSync = stdout.trim().slice(-800);
  } catch (error) {
    calendarSync = `failed: ${error instanceof Error ? error.message.slice(0, 200) : String(error)}`;
  }

  // Bounded scheme sync, consolidated here so the hosting plan only needs
  // two scheduled jobs.
  let schemeSync = null;
  try {
    const script = path.join(process.cwd(), "scripts", "scraper", "myscheme-sync.mjs");
    const { stdout } = await runProcess(process.execPath, [script, "--limit=50"], {
      cwd: process.cwd(),
      timeout: 20_000,
      maxBuffer: 1024 * 1024,
      env: process.env,
    });
    schemeSync = stdout.trim().slice(-800);
  } catch (error) {
    schemeSync = `failed: ${error instanceof Error ? error.message.slice(0, 200) : String(error)}`;
  }

  return Response.json({
    ok: true,
    calendarSync,
    schemeSync,
    jobStatusesRefreshed: !refreshError,
    refreshError: refreshError?.message ?? null,
    linkCheck,
  });
}
