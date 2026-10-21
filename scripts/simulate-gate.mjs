/**
 * Phase 8A gate simulation.
 *
 * Answers "what happens to the sitemap, the homepage and the landing pages if
 * we flip NEXT_PUBLIC_VERIFICATION_GATE=on?" WITHOUT touching production data.
 *
 * Nothing is written. Jobs are READ once with the anon key, and every scenario
 * is then computed in memory by re-implementing the gate exactly as
 * src/lib/queries.ts and src/lib/indexable.ts apply it:
 *
 *   - a job is visible only when verification_status = 'verified'
 *   - the homepage lists getLatestJobs(8) -> verified + status=active +
 *     application_end >= today, newest 8
 *   - the closing ticker lists getClosingJobs(6)
 *   - a landing hub is indexable only with >= MIN_VERIFIED_OPEN_JOBS (10)
 *     verified OPEN jobs (active or upcoming)
 *
 * Because this models rather than reuses the code, treat it as a planning aid:
 * the authoritative check is `npm run audit:index` against a real build with the
 * flag set. Run this before you turn the gate on; run that after.
 *
 * Usage: node --experimental-strip-types scripts/simulate-gate.mjs
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const MIN_VERIFIED_OPEN_JOBS = 10;

function loadEnv() {
  const raw = readFileSync(".env.local", "utf8");
  const out = {};
  for (const line of raw.split("\n")) {
    const m = /^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const TODAY = new Date().toISOString().slice(0, 10);

/* ---- landing hub definitions, mirroring src/lib/landingPages.ts ---------- */

const HUBS = [
  { path: "/jobs/10th-pass", key: "qual:10th" },
  { path: "/jobs/12th-pass", key: "qual:12th" },
  { path: "/jobs/iti", key: "qual:iti" },
  { path: "/jobs/diploma", key: "qual:diploma" },
  { path: "/jobs/engineering", key: "qual:engineering" },
  { path: "/jobs/nursing", key: "qual:medical" },
  { path: "/jobs/graduate", key: "qual:graduate" },
  { path: "/jobs/post-graduate", key: "qual:post-graduate" },
  { path: "/jobs/bed", key: "qual:bed" },
  { path: "/jobs/category/ssc", key: "cat:ssc" },
  { path: "/jobs/category/railway", key: "cat:railway" },
  { path: "/jobs/category/banking", key: "cat:banking" },
  { path: "/jobs/category/defence", key: "cat:defence" },
  { path: "/jobs/category/police", key: "cat:police" },
  { path: "/jobs/category/teaching", key: "cat:teaching" },
  { path: "/jobs/category/psu", key: "cat:psu" },
];

// qualification keywords, mirroring qualificationKeywords() in queries.ts
const QUAL = {
  "10th": ["10th", "matric", "class 10"],
  "12th": ["12th", "intermediate", "class 12", "higher secondary"],
  iti: ["iti"],
  diploma: ["diploma", "polytechnic"],
  engineering: ["engineering", "b.e", "b.tech", "b.e.", "b.tech.", "engineering "],
  medical: ["mbbs", "bds", "nursing", "medical", "b.pharm"],
  graduate: ["graduat", "bachelor", "degree", "b.a", "b.sc", "b.com"],
  "post-graduate": ["post grad", "postgrad", "master", "m.a", "m.sc", "m.tech", "mba"],
  bed: ["b.ed", "d.el.ed", "b.ed."],
};

/* ---- read the catalogue once, read-only --------------------------------- */

const { data: jobs, error } = await supabase
  .from("jobs")
  .select("id, slug, title, status, state, category_id, eligibility_education, created_at, application_end")
  .eq("is_published", true);

if (error) {
  console.error("read failed:", error.message);
  process.exit(1);
}
console.log(`read ${jobs.length} published jobs (read-only, nothing written)`);

const { data: categories } = await supabase.from("job_categories").select("id, slug");
const catById = new Map((categories ?? []).map((c) => [c.id, c.slug]));

