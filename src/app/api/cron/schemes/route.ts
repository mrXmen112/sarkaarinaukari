import type { NextRequest } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

export const runtime = "nodejs";
export const maxDuration = 60;

const run = promisify(execFile);

function authorize(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorize(req)) return new Response("Unauthorized", { status: 401 });

  try {
    const script = path.join(process.cwd(), "scripts", "scraper", "myscheme-sync.mjs");
    const { stdout, stderr } = await run(process.execPath, [script, "--limit=100"], {
      cwd: process.cwd(),
      timeout: 55_000,
      maxBuffer: 2 * 1024 * 1024,
      env: process.env,
    });
    return Response.json({ ok: true, output: stdout.trim().slice(-2000), stderr: stderr.trim().slice(-1000) });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message.slice(0, 1000) : String(error) },
      { status: 500 },
    );
  }
}
