#!/usr/bin/env node
/**
 * One-time taxonomy backfill: fill jobs.department_slug + jobs.state from the
 * controlled vocabulary, using ONLY deterministic keyword rules over the job
 * title / department text. Never guesses - if no rule matches, the field is
 * left untouched for manual fixing in /admin/jobs.
 *
 * Usage:
 *   node scripts/backfill-taxonomy.mjs            # dry run (prints plan)
 *   node scripts/backfill-taxonomy.mjs --apply    # writes to Supabase
 *
 * Rules are ordered: the first match wins. Bodies whose names contain "ssc"
 * or "psc" as a substring (BSSC, HSSC, DSSSB, KPSC, ...) are checked before
 * the national bodies so they cannot be swallowed by a looser pattern.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  DEPARTMENT_STATE,
  isValidDepartmentSlug,
} from "../scripts/scraper/lib/vocab.mjs";

function loadEnvLocal() {
  const out = {};
  try {
    // This file lives in <root>/scripts/, so the repo root is one level up.
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
const URL_BASE = (
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  env.NEXT_PUBLIC_SUPABASE_URL ??
  ""
).replace(/\/$/, "");
const KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  env.SUPABASE_SERVICE_ROLE_KEY ??
  "";
if (!URL_BASE || !KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const APPLY = process.argv.includes("--apply");

/** Ordered keyword rules over "title department". First match wins. */
const RULES = [
  // --- Substring-prone state bodies first ---
  { dept: "bssc", re: /\bbssc\b|bihar staff selection/i },
  { dept: "hssc", re: /\bhssc\b|haryana staff selection/i },
  { dept: "hppsc", re: /hppsc|himachal pradesh public service/i },
  { dept: "cgpsc", re: /cgpsc|chhattisgarh public service/i },
  { dept: "mppsc", re: /\bmppsc\b|madhya pradesh public service/i },
  { dept: "rpsc", re: /\brpsc\b|rajasthan public service/i },
  { dept: "wbpsc", re: /\bwbpsc\b|west bengal public service/i },
  { dept: "kpsc", re: /\bkpsc\b|karnataka public service/i },
  { dept: "gpsc", re: /\bgpsc\b|gujarat public service/i },
  { dept: "hpsc", re: /\bhpsc\b|haryana public service/i },
  { dept: "uppsc", re: /\buppsc\b|uttar pradesh public service/i },
  { dept: "uppolice", re: /up police|uttar pradesh police/i },
  { dept: "upsssc", re: /upsssc/i },
  { dept: "delhi-police", re: /delhi police/i },
  { dept: "dsssb", re: /\bdsssb\b/i },

  // --- National bodies (state stays null). The SSC rule matches only the
  // standalone token "SSC" -- "staff selection commission" alone is too loose
  // and would swallow HSSC / DSSSB / KVS. ---
  { dept: "ssc", re: /\bssc\b/i },
  { dept: "upsc", re: /\bupsc\b|union public service commission/i },
  { dept: "rrb", re: /\brrb\b|railway recruitment|railway protection force|\brpf\b/i },
  { dept: "ibps", re: /\bibps\b/i },
  { dept: "psu", re: /\bpsu\b|public sector|power grid|\bntpc\b|\bbhel\b|\biocl\b|\bgail\b/i },
  {
    dept: "defence",
    re: /indian army|indian navy|indian air force|agniveer|agnipath|afcat|cdac/i,
  },

  // --- Bihar (state = bihar) ---
  { dept: "bpsc", re: /\bbpsc\b|bihar public service commission/i },
  { dept: "bihar-police", re: /bihar police|\bcsbc\b/i },
  { dept: "bihar-tre", re: /\btre\b|teacher recruitment/i },
  { dept: "bihar-health", re: /staff nurse|health (department|worker)|\banm\b|\bgnm\b/i },
  { dept: "bihar-panchayat", re: /panchayat|gram kachahari|gram panchayat/i },
  { dept: "bihar-home-guard", re: /home guard|civil defence/i },
  { dept: "bihar-jal-nigam", re: /jal nigam|jal jeevan/i },

  // --- Remaining states ---
  { dept: "mppolice", re: /mp police|madhya pradesh police/i },
  { dept: "raj-police", re: /rajasthan police/i },
  { dept: "rsmssb", re: /rsmssb/i },
  { dept: "wbpreb", re: /west bengal police|wbpreb/i },
  { dept: "tnpsc", re: /\btnpsc\b|tamil nadu public service/i },
  { dept: "mpsc", re: /\bmpsc\b|maharashtra public service/i },
  { dept: "ppsc", re: /\bppsc\b|punjab public service/i },
  { dept: "psssb", re: /psssb/i },
  { dept: "tgpsc", re: /tgpsc|telangana public service/i },
  { dept: "appsc", re: /appsc|andhra pradesh public service/i },
  { dept: "opsc", re: /\bopsc\b|odisha public service/i },
  { dept: "jpsc", re: /\bjpsc\b|jharkhand public service/i },
  { dept: "kerala-psc", re: /kerala (public service|psc)/i },
  { dept: "apsc", re: /\bapsc\b|assam public service/i },
  { dept: "ukpsc", re: /ukpsc|uttarakhand public service/i },
  { dept: "jkssb", re: /jkssb|j&k subordinate/i },

  // --- Tier 2 national bodies (real filter keys, no dedicated landing page) ---
  {
    dept: "central-police",
    re: /\bcisf\b|\bssb\b|\bbsf\b|\bitbp\b|\bcrpf\b|assam rifles|central armed police/i,
  },
  {
    dept: "india-post",
    re: /india post|postal assistant|gramin dak sevak|multi tasking staff|\bpostman\b/i,
  },
  { dept: "drdo", re: /\bdrdo\b|ceptam/i },
  { dept: "isro", re: /\bisro\b/i },
  { dept: "nvs", re: /\bnvs\b|navodaya/i },
  { dept: "kvs", re: /\bkvs\b|kendriya vidyalaya/i },
  { dept: "lic", re: /\blic\b|life insurance corporation/i },
  { dept: "fci", re: /\bfci\b|food corporation/i },
  { dept: "sbi", re: /\bsbi\b|state bank of india/i },
  { dept: "rbi", re: /\brbi\b|reserve bank of india/i },
  { dept: "nabard", re: /nabard/i },
  { dept: "sebi", re: /\bsebi\b/i },
  { dept: "esic", re: /\besic\b|employees.? state insurance/i },
  { dept: "epfo", re: /\bepfo\b|employees.? provident fund/i },
  { dept: "nda", re: /national defence academy|\bnda\b/i },

  // --- Tier 2 Bihar bodies ---
  { dept: "bihar-excise", re: /excise|prohibition (constable|staff)/i },
  { dept: "bihar-fireman", re: /fireman|fire fighter/i },
  { dept: "bihar-courts", re: /district court|high court/i },
  { dept: "bihar-vidhan-sabha", re: /vidhan sabha|legislature/i },
  { dept: "bihar-agriculture", re: /agriculture (field|officer)/i },
  { dept: "bihar-livestock", re: /livestock|animal (husbandry|fisheries)/i },
  { dept: "bihar-revenue", re: /\bamin\b|village revenue assistant|revenue assistant/i },
  { dept: "bihar-transport", re: /\bbsrtc\b|roadways|road transport/i },
  { dept: "bihar-cooperative", re: /cooperative bank/i },
  { dept: "bihar-gramin-bank", re: /gramin bank/i },
  { dept: "bihar-rural-development", re: /gram rozgar|rozgar sevak|\brdd\b/i },
  { dept: "bihar-anganwadi", re: /anganwadi|\bicds\b/i },
  { dept: "bihar-deled", re: /\bdeled\b|d\.el\.ed/i },
  { dept: "bihar-education", re: /education department|shiksha/i },
];

