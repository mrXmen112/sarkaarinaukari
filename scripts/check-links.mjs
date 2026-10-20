#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const out = {};
  try {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const raw = fs.readFileSync(path.join(here, "..", ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const i = line.indexOf("=");
      if (i > 0 && !line.trimStart().startsWith("#")) {
        out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
      }
    }
  } catch {
    /* fall back to process.env */
  }
  return out;
}

const env = loadEnvLocal();
const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY ?? "";
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const UA = "SarkaariNaukriBot/1.0 (+https://www.sarkaarinaukri.online/contact; link-check)";
const TIMEOUT_MS = 10000;
const DEAD = new Set([404, 410]);
const BLOCKED = new Set([401, 403, 405, 429, 501, 503]);

async function request(target, method) {
  const response = await fetch(target, {
    method,
    redirect: "follow",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8",
      ...(method === "GET" ? { Range: "bytes=0-1024" } : {}),
    },
  });
  return {
    status: response.status,
    ok: response.status < 400,
    dead: DEAD.has(response.status),
    blocked: BLOCKED.has(response.status),
    finalUrl: response.url,
    contentType: response.headers.get("content-type"),
  };
}

async function check(target) {
  try {
    let result = await request(target, "HEAD");
    if (result.status === 404 || result.status === 405 || result.status === 501 || result.status === 403) {
      const getResult = await request(target, "GET");
      if (getResult.status !== 404 || !result.dead) result = getResult;
    }
    return { url: target, ...result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "network error";
    return {
      url: target,
      status: null,
      ok: false,
      dead: /ENOTFOUND|EAI_AGAIN|getaddrinfo/i.test(message),
      blocked: false,
      finalUrl: null,
      contentType: null,
      error: message,
    };
  }
}

async function pooled(items, worker, concurrency = 8) {
  const out = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const index = next++;
      out[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
  return out;
}

const { data, error } = await db
  .from("jobs")
  .select("id,slug,official_link,official_apply_url,official_notification_url,notification_pdf_link,apply_link_verified")
  .eq("is_published", true)
  .eq("type", "job")
  .order("slug");

if (error) {
  console.error("query failed:", error.message);
  process.exit(1);
}

const rows = data ?? [];
const targets = [];
for (const row of rows) {
  for (const value of [row.official_link, row.official_apply_url, row.official_notification_url, row.notification_pdf_link]) {
    if (value && /^https?:\/\//i.test(value)) targets.push(value);
  }
}
const uniqueTargets = [...new Set(targets)];
const results = await pooled(uniqueTargets, check, 8);
const byUrl = new Map(results.map((result) => [result.url, result]));

const updates = rows.map((row) => {
  const urlResults = [row.official_link, row.official_apply_url, row.official_notification_url, row.notification_pdf_link]
    .filter(Boolean)
    .map((value) => byUrl.get(value))
    .filter(Boolean);
  const dead = urlResults.filter((result) => result.dead);
  const first = byUrl.get(row.official_link);
  const apply = byUrl.get(row.official_apply_url);
  return {
    id: row.id,
    slug: row.slug,
    official_link: row.official_link,
    official_apply_url: row.official_apply_url,
    status: first?.status ?? apply?.status ?? null,
    dead: dead.map((result) => ({ url: result.url, status: result.status, error: result.error ?? null })),
    apply_ok: apply ? apply.ok : null,
    apply_link_verified: row.apply_link_verified,
  };
});

for (const update of updates) {
  const patch = {
    link_http_status: update.status,
    link_last_checked_at: new Date().toISOString(),
    link_flagged: update.dead.length > 0,
  };
  if (update.dead.some((entry) => entry.url === update.official_apply_url)) {
    patch.apply_link_verified = false;
  }
  const { error: updateError } = await db.from("jobs").update(patch).eq("id", update.id);
  if (updateError) console.error(`update failed ${update.slug}: ${updateError.message}`);
}

const dead = updates.filter((update) => update.dead.length > 0);
const checked = results.length;
const ok = results.filter((result) => result.ok).length;
const unverified = results.filter((result) => !result.ok && !result.dead).length;
const report = {
  generatedAt: new Date().toISOString(),
  jobs: rows.length,
  urls: checked,
  ok,
  unverified,
  dead: dead.length,
  deadRows: dead,
  results,
};
const here = path.dirname(fileURLToPath(import.meta.url));
const outFile = path.join(here, "..", "reports", "link-check.json");
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(`Checked ${checked} unique URL(s) across ${rows.length} published jobs.`);
console.log(`OK: ${ok}  Unverified/blocked: ${unverified}  Provably dead: ${dead.length}`);
for (const update of dead) {
  console.log(`DEAD ${update.slug}: ${update.dead.map((entry) => `${entry.status ?? entry.error} ${entry.url}`).join(", ")}`);
}
console.log(`Wrote ${path.relative(process.cwd(), outFile)}`);
