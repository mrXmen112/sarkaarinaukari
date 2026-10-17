/**
 * B3 — canonical / robots sanity check.
 *
 * Confirms that every URL variant Google treats as an "alternate page with
 * proper canonical" points at the right base page, and that no disallowed
 * filter/sort URL is reachable through site navigation.
 *
 * Read-only. Usage: BASE_URL=http://localhost:3100 node scripts/check-canonicals.mjs
 */
const BASE = (process.env.BASE_URL || "http://localhost:3100").replace(/\/$/, "");

/** Filter/sort variants Google reported as "alternate page with proper canonical". */
const ALTERNATES = [
  ["/jobs?category=state", "/jobs"],
  ["/jobs?category=central", "/jobs"],
  ["/jobs?category=central&sort=newest", "/jobs"],
  ["/jobs?sort=newest", "/jobs"],
  ["/jobs?state=bihar", "/jobs"],
  ["/jobs?page=2", "/jobs"],
  ["/jobs?qualification=graduate", "/jobs"],
  ["/jobs?department=bpsc", "/jobs"],
  ["/jobs?search=bpsc", "/jobs"],
];

/** Landing pages that must be self-canonical. */
const SELF_CANONICAL = [
  "/jobs",
  "/jobs/graduate",
  "/jobs/10th-pass",
  "/jobs/category/railway",
  "/jobs/category/banking",
  "/jobs/state/bihar",
  "/result/10th",
  "/result/12th",
  "/bihar",
];

/**
 * Private pages. These are intentionally Disallow'd in robots.txt, which is why
 * Search Console lists them as "Blocked by robots.txt". That is the desired
 * state and is left alone on purpose.
 *
 * Note they deliberately do NOT also carry a `noindex` meta tag. Google cannot
 * fetch a robots.txt-blocked page, so it never sees the meta, and pairing
 * Disallow with noindex is self-contradictory advice. What we DO assert is that
 * neither URL leaks into a sitemap, since a sitemap entry would invite the crawl
 * that robots.txt is trying to prevent.
 */
const EXPECTED_NOINDEX = ["/login", "/profile"];

function canonicalOf(html) {
  const m = /<link[^>]+rel="canonical"[^>]*>/i.exec(html);
  if (!m) return null;
  const h = /href="([^"]+)"/i.exec(m[0]);
  return h ? h[1] : null;
}

let fails = 0;

console.log("=== alternate URLs must canonicalise to the base page ===");
for (const [url, expected] of ALTERNATES) {
  const html = await (await fetch(BASE + url)).text();
  const canon = canonicalOf(html);
  const ok = canon !== null && new URL(canon, BASE).pathname === expected;
  if (!ok) fails++;
  console.log(
    `  ${ok ? "ok  " : "FAIL"}  ${url.padEnd(38)} -> ${canon ?? "(none)"}`,
  );
}

console.log("\n=== indexable pages must be self-canonical ===");
for (const path of SELF_CANONICAL) {
  const res = await fetch(BASE + path);
  const html = await res.text();
  const canon = canonicalOf(html);
  const ok = res.status === 200 && canon !== null && new URL(canon, BASE).pathname === path;
  if (!ok) fails++;
  console.log(
    `  ${ok ? "ok  " : "FAIL"}  ${String(res.status).padEnd(4)} ${path.padEnd(30)} -> ${canon ?? "(none)"}`,
  );
}

console.log("\n=== private pages must not appear in any sitemap ===");
const sitemapXml = await collectSitemapUrls();
console.log(`  (collected ${sitemapXml.length} sitemap URLs)`);
for (const path of EXPECTED_NOINDEX) {
  const leaked = sitemapXml.filter((u) => new URL(u).pathname === path);
  if (leaked.length) fails++;
  console.log(
    `  ${leaked.length ? "FAIL" : "ok  "}  ${path.padEnd(30)} ${leaked.length ? "present in sitemap" : "absent from sitemap"}`,
  );
}

/** Gather every <loc> from the sitemap index and its children. */
async function collectSitemapUrls() {
  const localise = (u) => {
    const url = new URL(u);
    return url.origin === BASE ? u : BASE + url.pathname + url.search;
  };
  const out = [];
  const index = await (await fetch(`${BASE}/sitemap.xml`)).text();
  const locs = [...index.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
  const children = locs.filter((l) => l.endsWith(".xml"));
  if (children.length === 0) return locs;
  for (const child of children) {
    // Children are listed as absolute PRODUCTION urls; fetch them from BASE.
    const xml = await (await fetch(localise(child))).text();
    for (const m of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) out.push(m[1]);
  }
  return out;
}

console.log(`\nfailures: ${fails}`);
process.exitCode = fails ? 1 : 0;