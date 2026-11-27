/**
 * myScheme → Sarkari Yojana directory synchroniser.
 *
 * Uses myScheme's own public JSON endpoints, discovered from the live site:
 *   search: /api/apisetu/search/schemes?lang=en&from=N&size=M
 *   detail: /api/apisetu/schemes?slug=<slug>&lang=en
 *   docs:   /api/apisetu/schemes/<id>/documents?lang=en
 *
 * Every stored field is copied from the official API. Nothing is generated.
 * Re-running upserts by slug and refreshes last_verified_at, so updates are
 * detected. Run: node scripts/scraper/myscheme-sync.mjs --limit=200
 */
import { loadEnv } from "./lib/config.mjs";

const BASE = "https://www.myscheme.gov.in";

const STATE_SLUGS = {
  "andhra pradesh": "andhra-pradesh", "arunachal pradesh": "arunachal-pradesh",
  assam: "assam", bihar: "bihar", chhattisgarh: "chhattisgarh", goa: "goa",
  gujarat: "gujarat", haryana: "haryana", "himachal pradesh": "himachal-pradesh",
  jharkhand: "jharkhand", karnataka: "karnataka", kerala: "kerala",
  "madhya pradesh": "madhya-pradesh", maharashtra: "maharashtra",
  manipur: "manipur", meghalaya: "meghalaya", mizoram: "mizoram",
  nagaland: "nagaland", odisha: "odisha", punjab: "punjab",
  rajasthan: "rajasthan", sikkim: "sikkim", "tamil nadu": "tamil-nadu",
  telangana: "telangana", tripura: "tripura", "uttar pradesh": "uttar-pradesh",
  uttarakhand: "uttarakhand", "west bengal": "west-bengal",
  "andaman and nicobar islands": "andaman-and-nicobar",
  chandigarh: "chandigarh",
  "dadra & nagar haveli and daman & diu": "dadra-and-nagar-haveli-and-daman-and-diu",
  delhi: "delhi", "jammu and kashmir": "jammu-and-kashmir",
  ladakh: "ladakh", puducherry: "puducherry",
};
const UT_NAMES = new Set([
  "andaman and nicobar islands", "chandigarh",
  "dadra & nagar haveli and daman & diu", "delhi",
  "jammu and kashmir", "ladakh", "puducherry",
]);

const CATEGORY_MAP = [
  [/women|child/i, "women_welfare"],
  [/agricultur|farmer|rural/i, "farmer_welfare"],
  [/education|learning|science/i, "education"],
  [/skill|employment|job/i, "employment"],
  [/business|entrepreneur|banking|financial/i, "business_startup"],
  [/housing|shelter/i, "housing"],
  [/health|wellness|medical/i, "healthcare"],
  [/social welfare|empowerment/i, "social_welfare"],
  [/scheduled|tribe|minority/i, "sc_st_obc_welfare"],
];

function categoryOf(labels) {
  const text = (labels ?? []).join(" ");
  for (const [re, value] of CATEGORY_MAP) if (re.test(text)) return value;
  return "social_welfare";
}