function matchesHub(job, key) {
  const [kind, value] = key.split(":");
  if (kind === "cat") return catById.get(job.category_id) === value;
  const words = QUAL[value] ?? [];
  const text = `${job.eligibility_education ?? ""} ${job.title ?? ""}`.toLowerCase();
  return words.some((w) => text.includes(w));
}

/* ---- the gate, as the app applies it ------------------------------------ */

const isOpen = (j) => j.status === "active" || j.status === "upcoming";

function runScenario(label, verifiedIds) {
  const verified = new Set(verifiedIds);
  const vis = jobs.filter((j) => verified.has(j.id));

  const sitemapJobs = vis.filter(isOpen);
  const homepage = vis
    .filter((j) => j.status === "active" && j.application_end >= TODAY)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 8);
  const ticker = vis
    .filter((j) => j.status === "active" && j.application_end >= TODAY)
    .sort((a, b) => (a.application_end > b.application_end ? -1 : 1))
    .slice(0, 6);

  console.log("\n" + "=".repeat(72));
  console.log(label);
  console.log("=".repeat(72));
  console.log(`  verified jobs                       ${verifiedIds.length}`);
  console.log(`  job URLs in sitemap                 ${sitemapJobs.length}`);
  console.log(`  homepage "Latest Jobs" table        ${homepage.length} of 8 slots`);
  console.log(`  homepage closing ticker             ${ticker.length} of 6 slots`);

  const homeEmpty = homepage.length === 0;
  console.log(
    `  HOMEPAGE LOOKS EMPTY?               ${homeEmpty ? "YES — PROBLEM" : "no"}`,
  );

  console.log(`\n  ${"landing hub".padEnd(28)} ${"verified open".padStart(12)}  indexable?`);
  console.log("  " + "-".repeat(56));
  let kept = 0, dropped = 0;
  for (const hub of HUBS) {
    const n = vis.filter((j) => isOpen(j) && matchesHub(j, hub.key)).length;
    const ok = n >= MIN_VERIFIED_OPEN_JOBS;
    if (ok) kept++;
    else dropped++;
    console.log(
      `  ${hub.path.padEnd(28)} ${String(n).padStart(12)}  ${ok ? "yes" : "NO -> noindex"}`,
    );
  }
  console.log("  " + "-".repeat(56));
  console.log(
    `  ${"TOTAL".padEnd(28)} ${"".padStart(12)}  ${kept} indexable / ${dropped} noindexed`,
  );
  return { sitemapJobs: sitemapJobs.length, homepage: homepage.length, kept, dropped };
}

/* ---- the two scenarios -------------------------------------------------- */

// Deterministic pick: the open jobs with the furthest-out deadlines, so the
// simulation is reproducible rather than depending on row order.
const openSorted = jobs
  .filter(isOpen)
  .sort((a, b) => (a.application_end < b.application_end ? 1 : -1));

const a = runScenario("(a) GATE ON, 0 verified jobs", []);
const b = runScenario("(b) GATE ON, 25 verified jobs", openSorted.slice(0, 25).map((j) => j.id));

console.log("\n" + "-".repeat(72));
console.log("VERDICT");
console.log("-".repeat(72));
const problems = [];
if (a.homepage === 0) {
  problems.push(
    "(a) with 0 verified the homepage job table is EMPTY — do not flip the gate yet",
  );
}
if (a.kept > 0) {
  problems.push(`(a) ${a.kept} landing hubs would stay indexable with no jobs behind them`);
}
if (b.homepage < 8) {
  console.log(
    `  note: (b) fills ${b.homepage}/8 homepage slots — 25 verified across all hubs rarely fills one homepage`,
  );
}
if (problems.length === 0) {
  console.log("  scenario (a) behaves correctly: everything noindexed, nothing thin indexed.");
} else {
  for (const p of problems) console.log(`  PROBLEM  ${p}`);
}
console.log("");
