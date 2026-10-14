#!/usr/bin/env node
/**
 * Phase 8A — read-only inventory of the jobs table.
 *
 * Answers the questions Phase 8 hinges on, using real numbers only:
 *   - how many jobs exist, and how they split by status / published / state
 *   - how many carry a source_url and how many links the validator flagged
 *   - whether the ~95 bulk-seeded rows really share one timestamp
 *   - how many have the fields a job page needs before it can be indexed
 *
 * This script NEVER writes. It only reads, via the service-role key from
 * .env.local (server-side only, never exposed to client code).
 *
 * Usage: node scripts/db-inventory.mjs
 */
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
const URL_BASE = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY ?? "";
if (!URL_BASE || !KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const db = createClient(URL_BASE, KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const COLS =
  "id,title,slug,state,department,department_slug,vacancy_total,application_end," +
  "official_link,source_url,status,is_published,created_at,updated_at," +
  "link_flagged,link_http_status,link_last_checked_at";

const { data: jobs, error } = await db
  .from("jobs")
  .select(COLS)
  .order("created_at", { ascending: true });

if (error) {
  console.error("query failed:", error.message);
  process.exit(1);
}

const all = jobs ?? [];
console.log(`TOTAL JOBS: ${all.length}\n`);

const count = (pred) => all.filter(pred).length;

console.log("--- status ---");
for (const s of ["active", "closed", "upcoming"]) {
  console.log(`  ${s.padEnd(10)} ${count((j) => j.status === s)}`);
}

console.log("\n--- published ---");
console.log(`  published   ${count((j) => j.is_published)}`);
console.log(`  unpublished ${count((j) => !j.is_published)}`);

console.log("\n--- provenance / links ---");
console.log(`  has source_url        ${count((j) => !!j.source_url)}`);
console.log(`  no source_url         ${count((j) => !j.source_url)}`);
console.log(`  has official_link     ${count((j) => !!j.official_link)}`);
console.log(`  link_flagged (dead)   ${count((j) => j.link_flagged)}`);
console.log(`  never link-checked    ${count((j) => !j.link_last_checked_at)}`);

console.log("\n--- indexing completeness ---");
const hasCore = (j) => !!(j.title && j.department && j.application_end);
const hasVerifiedLink = (j) =>
  !!((j.official_link && !j.link_flagged) || (j.source_url && !j.link_flagged));
console.log(`  has title+dept+lastdate        ${count(hasCore)}`);
console.log(`  + unflagged official/apply url ${count((j) => hasCore(j) && hasVerifiedLink(j))}`);

console.log("\n--- created_at clustering (bulk-seed detector) ---");
const byCreated = new Map();
for (const j of all) {
  const k = (j.created_at ?? "").slice(0, 19);
  byCreated.set(k, (byCreated.get(k) ?? 0) + 1);
}
const clusters = [...byCreated.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
for (const [ts, n] of clusters) console.log(`  ${n.toString().padStart(4)}  ${ts}`);
const biggest = clusters[0]?.[1] ?? 0;
console.log(`  -> largest single-second cluster: ${biggest} job(s)`);

console.log("\n--- by state ---");
const byState = new Map();
for (const j of all) {
  const k = j.state ?? "(null = central)";
  byState.set(k, (byState.get(k) ?? 0) + 1);
}
for (const [k, n] of [...byState.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(4)}  ${k}`);
}

console.log("\n--- sources / pipeline ---");
const { data: srcs } = await db
  .from("scrape_sources")
  .select("id,name,is_active,auto_publish,last_success_at");
console.log(`  scrape_sources rows: ${(srcs ?? []).length}`);
console.log(`  active:              ${(srcs ?? []).filter((s) => s.is_active).length}`);
console.log(`  auto_publish:        ${(srcs ?? []).filter((s) => s.auto_publish).length}`);

const { data: pending } = await db
  .from("pending_entries")
  .select("id,status")
  .limit(1000);
console.log(`  pending_entries:     ${(pending ?? []).length}`);