// State-only fallbacks: set the state slug but never guess the department.
const STATE_ONLY_RULES = [
  {
    state: "bihar",
    re: /\bbihar\b|\bpatna\b|\bmuzaffarpur\b|\bgaya\b|\bbhojpur\b|\bdarbhanga\b/i,
  },
];

function classify(job) {
  const text = `${job.title ?? ""} ${job.department ?? ""}`.trim();
  for (const rule of RULES) {
    if (rule.re.test(text)) {
      return {
        department_slug: rule.dept,
        state: DEPARTMENT_STATE[rule.dept] ?? null,
      };
    }
  }
  for (const rule of STATE_ONLY_RULES) {
    if (rule.re.test(text)) {
      return { department_slug: null, state: rule.state };
    }
  }
  return null;
}

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

const res = await fetch(
  `${URL_BASE}/rest/v1/jobs?select=id,slug,title,department,department_slug,state,is_published&order=created_at.desc&limit=1000`,
  { headers },
);
if (!res.ok) {
  console.error(`fetch jobs failed: HTTP ${res.status}`);
  process.exit(1);
}
const jobs = await res.json();

let changed = 0;
let unchanged = 0;
let unmatched = 0;
const updates = [];
const unmatchedRows = [];

for (const job of jobs) {
  const match = classify(job);
  const current = {
    department_slug: job.department_slug ?? null,
    state: job.state ?? null,
  };

  // A slug that is already valid only needs its state aligned.
  if (job.department_slug && isValidDepartmentSlug(job.department_slug)) {
    const implied = DEPARTMENT_STATE[job.department_slug] ?? null;
    if ((job.state ?? null) !== implied) {
      updates.push({
        id: job.id,
        slug: job.slug,
        title: job.title,
        from: current,
        to: { department_slug: job.department_slug, state: implied },
        reason: "align state to department",
      });
      changed++;
    } else {
      unchanged++;
    }
    continue;
  }

  if (!match) {
    unmatched++;
    unmatchedRows.push(job);
    continue;
  }

  // Only fill missing fields; never overwrite an existing value.
  const to = {
    department_slug: job.department_slug ?? match.department_slug,
    state: job.state ?? match.state,
  };
  if (to.department_slug === current.department_slug && to.state === current.state) {
    unchanged++;
    continue;
  }
  updates.push({
    id: job.id,
    slug: job.slug,
    title: job.title,
    from: current,
    to,
    reason: "backfill",
  });
  changed++;
}

