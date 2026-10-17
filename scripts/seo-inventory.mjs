/**
 * B4.4 — per-template indexability inventory.
 *
 * Reports, for every URL the site can produce: how many exist, how many are
 * indexable, and how many are noindexed — grouped by template.
 *
 * This deliberately measures the RENDERED page (the robots meta tag actually
 * emitted) rather than re-implementing the rule in the script. The whole point
 * of src/lib/indexable.ts is that one function decides both the robots tag and
 * sitemap membership; if this script duplicated that logic it would test a copy,
 * not the site. So it reads what the site really serves and cross-checks that
 * noindexed pages are genuinely absent from the sitemap.
 *
 * Usage:
 *   npm run build && npm start -- -p 3100
 *   BASE_URL=http://localhost:3100 node scripts/seo-inventory.mjs
 *
 * Options:
 *   --limit=N   max URLs to inspect (default: all)
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = (process.env.BASE_URL || "http://localhost:3100").replace(/\/$/, "");
const args = process.argv.slice(2);
const LIMIT = Number((args.find((a) => a.startsWith("--limit=")) || "").split("=")[1] || 0);

const UA = "sarkaarinaukari-seo-inventory/1.0";

/**
 * Collapse a pathname to its template.
 * "/exams/rrb-alp"            -> "/exams/[slug]"
 * "/previous-papers/gate-2026"-> "/previous-papers/[exam]"
 * "/"                          -> "/"
 */
function templateOf(pathname) {
  const clean = pathname.replace(/\/+$/, "") || "/";
  if (clean === "/") return "/";
  const parts = clean.split("/").filter(Boolean);
  const known = new Set([
    "jobs", "exams", "yojana", "syllabus", "result", "admit-card", "answer-key",
    "previous-papers", "quiz", "current-affairs", "bihar", "blogs",
  ]);
  if (!known.has(parts[0])) return clean;
  return `/${parts[0]}` + (parts.length > 1 ? "/[param]" : "");
}

function robotsOf(html) {
  const m = /<meta[^>]+name="robots"[^>]*>/i.exec(html);
  return m ? m[0] : null;
}

function isNoindex(html) {
  const tag = robotsOf(html);
  if (!tag) return false; // no robots meta = index,follow
  return /noindex/i.test(tag);
}

/**
 * Sitemaps and canonicals use absolute production URLs. Everything this script
 * fetches must be re-pointed at BASE, or it silently audits the live site
 * instead of the build under test. Applied to BOTH the child sitemap URLs and
 * the <loc> values inside them.
 */
function localise(u) {
  const url = new URL(u);
  return url.origin === BASE ? u : BASE + url.pathname + url.search;
}