function plain(markdown) {
  return String(markdown ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&quot;/g, '"')
    .replace(/\*\*/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim() || null;
}

async function getJson(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; SarkaariNaukriBot/1.0; +https://sarkaarinaukri.online/contact)",
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
  const body = await res.json();
  if (body.status !== "Success") throw new Error(`${path} → ${body.status}`);
  return body.data;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const value = (name, fallback) => {
    const inline = args.find((a) => a.startsWith(`--${name}=`));
    if (inline) return inline.slice(name.length + 3);
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : fallback;
  };
  return {
    limit: Math.max(1, Math.min(1000, Number(value("limit", 200)))),
    concurrency: Math.max(1, Math.min(10, Number(value("concurrency", 5)))),
  };
}

async function detailsFor(slug) {
  const d = await getJson(`/api/apisetu/schemes?slug=${encodeURIComponent(slug)}&lang=en`);
  if (!d?.en) return null;
  const en = d.en;
  let documents = null;
  try {
    const docData = await getJson(`/api/apisetu/schemes/${d._id}/documents?lang=en`);
    documents = plain(docData?.en?.documentsRequired_md);
  } catch {
    documents = null;
  }
  const application = Array.isArray(en.applicationProcess)
    ? en.applicationProcess.map((p) => plain(p.process_md)).filter(Boolean).join("\n\n")
    : null;
  const refs = en.schemeContent?.references ?? [];
  const applyUrl = refs.find((r) => /apply|registration|portal/i.test(r?.title ?? ""))?.url
    ?? refs.find((r) => /guideline/i.test(r?.title ?? ""))?.url
    ?? null;
  return {
    eligibility: plain(en.eligibilityCriteria?.eligibilityDescription_md),
    benefits: plain(en.schemeContent?.benefits_md),
    how_to_apply: application,
    required_documents: documents,
    apply_url: applyUrl && /^https?:\/\//.test(applyUrl) ? applyUrl : null,
  };
}

async function upsert(rows, url, serviceKey) {
  const res = await fetch(
    `${url.replace(/\/$/, "")}/rest/v1/yojana?on_conflict=slug`,
    {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(rows),
    },
  );
  if (!res.ok) throw new Error(`yojana upsert failed: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
}

async function main() {
  const { limit, concurrency } = parseArgs();
  const { url, serviceKey } = loadEnv();
  // The public API rejects a large single page (HTTP 412), so walk it in
  // small, bounded pages. The registry holds only what was actually returned.
  const items = [];
  let total = 0;
  for (let from = 0; from < limit; from += 50) {
    const size = Math.min(50, limit - from);
    const page = await getJson(
      `/api/apisetu/search/schemes?lang=en&q=%5B%5D&keyword=&sort=&from=${from}&size=${size}`,
    );
    total = page?.hits?.page?.total ?? total;
    const batch = page?.hits?.items ?? [];
    items.push(...batch);
    if (batch.length < size) break;
  }
  console.log(`myScheme: ${total} schemes listed; processing ${items.length}.`);

  const rows = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const results = await Promise.allSettled(
      batch.map(async (item) => {
        const f = item.fields ?? {};
        const slug = `myscheme-${f.slug}`;
        const stateNames = Array.isArray(f.beneficiaryState) ? f.beneficiaryState : [];
        const isUt = stateNames.some((s) => UT_NAMES.has(String(s).toLowerCase()));
        const state = stateNames
          .map((s) => STATE_SLUGS[String(s).toLowerCase()])
          .find(Boolean) ?? null;
        const close = f.schemeCloseDate ? String(f.schemeCloseDate).slice(0, 10) : null;
        const detail = await detailsFor(f.slug);
        return {
          title: String(f.schemeName ?? "").slice(0, 200),
          slug,
          level: isUt ? "ut" : String(f.level ?? "").toLowerCase() === "central" ? "central" : "state",
          state,
          description: plain(f.briefDescription),
          benefits_summary: plain(f.briefDescription)?.slice(0, 240) ?? null,
          eligibility: detail?.eligibility ?? null,
          benefits: detail?.benefits ?? null,
          how_to_apply: detail?.how_to_apply ?? null,
          required_documents: detail?.required_documents ?? null,
          category: categoryOf(f.schemeCategory),
          official_link: `${BASE}/schemes/${f.slug}`,
          apply_url: detail?.apply_url ?? null,
          source_url: `${BASE}/api/apisetu/schemes?slug=${f.slug}&lang=en`,
          availability_status: close && close < new Date().toISOString().slice(0, 10) ? "closed" : "active",
          last_verified_at: new Date().toISOString(),
          is_published: true,
        };
      }),
    );
    for (const r of results) {
      if (r.status === "fulfilled" && r.value.title) rows.push(r.value);
      else if (r.status === "rejected") console.error("detail failed:", String(r.reason).slice(0, 160));
    }
  }
  if (rows.length) await upsert(rows, url, serviceKey);
  console.log(`Synced ${rows.length} official scheme records from myScheme.`);
}

main().catch((e) => {
  console.error(`myScheme sync failed: ${e.message}`);
  process.exitCode = 1;
});
