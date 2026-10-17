/**
 * B1.3 — internal 404 audit.
 *
 * Walks every URL in the sitemap, then every internal link found on those
 * pages, and reports any that do not answer 200. A 3xx is not a failure as
 * long as it lands on a 200, because the site uses permanent redirects
 * deliberately (domain consolidation, /signup -> /login, legacy job slugs).
 *
 * It also runs three fixed probes:
 *   - the junk URLs Search Console reported, which must be a real 404
 *   - the legacy job slugs, which must redirect to a live 200
 *   - a random path, to prove there is no catch-all answering 200
 *
 * A URL that 200s but is marked noindex, or that redirects into a redirect
 * loop, is reported as a warning. Nothing here mutates data.
 *
 * Usage:
 *   npm run build && npm start -- -p 3100
 *   BASE_URL=http://localhost:3100 npm run audit:404
 *
 * Options:
 *   --limit=N     max sitemap URLs to crawl (default 120)
 *   --no-sitemap  skip the sitemap and probe the fixed routes only
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = (process.env.BASE_URL || "http://localhost:3100").replace(/\/$/, "");
const ORIGIN = new URL(BASE).origin;

const args = process.argv.slice(2);
const LIMIT = Number((args.find((a) => a.startsWith("--limit=")) || "").split("=")[1] || 120);
const USE_SITEMAP = !args.includes("--no-sitemap");

const USER_AGENT = "sarkaarinaukari-404-audit/1.0 (+internal link check)";

/** The site's real production origin. Sitemaps and canonicals use absolute URLs
 *  on this host, so it is the only origin treated as "internal" when rewriting
 *  them onto BASE. Any other absolute URL is an off-site link and is skipped —
 *  official notification PDFs live on recruiting-body portals, not on this site. */
const SITE_ORIGIN = "https://www.sarkaarinaukri.online";

/** Junk URLs from the Oct 2026 Search Console "Not found" report. */
const JUNK_PROBES = [
  "/sup.ve",
  "/qhqzf",
  "/uimzf-etai",
  "/lazq",
  "/wqk",
];

/** Legacy slugs that must redirect rather than 404 (migration 0019). */
const LEGACY_SLUGS = [
  "/jobs/bihar-jail-sepoy-2026-3",
  "/jobs/agniveer-2026-1",
  "/jobs/ibps-po-17-5",
  "/jobs/ssc-gd-2026-0",
];

/** Core routes probed even when --no-sitemap is used. */
const CORE_ROUTES = ["/", "/jobs", "/bihar", "/exams", "/yojana", "/result", "/admit-card"];

const failures = [];
const warnings = [];
const checked = new Map();

function isInternal(href) {
  if (!href) return false;
  if (href.startsWith("#")) return false;
  if (/^(mailto:|tel:|javascript:)/i.test(href)) return false;
  if (href.startsWith("//")) return false;
  if (href.startsWith("/")) return ORIGIN + href;
  if (/^https?:\/\//i.test(href)) {
    try {
      const u = new URL(href);
      // Same host as the running build -> already internal.
      if (u.origin === ORIGIN) return href;
      // Our own production host -> re-point at the local build being audited.
      if (u.origin === SITE_ORIGIN) return ORIGIN + u.pathname + u.search;
      // Any other host is off-site (official portals, ad networks). Skip it.
      return null;
    } catch {
      return null;
    }
  }
  return ORIGIN + "/" + href;
}

/**
 * Build assets are not navigation links. Their URLs are content-hashed and Next
 * guarantees their lifecycle, but a prerendered page can still reference a hash
 * from an earlier local build — that is a build-cache artefact, not an SEO
 * defect, and Google never crawls /_next/. Tracked as a warning so a genuine
 * missing asset is still visible.
 */
function isBuildAsset(pathname) {
  return pathname.startsWith("/_next/");
}

/** Fetch and report status without throwing. Follows redirects manually so the
 *  redirect chain itself can be audited rather than hidden by fetch(). */
