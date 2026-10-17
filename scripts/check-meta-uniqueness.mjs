/**
 * W5.3 — fail the build when two indexable pages share a title or a description.
 *
 * Duplicate <title>s and meta descriptions make Google pick one URL and drop the
 * rest ("duplicate, Google chose a different canonical"), which is exactly the
 * outcome B2/B4 spent a whole phase removing. This script is the guard so it
 * cannot creep back in through a template.
 *
 * WHAT IT COVERS
 *   - every landing / hub page whose meta is generated from a config module
 *     (qualification, category, Bihar organisation, state, board result hubs)
 *     — the population where a template can silently produce 40 identical
 *     titles with the name swapped out;
 *   - every static page, by scanning `src/app/**\/page.tsx` for a literal
 *     `title` / `description` in its `metadata` export.
 *
 * WHAT IT DOES NOT COVER
 *   - dynamic detail pages (/jobs/[slug], /exams/[slug], …). Their titles come
 *     from row content, which is unique by construction; a build-time scan of
 *     the database is not worth the coupling here. (If you ever add a template
 *     that emits "92 Vacancies" for those, extend this script — the GENERIC
 *     check below is already wired to catch that phrasing.)
 *   - interpolated strings (`title: \`\${x} Jobs\``) in a static page's
 *     metadata. Those are resolved at runtime; this scan skips them rather than
 *     guess, and reports how many it skipped so the gap is visible.
 *
 * Usage: node --experimental-strip-types scripts/check-meta-uniqueness.mjs
 * Wired into `npm run audit:meta`.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { QUALIFICATION_PAGES, CATEGORY_PAGES } from "../src/lib/landingPages.ts";
import {
  BIHAR_ORG_PAGES,
  STATE_SLUGS,
  buildStatePage,
} from "../src/lib/landingPagesState.ts";
import { BOARDS } from "../src/lib/boards.ts";

const ROOT = process.cwd();

/** A title like "92 Vacancies" or "Sarkari Jobs — 28 Vacancies" is a red flag. */
const GENERIC_TITLE = [
  /^\s*\d[\d,]*\s+vacanc/i,
  /sarkari\s+jobs\s*[—–-]\s*\d/i,
  /^\s*(home|jobs|government jobs|sarkari naukri)\s*$/i,
];

/** @type {{url:string; title:string; description:string; source:string}[]} */
const pages = [];
const skipped = [];

function add(url, title, description, source) {
  if (!title) {
    skipped.push(`${url} (no title)`);
    return;
  }
  pages.push({
    url,
    title: String(title).replace(/\s+/g, " ").trim(),
    description: String(description ?? "").replace(/\s+/g, " ").trim(),
    source,
  });
}

/* ---- 1. config-driven landing / hub pages -------------------------------- */

for (const p of QUALIFICATION_PAGES) {
  add(`/jobs/${p.slug}`, p.metaTitle, p.metaDescription, "landingPages");
}
for (const p of CATEGORY_PAGES) {
  add(`/jobs/category/${p.slug}`, p.metaTitle, p.metaDescription, "landingPages");
}
for (const p of BIHAR_ORG_PAGES) {
  add(`/bihar/${p.slug}`, p.metaTitle, p.metaDescription, "landingPagesState");
}
for (const slug of STATE_SLUGS) {
  const p = buildStatePage(slug);
  if (p) add(`/jobs/state/${slug}`, p.metaTitle, p.metaDescription, "landingPagesState");
}
for (const b of BOARDS) {
  // Mirrors generateMetadata() in src/app/result/boards/[slug]/page.tsx. Kept in
  // sync by hand because that page is a dynamic route this scanner cannot read;
  // if you edit one, edit both.
  const cls = b.classes.join(" & ");
  add(
    `/result/boards/${b.slug}`,
    `${b.name} ${cls} Result 2026 — Check on Official Website`,
    `How to check ${b.name} ${cls} result on the official portal (${b.portalHost}): step-by-step guide, what you need, re-evaluation and compartment information. We never store your roll number or marks.`,
    "boards",
  );
}

/* ---- 2. static pages, by scanning their page.tsx metadata ---------------- */

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry === "page.tsx") out.push(full);
  }
  return out;
}

/**
 * Pull a literal string out of `key: ...`. Handles `key: "x"`,
 * `key: { absolute: "x" }` and `key: { default: "x" }`. Returns null for an
 * interpolated (template-literal or computed) value so we can report the skip
 * instead of inventing a value.
 */
function literalField(text, key) {
  const re = new RegExp(
    `${key}\\s*:\\s*(?:\\{\\s*(?:absolute|default)\\s*:\\s*)?(["'])((?:(?!\\1).)*)\\1`,
    "s",
  );
  const m = re.exec(text);
  return m ? m[2] : null;
}

for (const file of walk(join(ROOT, "src", "app"))) {
  const text = readFileSync(file, "utf8");
  const route =
    "/" +
    relative(join(ROOT, "src", "app"), file)
      .replace(/\\/g, "/")
      .replace(/\/page\.tsx$/, "")
      .replace(/^page\.tsx$/, "")
      .replace(/\(.*?\)\//g, "");
  if (route.includes("[")) {
    skipped.push(`${route} (dynamic route — check manually)`);
    continue;
  }
  const title = literalField(text, "title");
  const description = literalField(text, "description");
  if (title === null && /title\s*:/.test(text)) {
    skipped.push(`${route} (interpolated title)`);
    continue;
  }
  if (title) add(route, title, description, "static");
}

/* ---- 3. duplicates + generic titles -------------------------------------- */

const byTitle = new Map();
const byDescription = new Map();
for (const p of pages) {
  if (!byTitle.has(p.title)) byTitle.set(p.title, []);
  byTitle.get(p.title).push(p);
  if (p.description) {
    if (!byDescription.has(p.description)) byDescription.set(p.description, []);
    byDescription.get(p.description).push(p);
  }
}

const problems = [];

for (const [title, group] of byTitle) {
  if (group.length > 1) {
    problems.push({
      kind: "DUPLICATE TITLE",
      value: title,
      urls: group.map((g) => g.url),
    });
  }
}
for (const [description, group] of byDescription) {
  if (group.length > 1) {
    problems.push({
      kind: "DUPLICATE DESCRIPTION",
      value: description,
      urls: group.map((g) => g.url),
    });
  }
}
for (const p of pages) {
  if (GENERIC_TITLE.some((re) => re.test(p.title))) {
    problems.push({ kind: "GENERIC TITLE", value: p.title, urls: [p.url] });
  }
}

/* ---- 4. report ----------------------------------------------------------- */

console.log(`checked ${pages.length} page meta values (${skipped.length} skipped)\n`);
if (skipped.length) {
  console.log("skipped (not checked):");
  for (const s of skipped) console.log(`  - ${s}`);
  console.log("");
}

if (problems.length === 0) {
  console.log(`OK — no duplicate titles, duplicate descriptions or generic titles.`);
  process.exit(0);
}

console.log(`${problems.length} problem(s):\n`);
for (const p of problems) {
  console.log(`  ${p.kind}`);
  console.log(`    "${p.value}"`);
  for (const u of p.urls) console.log(`      ${u}`);
  console.log("");
}
process.exit(1);
