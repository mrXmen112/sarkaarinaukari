/**
 * Submit one or more URLs to IndexNow (Bing/Yandex).
 *
 * Dynamic job/stage publishes already ping IndexNow from the server actions.
 * Static landing pages have no publish event, so after deploying a new or
 * materially changed guide run:
 *
 *   npm run submit:indexnow -- /bihar/12th-pass-jobs
 *
 * With no arguments it submits the core Bihar entry points. The key is read
 * from INDEXNOW_KEY (or .env.local) and must be served at /<key>.txt.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_PATHS = [
  "/",
  "/bihar",
  "/bihar/12th-pass-jobs",
  "/jobs/12th-pass",
  "/exams/bpsc-70th",
];

async function loadLocalEnv() {
  if (process.env.INDEXNOW_KEY) return;
  try {
    const raw = await readFile(path.join(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key]) continue;
      process.env[key] = rawValue.replace(/^["']|["']$/g, "");
    }
  } catch {
    // The explicit missing-key error below is clearer than an ENOENT trace.
  }
}

await loadLocalEnv();

const key = process.env.INDEXNOW_KEY;
const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sarkaarinaukri.online")
  .replace(/\/+$/, "");

if (!key) {
  console.error("INDEXNOW_KEY is not set. Add it to .env.local and Vercel.");
  process.exit(1);
}

const paths = process.argv.length > 2 ? process.argv.slice(2) : DEFAULT_PATHS;
const urlList = paths.map((p) => (p.startsWith("http") ? p : `${site}${p.startsWith("/") ? p : `/${p}`}`));

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: new URL(site).host,
    key,
    keyLocation: `${site}/${key}.txt`,
    urlList,
  }),
});

if (!response.ok) {
  console.error(`IndexNow HTTP ${response.status}`);
  process.exit(1);
}

console.log(`Submitted ${urlList.length} URL(s) to IndexNow.`);
for (const url of urlList) console.log(`- ${url}`);
