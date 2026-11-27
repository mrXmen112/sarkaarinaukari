/**
 * Official recruitment-calendar synchroniser.
 *
 * Every record below is copied from UPSC's official Annual Calendar 2027 PDF.
 * Before upserting, the script requires the advertised dates to be present
 * verbatim in the fetched PDF text. Missing dates are rejected and logged.
 *
 * Run: npm run sync:calendars
 */
import { createRequire } from "node:module";
const require = createRequire("D:/sarkaarinaukari/package.json");
const pdfParse = require("pdf-parse");
import { loadEnv } from "./lib/config.mjs";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36";
const CALENDAR = "https://www.upsc.gov.in/uploads/2026/06/Calendar-Year-2027-Engl-200526.pdf";
const CALENDAR_PAGE = "https://www.upsc.gov.in/examination-calendar/";

const specs = [
  ["nda-na-1-2027", "NDA & NA Examination (I) 2027", "02.12.2026", "22.12.2026", "11.04.2027", "notification_scheduled", null],
  ["cds-1-2027", "CDS Examination (I) 2027", "02.12.2026", "22.12.2026", "11.04.2027", "notification_scheduled", null],
  ["cse-prelim-2027", "Civil Services (Preliminary) Examination 2027", "13.01.2027", "02.02.2027", "23.05.2027", "notification_scheduled", null],
  ["ifos-prelim-2027", "Indian Forest Service (Preliminary) Examination 2027", "13.01.2027", "02.02.2027", "23.05.2027", "notification_scheduled", "Conducted through CS(P) Examination 2027."],
  ["ies-iss-2027", "Indian Economic Service / Indian Statistical Service Examination 2027", "10.02.2027", "02.03.2027", "18.06.2027", "notification_scheduled", null],
  ["capf-ac-2027", "Central Armed Police Forces (Assistant Commandants) Examination 2027", "17.02.2027", "09.03.2027", "04.07.2027", "notification_scheduled", null],
  ["cms-2027", "Combined Medical Services Examination 2027", "03.03.2027", "23.03.2027", "18.07.2027", "notification_scheduled", null],
  ["cbi-dsp-ldce-2027", "CBI (DSP) LDCE 2027", "16.12.2026", "05.01.2027", "27.02.2027", "notification_scheduled", "Limited Departmental Competitive Examination — serving police officers only; not a general public vacancy."],
  ["ese-prelim-2027", "Engineering Services (Preliminary) Examination 2027", "16.09.2026", "06.10.2026", "31.01.2027", "examination_scheduled", "Advertisement already published; examination scheduled."],
  ["geo-prelim-2027", "Combined Geo-Scientist (Preliminary) Examination 2027", "02.09.2026", "22.09.2026", "10.01.2027", "examination_scheduled", "Advertisement already published; examination scheduled."],
];

function iso(dmy) {
  const [d, m, y] = dmy.split(".");
  return `${y}-${m}-${d}`;
}

function slugify(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90);
}

async function main() {
  const { url, serviceKey } = loadEnv();
  const base = url.replace(/\/$/, "");
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };
  const res = await fetch(CALENDAR, { headers: { "User-Agent": UA, Accept: "application/pdf" }, signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`UPSC calendar HTTP ${res.status}`);
  const data = await pdfParse(Buffer.from(await res.arrayBuffer()));
  const text = String(data.text ?? "").replace(/\s+/g, " ").trim();
  if (text.length < 1000 || !text.includes("PROGRAMME OF EXAMINATIONS")) throw new Error("Unexpected UPSC calendar text");

  const rows = [];
  const rejected = [];
  for (const [key, title, notify, lastDate, exam, status, note] of specs) {
    const missing = [notify, lastDate, exam].filter(d => !text.includes(d));
    if (missing.length) {
      rejected.push(`${key}: dates not in official calendar (${missing.join(",")})`);
      continue;
    }
    rows.push({
      slug: slugify(title),
      dedupe_key: `upsc:${key}`,
      title,
      organization: "Union Public Service Commission",
      level: "central",
      state: null,
      category: "central",
      status,
      date_confidence: "confirmed",
      notification_date: iso(notify),
      application_start: null,
      application_end: iso(lastDate),
      exam_date: iso(exam),
      calendar_url: CALENDAR_PAGE,
      notification_url: null,
      apply_url: null,
      source_url: CALENDAR,
      eligibility_note: note,
      last_verified_at: new Date().toISOString(),
      is_published: true,
    });
  }

  if (rows.length) {
    const r = await fetch(`${base}/rest/v1/upcoming_recruitments?on_conflict=dedupe_key`, {
      method: "POST",
      headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(rows),
    });
    if (!r.ok) throw new Error(`upsert failed: ${r.status} ${(await r.text()).slice(0, 300)}`);
  }
  console.log(JSON.stringify({ calendar: CALENDAR, imported: rows.length, rejected, statuses: rows.reduce((a, r) => ((a[r.status] = (a[r.status] ?? 0) + 1), a), {}) }, null, 2));
}

main().catch(e => { console.error(`calendar sync failed: ${e.message}`); process.exitCode = 1; });
