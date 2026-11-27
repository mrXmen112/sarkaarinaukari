/**
 * Runtime smoke tests for the public workflows. Run against a live build:
 *   npm run build && npm start -- -p 3100
 *   npm run test:flows -- http://127.0.0.1:3100
 */
const base = (process.argv[2] ?? "http://127.0.0.1:3100").replace(/\/$/, "");
const results = [];

async function check(path, expect = []) {
  try {
    const res = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(30000) });
    const body = await res.text();
    const missing = expect.filter((s) => !body.includes(s));
    results.push({ path, status: res.status, ok: res.ok && missing.length === 0, missing });
  } catch (error) {
    results.push({ path, status: 0, ok: false, missing: [String(error)] });
  }
}

const paths = [
  "/",
  "/jobs",
  "/jobs?page=2",
  "/jobs?page=3",
  "/jobs?status=all",
  "/jobs?status=all&page=2",
  "/jobs?state=bihar",
  "/jobs?central=1",
  "/jobs?stateJobs=1",
  "/jobs?qualification=10th",
  "/jobs?qualification=12th",
  "/jobs?q=Railway",
  "/jobs?q=Bank",
  "/jobs/category/defence",
  "/jobs/category/teaching",
  "/jobs/archive",
  "/yojana",
  "/yojana?page=2",
  "/yojana?level=central",
  "/yojana?level=state",
  "/yojana?level=ut",
  "/yojana?category=student_scholarship",
  "/bihar",
  "/editorial-policy",
  "/sitemap-index",
  "/sitemap/jobs.xml",
  "/sitemap/prep.xml",
  "/robots.txt",
];

for (const path of paths) await check(path);

const jobsPage = await fetch(`${base}/jobs?status=all`).then((r) => r.text());
const slugs = [...new Set([...jobsPage.matchAll(/href="\/jobs\/([a-z0-9-]+)"/g)].map((m) => m[1]))];
for (const slug of slugs.slice(0, 25)) {
  await check(`/jobs/${slug}`, [`/jobs/${slug}`]);
}

const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"} ${r.status} ${r.path}${r.missing?.length ? ` missing=${r.missing.join(",")}` : ""}`);
console.log(`\n${results.length - failed.length}/${results.length} passed; ${slugs.length} job detail links checked.`);
process.exitCode = failed.length ? 1 : 0;