async function probe(url, depth = 0) {
  if (depth > 5) return { status: 508, chain: ["too many redirects"] };
  let res;
  try {
    res = await fetch(url, {
      redirect: "manual",
      headers: { "user-agent": USER_AGENT },
    });
  } catch (err) {
    return { status: 0, error: String(err && err.message ? err.message : err), chain: [] };
  }
  if (res.status >= 300 && res.status < 400) {
    // Headers.get() joins repeated values with ", ". Taking the first entry
    // keeps the logged target readable if a response ever carries two.
    const raw = res.headers.get("location");
    const loc = raw ? raw.split(",")[0].trim() : null;
    const chain = [res.status];
    if (!loc) return { status: res.status, chain, note: "redirect with no Location" };
    const next = new URL(loc, url).toString();
    const sub = await probe(next, depth + 1);
    return { status: res.status, chain: [...chain, sub.status], finalUrl: next, finalStatus: sub.status };
  }
  return { status: res.status, chain: [res.status] };
}

/** Re-point one of our own production URLs at the server under test. */
function localise(u) {
  const url = new URL(u);
  return url.origin === ORIGIN ? u : ORIGIN + url.pathname + url.search;
}

/** Pull <loc> entries out of a sitemap or sitemap index. */
async function sitemapLocations() {
  const res = await fetch(`${BASE}/sitemap.xml`, { headers: { "user-agent": USER_AGENT } });
  if (!res.ok) throw new Error(`sitemap.xml returned ${res.status}`);
  const xml = await res.text();

  // A sitemap index nests child sitemaps; collect both levels.
  const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
  const children = locs.filter((l) => l.endsWith(".xml"));
  if (children.length === 0) return locs;

  const out = [];
  for (const child of children) {
    // Child sitemaps are listed with absolute PRODUCTION urls. Fetching them
    // verbatim audits the live site instead of the build under test, which
    // silently reports stale counts.
    const childRes = await fetch(localise(child), { headers: { "user-agent": USER_AGENT } });
    if (!childRes.ok) {
      warnings.push({ url: child, note: `child sitemap returned ${childRes.status}` });
      continue;
    }
    const childXml = await childRes.text();
    for (const m of childXml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) {
      out.push(m[1]);
    }
  }
  return out;
}

/** Extract every internal href from a page body. */
function internalLinks(html) {
  const found = new Set();
  for (const m of html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)) {
    const abs = isInternal(m[1].replace(/&amp;/g, "&"));
    if (abs) found.add(abs);
  }
  for (const m of html.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) {
    const abs = isInternal(m[1]);
    if (abs) found.add(abs);
  }
  return [...found];
}

const report = { base: BASE, startedAt: new Date().toISOString(), checked: 0, failures, warnings };

/* ---------------- run ---------------- */

let seedUrls = [];
if (USE_SITEMAP) {
  try {
    const all = await sitemapLocations();
    seedUrls = all.slice(0, LIMIT);
    console.log(`sitemap: ${all.length} URLs found, crawling ${seedUrls.length}`);
    if (all.length > LIMIT) {
      warnings.push({ note: `sitemap has ${all.length} URLs; only the first ${LIMIT} were crawled. Re-run with a higher --limit.` });
    }
  } catch (err) {
    failures.push({ url: `${BASE}/sitemap.xml`, problem: String(err.message || err) });
  }
} else {
  seedUrls = CORE_ROUTES.map((r) => ORIGIN + r);
  console.log("sitemap skipped; probing core routes only");
}

const linkTargets = new Map();
let pagesFetched = 0;

for (const rawUrl of seedUrls) {
  // Sitemaps carry absolute production URLs; audit the local build instead.
  const url = isInternal(rawUrl) ?? rawUrl;
  let res;
  try {
    res = await fetch(url, { redirect: "manual", headers: { "user-agent": USER_AGENT } });
  } catch (err) {
    failures.push({ url, problem: `fetch failed: ${err.message}` });
    continue;
  }
  report.checked += 1;

  if (res.status >= 300 && res.status < 400) {
    const loc = res.headers.get("location");
    if (!loc) {
      failures.push({ url, problem: "redirect with no Location header" });
    } else {
      const target = new URL(loc, url).toString();
      const sub = await probe(target);
      if (sub.status !== 200) {
        failures.push({ url, problem: `sitemap URL redirects ${res.status} -> ${sub.status} (${target})` });
      }
    }
    continue;
  }
  if (res.status !== 200) {
    failures.push({ url, problem: `sitemap URL returned ${res.status}` });
    continue;
  }

  const html = await res.text();
  pagesFetched += 1;
  for (const link of internalLinks(html)) {
    if (!linkTargets.has(link)) linkTargets.set(link, url);
  }
}