async function sitemapUrls() {
  const index = await (await fetch(`${BASE}/sitemap.xml`, { headers: { "user-agent": UA } })).text();
  const locs = [...index.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
  const children = locs.filter((l) => l.endsWith(".xml"));
  if (!children.length) return locs.map(localise);
  const out = [];
  for (const child of children) {
    const xml = await (await fetch(localise(child), { headers: { "user-agent": UA } })).text();
    for (const m of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) out.push(localise(m[1]));
  }
  return out;
}

const sitemap = await sitemapUrls();
console.log(`sitemap lists ${sitemap.length} URLs`);
const sitemapPaths = new Set(sitemap.map((u) => new URL(u).pathname));

const toCheck = LIMIT > 0 ? sitemap.slice(0, LIMIT) : sitemap;

/**
 * Rows grouped by template: { total, indexable, noindexed, noindexInSitemap[] }.
 */
const byTemplate = new Map();

function bucket(template) {
  if (!byTemplate.has(template)) {
    byTemplate.set(template, { total: 0, indexable: 0, noindexed: 0, noindexInSitemap: [] });
  }
  return byTemplate.get(template);
}

for (const url of toCheck) {
  const pathname = new URL(url).pathname;
  const tpl = templateOf(pathname);
  const row = bucket(tpl);
  row.total += 1;

  let noindex = false;
  try {
    const html = await (await fetch(url, { headers: { "user-agent": UA } })).text();
    noindex = isNoindex(html);
  } catch {
    // Treat an unreachable page as noindex so it is not silently counted good.
    noindex = true;
  }

  if (noindex) {
    row.noindexed += 1;
    // This is the bug the whole gate exists to prevent.
    if (sitemapPaths.has(pathname)) row.noindexInSitemap.push(pathname);
  } else {
    row.indexable += 1;
  }
}

// Pages that exist but are NOT in the sitemap at all (e.g. noindexed previous-papers
// are excluded from it) still need counting, so walk the known hubs.
const HUBS = ["/exams", "/yojana", "/jobs"];

const templates = [...byTemplate.entries()]
  .sort((a, b) => b[1].total - a[1].total);

const width = Math.max(...templates.map(([t]) => t.length), 20);

console.log("\n=== per-template indexability inventory ===");
console.log(
  `${"template".padEnd(width)}  ${"total".padStart(6)}  ${"indexable".padStart(9)}  ${"noindexed".padStart(9)}`,
);
console.log("-".repeat(width + 30));
let tTotal = 0, tIndex = 0, tNo = 0, contradictions = 0;
for (const [tpl, row] of templates) {
  console.log(
    `${tpl.padEnd(width)}  ${String(row.total).padStart(6)}  ${String(row.indexable).padStart(9)}  ${String(row.noindexed).padStart(9)}`,
  );
  tTotal += row.total;
  tIndex += row.indexable;
  tNo += row.noindexed;
  contradictions += row.noindexInSitemap.length;
}
console.log("-".repeat(width + 30));
console.log(
  `${"TOTAL".padEnd(width)}  ${String(tTotal).padStart(6)}  ${String(tIndex).padStart(9)}  ${String(tNo).padStart(9)}`,
);

console.log(`\nseeds checked: ${HUBS.length} hub pages`);

if (contradictions > 0) {
  console.log(`\nCONTRADICTIONS (noindexed but present in sitemap): ${contradictions}`);
  for (const [, row] of byTemplate) {
    for (const p of row.noindexInSitemap) console.log(`  ${p}`);
  }
} else {
  console.log("\nno contradictions: no noindexed page appears in any sitemap");
}

// Pages that exist but are NOT in the sitemap. B4 deliberately removes noindexed
// pages from the sitemap, so a sitemap-only crawl would report them as simply
// absent and the inventory would look far healthier than the site is. These hub
// pages are crawled to find them, which is what makes the "noindexed" column
// mean anything.
const HUBS_FOR_UNSITEMAPPED = ["/exams", "/yojana", "/jobs"];

console.log("crawling hubs for detail pages that left the sitemap...");
const unsitemapped = new Map();

for (const hub of HUBS_FOR_UNSITEMAPPED) {
  let html;
  try {
    html = await (await fetch(localise(BASE + hub), { headers: { "user-agent": UA } })).text();
  } catch {
    continue;
  }
  const prefix = hub === "/jobs" ? "/jobs/" : hub + "/";
  const detail = new Set();
  for (const m of html.matchAll(/href="([^"]+)"/g)) {
    const href = m[1];
    if (!href.startsWith(prefix)) continue;
    const rest = href.slice(prefix.length);
    if (!rest || rest.includes("/")) continue; // detail only, no nested
    detail.add(href);
  }
  for (const path of detail) {
    const full = localise(BASE + path);
    if (sitemapPaths.has(new URL(full).pathname)) continue;
    let noindex = true;
    try {
      noindex = isNoindex(await (await fetch(full, { headers: { "user-agent": UA } })).text());
    } catch {
      noindex = true;
    }
    const tpl = templateOf(new URL(full).pathname);
    if (!unsitemapped.has(tpl)) unsitemapped.set(tpl, { indexable: 0, noindexed: 0 });
    const u = unsitemapped.get(tpl);
    if (noindex) u.noindexed += 1;
    else u.indexable += 1;
  }
}

const unsitemapRows = [...unsitemapped.entries()].sort((a, b) => b[1].noindexed - a[1].noindexed);
if (unsitemapRows.length) {
  console.log("\n=== pages NOT in the sitemap ===");
  console.log(`${"template".padEnd(width)}  ${"indexable".padStart(9)}  ${"noindexed".padStart(9)}`);
  console.log("-".repeat(width + 24));
  let uTot = 0, uNo = 0;
  for (const [tpl, r] of unsitemapRows) {
    console.log(`${tpl.padEnd(width)}  ${String(r.indexable).padStart(9)}  ${String(r.noindexed).padStart(9)}`);
    uTot += r.indexable + r.noindexed;
    uNo += r.noindexed;
  }
  console.log("-".repeat(width + 24));
  console.log(`${"TOTAL".padEnd(width)}  ${String(uTot - uNo).padStart(9)}  ${String(uNo).padStart(9)}`);
}

const report = {
  base: BASE,
  generatedAt: new Date().toISOString(),
  sitemapUrls: sitemap.length,
  inspected: toCheck.length,
  totals: { total: tTotal, indexable: tIndex, noindexed: tNo },
  contradictions,
  notInSitemap: Object.fromEntries(
    [...unsitemapped.entries()].map(([t, r]) => [t, { ...r }]),
  ),
  templates: Object.fromEntries(
    [...byTemplate.entries()].map(([t, r]) => [
      t,
      {
        total: r.total,
        indexable: r.indexable,
        noindexed: r.noindexed,
        noindexInSitemap: r.noindexInSitemap,
      },
    ]),
  ),
};

const outDir = path.resolve("reports");
await mkdir(outDir, { recursive: true });
const outFile = path.join(outDir, "seo-inventory.json");
await writeFile(outFile, JSON.stringify(report, null, 2));
console.log(`written to ${outFile}`);

process.exitCode = contradictions > 0 ? 1 : 0;