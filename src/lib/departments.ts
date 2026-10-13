/**
 * Controlled vocabulary for jobs.department_slug and jobs.state.
 *
 * Both fields drive the programmatic landing pages (Phase 3), so they must
 * stay stable slugs — never free text. The scraper prompt lists these exact
 * values so the LLM picks from the list instead of inventing slugs, and the
 * admin review form offers the same options.
 *
 * Mirrors BIHAR_ORG_PAGES slugs + the national recruiting bodies used by the
 * /jobs/category/* pages.
 */

/** National / central recruiting bodies (state = null). */
export const NATIONAL_DEPARTMENTS: { slug: string; label: string }[] = [
  { slug: "ssc", label: "Staff Selection Commission" },
  { slug: "upsc", label: "Union Public Service Commission" },
  { slug: "rrb", label: "Railway Recruitment Board" },
  { slug: "ibps", label: "Institute of Banking Personnel Selection" },
  { slug: "psu", label: "Public Sector Undertaking" },
  { slug: "defence", label: "Indian Army / Navy / Air Force" },
  { slug: "central-police", label: "Central Armed Police Forces" },
  { slug: "india-post", label: "India Post / Department of Posts" },
  { slug: "drdo", label: "DRDO" },
  { slug: "isro", label: "ISRO" },
  { slug: "nvs", label: "Navodaya Vidyalaya Samiti" },
  { slug: "kvs", label: "Kendriya Vidyalaya Sangathan" },
  { slug: "sbi", label: "State Bank of India" },
  { slug: "rbi", label: "Reserve Bank of India" },
  { slug: "nabard", label: "NABARD" },
  { slug: "lic", label: "Life Insurance Corporation" },
  { slug: "fci", label: "Food Corporation of India" },
  { slug: "sebi", label: "SEBI" },
  { slug: "esic", label: "ESIC" },
  { slug: "epfo", label: "EPFO" },
  { slug: "nda", label: "National Defence Academy" },
];