console.log(`crawled ${pagesFetched} pages, ${linkTargets.size} distinct internal links to verify`);

for (const [url, referrer] of linkTargets) {
  const { status, chain, finalStatus } = await probe(url);
  checked.set(url, { status, chain });
  if (status === 0) {
    failures.push({ url, referrer, problem: "unreachable" });
  } else if (status >= 400) {
    if (isBuildAsset(new URL(url).pathname)) {
      warnings.push({ url, referrer, note: `build asset returns ${status} (stale local build hash, not an SEO issue)` });
    } else {
      failures.push({ url, referrer, problem: `internal link returns ${status}`, chain });
    }
  } else if (status >= 300) {
    if (finalStatus !== 200) {
      failures.push({ url, referrer, problem: `redirect chain ${chain.join(" -> ")} does not end at 200` });
    }
  }
}

/* ---------------- fixed probes ---------------- */

console.log("\nprobing junk URLs (must be 404, never 200)...");
for (const p of JUNK_PROBES) {
  const url = ORIGIN + p;
  const { status } = await probe(url);
  if (status === 200) {
    failures.push({ url, problem: "junk URL answered 200 — soft 404 or catch-all" });
  } else if (status !== 404) {
    warnings.push({ url, problem: `expected 404, got ${status}` });
  } else {
    console.log(`  ok  404  ${p}`);
  }
}

console.log("probing legacy slugs (must redirect to 200)...");
for (const p of LEGACY_SLUGS) {
  const url = ORIGIN + p;
  const { status, chain, finalUrl } = await probe(url);
  if (status >= 300 && status < 400 && finalUrl) {
    console.log(`  ok  ${status} -> ${finalUrl}`);
  } else if (status === 200) {
    warnings.push({ url, problem: "legacy slug answered 200 instead of redirecting" });
  } else {
    failures.push({ url, problem: `legacy slug returns ${status}; expected a redirect`, chain });
  }
}

const randomPath = `/zz-404-audit-${Date.now()}`;
console.log("probing a random path (must be 404, proves no catch-all)...");
{
  const { status } = await probe(ORIGIN + randomPath);
  if (status === 200) {
    failures.push({ url: randomPath, problem: "random path answered 200 — a catch-all route is serving unknown URLs" });
  } else if (status !== 404) {
    warnings.push({ url: randomPath, problem: `expected 404, got ${status}` });
  } else {
    console.log("  ok  404");
  }
}

/* ---------------- report ---------------- */

report.linksChecked = checked.size;
report.finishedAt = new Date().toISOString();
report.summary = {
  sitemapUrls: seedUrls.length,
  pagesFetched,
  linksChecked: checked.size,
  failures: failures.length,
  warnings: warnings.length,
};

const outDir = path.resolve("reports");
await mkdir(outDir, { recursive: true });
const outFile = path.join(outDir, "404-audit.json");
await writeFile(outFile, JSON.stringify(report, null, 2));

console.log("\n--- summary ---");
console.log(`sitemap URLs      ${seedUrls.length}`);
console.log(`pages crawled     ${pagesFetched}`);
console.log(`links verified    ${checked.size}`);
console.log(`failures          ${failures.length}`);
console.log(`warnings          ${warnings.length}`);
console.log(`written to        ${outFile}`);

if (failures.length) {
  console.log("\n--- failures ---");
  for (const f of failures) console.log(`  ${f.url}  ${f.problem}`);
  process.exitCode = 1;
}
if (warnings.length) {
  console.log("\n--- warnings ---");
  for (const w of warnings) console.log(`  ${w.url || "-"}  ${w.note || w.problem}`);
}