console.log(`\nBackfill ${APPLY ? "APPLY" : "DRY RUN"}`);
console.log(`jobs scanned      : ${jobs.length}`);
console.log(`to update         : ${changed}`);
console.log(`already correct   : ${unchanged}`);
console.log(`no rule matched   : ${unmatched}\n`);

for (const u of updates) {
  console.log(`  ${u.slug}`);
  console.log(`    ${u.title}`);
  console.log(
    `    ${u.from.department_slug ?? "-"}/${u.from.state ?? "-"}  ->  ` +
      `${u.to.department_slug ?? "-"}/${u.to.state ?? "-"}  (${u.reason})`,
  );
}

if (unmatchedRows.length > 0) {
  console.log(`\nNo rule matched (left for manual fix in /admin/jobs):`);
  for (const j of unmatchedRows) {
    console.log(`  ${j.slug}  -  ${j.title}`);
  }
}

if (APPLY) {
  let ok = 0;
  let failed = 0;
  for (const u of updates) {
    const r = await fetch(`${URL_BASE}/rest/v1/jobs?id=eq.${u.id}`, {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify({
        department_slug: u.to.department_slug,
        state: u.to.state,
      }),
    });
    if (r.ok) {
      ok++;
    } else {
      failed++;
      console.error(`  FAILED ${u.slug}: HTTP ${r.status}`);
    }
  }
  console.log(`\nApplied: ${ok} updated, ${failed} failed.`);
} else {
  console.log(`\nRe-run with --apply to write these changes.`);
}