/** State recruiting bodies — slug must match jobs.state values. */
export const STATE_DEPARTMENTS: {
  slug: string;
  label: string;
  state: string;
}[] = [
  { slug: "bpsc", label: "Bihar Public Service Commission", state: "bihar" },
  { slug: "bssc", label: "Bihar Staff Selection Commission", state: "bihar" },
  { slug: "bihar-police", label: "Bihar Police (CSBC)", state: "bihar" },
  { slug: "bihar-tre", label: "Bihar Teacher Recruitment (TRE)", state: "bihar" },
  { slug: "bihar-health", label: "Bihar Health Department", state: "bihar" },
  { slug: "bihar-panchayat", label: "Bihar Panchayati Raj", state: "bihar" },
  { slug: "bihar-home-guard", label: "Bihar Home Guard / Civil Defence", state: "bihar" },
  { slug: "bihar-jal-nigam", label: "Bihar Jal Nigam / Jal Jeevan Mission", state: "bihar" },
  { slug: "uppsc", label: "Uttar Pradesh PSC", state: "uttar-pradesh" },
  { slug: "uppolice", label: "Uttar Pradesh Police (UPPBPB)", state: "uttar-pradesh" },
  { slug: "upsssc", label: "UPSSSC", state: "uttar-pradesh" },
  { slug: "mppsc", label: "Madhya Pradesh PSC", state: "madhya-pradesh" },
  { slug: "mppolice", label: "Madhya Pradesh Police", state: "madhya-pradesh" },
  { slug: "rpsc", label: "Rajasthan PSC", state: "rajasthan" },
  { slug: "rsmssb", label: "Rajasthan Staff Selection Board", state: "rajasthan" },
  { slug: "raj-police", label: "Rajasthan Police", state: "rajasthan" },
  { slug: "wbpsc", label: "West Bengal PSC", state: "west-bengal" },
  { slug: "wbpreb", label: "West Bengal Police (WBPREB)", state: "west-bengal" },
  { slug: "tnpsc", label: "Tamil Nadu PSC", state: "tamil-nadu" },
  { slug: "kpsc", label: "Karnataka PSC", state: "karnataka" },
  { slug: "gpsc", label: "Gujarat PSC", state: "gujarat" },
  { slug: "mpsc", label: "Maharashtra PSC", state: "maharashtra" },
  { slug: "ppsc", label: "Punjab PSC", state: "punjab" },
  { slug: "psssb", label: "Punjab Subordinate Services Selection Board", state: "punjab" },
  { slug: "hpsc", label: "Haryana PSC", state: "haryana" },
  { slug: "hssc", label: "Haryana Staff Selection Commission", state: "haryana" },
  { slug: "tgpsc", label: "Telangana PSC", state: "telangana" },
  { slug: "appsc", label: "Andhra Pradesh PSC", state: "andhra-pradesh" },
  { slug: "opsc", label: "Odisha PSC", state: "odisha" },
  { slug: "jpsc", label: "Jharkhand PSC", state: "jharkhand" },
  { slug: "cgpsc", label: "Chhattisgarh PSC", state: "chhattisgarh" },
  { slug: "kerala-psc", label: "Kerala PSC", state: "kerala" },
  { slug: "apsc", label: "Assam PSC", state: "assam" },
  { slug: "ukpsc", label: "Uttarakhand PSC", state: "uttarakhand" },
  { slug: "hppsc", label: "Himachal Pradesh PSC", state: "himachal-pradesh" },
  { slug: "jkssb", label: "J&K Subordinate Services Selection Board", state: "jammu-kashmir" },
  { slug: "dsssb", label: "Delhi DSSSB", state: "delhi" },
  { slug: "delhi-police", label: "Delhi Police", state: "delhi" },
  { slug: "bihar-excise", label: "Bihar Excise / Prohibition", state: "bihar" },
  { slug: "bihar-fireman", label: "Bihar Fire Service", state: "bihar" },
  { slug: "bihar-courts", label: "Bihar District Courts / High Court", state: "bihar" },
  { slug: "bihar-vidhan-sabha", label: "Bihar Vidhan Sabha", state: "bihar" },
  { slug: "bihar-agriculture", label: "Bihar Agriculture Department", state: "bihar" },
  { slug: "bihar-livestock", label: "Bihar Animal Husbandry", state: "bihar" },
  { slug: "bihar-revenue", label: "Bihar Revenue / Amin", state: "bihar" },
  { slug: "bihar-transport", label: "Bihar State Transport / Roadways", state: "bihar" },
  { slug: "bihar-cooperative", label: "Bihar State Cooperative Bank", state: "bihar" },
  { slug: "bihar-gramin-bank", label: "Bihar Gramin Banks", state: "bihar" },
  { slug: "bihar-rural-development", label: "Bihar Rural Development", state: "bihar" },
  { slug: "bihar-anganwadi", label: "Bihar ICDS / Anganwadi", state: "bihar" },
  { slug: "bihar-deled", label: "Bihar D.El.Ed / Education", state: "bihar" },
  { slug: "bihar-education", label: "Bihar Education Department", state: "bihar" },
];

export const ALL_DEPARTMENTS = [...NATIONAL_DEPARTMENTS, ...STATE_DEPARTMENTS];

const DEPARTMENT_SLUGS = new Set(ALL_DEPARTMENTS.map((d) => d.slug));

/** State slugs, matching VALUES in src/lib/site.ts STATES. */
export const STATE_SLUGS_FROM_DEPTS: string[] = [
  ...new Set(STATE_DEPARTMENTS.map((d) => d.state)),
];

export function isValidDepartmentSlug(slug: string): boolean {
  return DEPARTMENT_SLUGS.has(slug);
}

/** The state a department belongs to, or null for national bodies. */
export function stateForDepartment(slug: string): string | null {
  const dept = STATE_DEPARTMENTS.find((d) => d.slug === slug);
  return dept ? dept.state : null;
}

/** Comma-separated vocabulary for the LLM prompt. */
export function departmentVocabulary(): string {
  return ALL_DEPARTMENTS.map((d) => `${d.slug} (${d.label})`).join("; ");
}

export function stateVocabulary(): string {
  return STATE_SLUGS_FROM_DEPTS.join(", ");
}