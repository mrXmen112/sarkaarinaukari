/**
 * Central site configuration. Single source of truth for branding, nav,
 * and the legal disclaimer required on every page (Section 6).
 */

export const SITE = {
  name: "Sarkaarinaukri.online",
  shortName: "SarkaariNaukari",
  tagline: "Sarkari Naukri, Admit Card, Result & Yojana Information Portal",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://sarkaarinaukri.online",
  locale: "en_IN",
  contactEmail: "contact@sarkaarinaukri.online",
} as const;

/**
 * Mandatory footer disclaimer — verbatim from Section 6.
 * Do not reword without checking the compliance requirement.
 */
export const DISCLAIMER =
  "Sarkaarinaukri.online is an independent, privately-run information portal. " +
  "We are not affiliated with, endorsed by, or officially connected to the " +
  "Government of India or the Government of Bihar. All information is compiled " +
  "from publicly available official sources; please verify details on the " +
  "respective official websites before applying.";

export type NavItem = { label: string; href: string };

/** Primary header navigation. */
export const PRIMARY_NAV: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Latest Jobs", href: "/jobs" },
  { label: "Bihar Jobs", href: "/bihar" },
  { label: "Admit Card", href: "/admit-card" },
  { label: "Result", href: "/result" },
  { label: "Answer Key", href: "/answer-key" },
  { label: "Yojana", href: "/yojana" },
  { label: "Exams", href: "/exams" },
];

/** Homepage quick-links grid (Section 1). */
export const QUICK_LINKS: { label: string; href: string; hint: string }[] = [
  { label: "Latest Jobs", href: "/jobs", hint: "All active vacancies" },
  { label: "Bihar Jobs", href: "/bihar", hint: "BPSC, BSSC, Police, TRE" },
  { label: "Admit Card", href: "/admit-card", hint: "Hall tickets released" },
  { label: "Result", href: "/result", hint: "Results & merit lists" },
  { label: "Answer Key", href: "/answer-key", hint: "Provisional & final" },
  { label: "Syllabus", href: "/exams", hint: "Exam-wise syllabus" },
  { label: "Sarkari Yojana", href: "/yojana", hint: "Government schemes" },
  { label: "Competitive Exams", href: "/exams", hint: "Prep & strategy" },
];

/** Footer link columns. */
export const FOOTER_NAV: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Jobs",
    items: [
      { label: "All Jobs", href: "/jobs" },
      { label: "Central Government", href: "/jobs?category=central" },
      { label: "State Government", href: "/jobs?category=state" },
      { label: "Bihar Jobs", href: "/bihar" },
    ],
  },
  {
    heading: "Exam Updates",
    items: [
      { label: "Admit Card", href: "/admit-card" },
      { label: "Result", href: "/result" },
      { label: "Answer Key", href: "/answer-key" },
      { label: "Current Affairs", href: "/current-affairs" },
    ],
  },
  {
    heading: "Preparation",
    items: [
      { label: "Competitive Exams", href: "/exams" },
      { label: "Quiz & Mock Tests", href: "/quiz" },
      { label: "Sarkari Yojana", href: "/yojana" },
      { label: "My Dashboard", href: "/profile" },
    ],
  },
  {
    heading: "Information",
    items: [
      { label: "About Us", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Use", href: "/terms" },
      { label: "Disclaimer", href: "/disclaimer" },
    ],
  },
];

/** Bihar hub department chips (Section 4.7). Key matches jobs.department_slug. */
export const BIHAR_DEPARTMENTS: { slug: string; label: string; hint?: string }[] = [
  { slug: "bpsc", label: "BPSC", hint: "Civil services" },
  { slug: "bihar-police", label: "Bihar Police", hint: "Constable & SI" },
  { slug: "bssc", label: "BSSC", hint: "Staff selection" },
  { slug: "bihar-tre", label: "Bihar TRE", hint: "Teachers" },
  { slug: "bihar-health", label: "Health Dept", hint: "Nursing & paramedical" },
  { slug: "bihar-panchayat", label: "Panchayati Raj", hint: "Gram Kachahari" },
];

/** Bihar hub quick links (Section 4.7). */
export const BIHAR_QUICK_LINKS: NavItem[] = BIHAR_DEPARTMENTS.map((d) => ({
  label: d.label,
  href: `/bihar?department=${d.slug}`,
}));

/** Indian states/UTs, used by filters and the profile form. */
export const STATES: { label: string; value: string }[] = [
  { label: "Andhra Pradesh", value: "andhra-pradesh" },
  { label: "Arunachal Pradesh", value: "arunachal-pradesh" },
  { label: "Assam", value: "assam" },
  { label: "Bihar", value: "bihar" },
  { label: "Chhattisgarh", value: "chhattisgarh" },
  { label: "Delhi", value: "delhi" },
  { label: "Goa", value: "goa" },
  { label: "Gujarat", value: "gujarat" },
  { label: "Haryana", value: "haryana" },
  { label: "Himachal Pradesh", value: "himachal-pradesh" },
  { label: "Jammu & Kashmir", value: "jammu-kashmir" },
  { label: "Jharkhand", value: "jharkhand" },
  { label: "Karnataka", value: "karnataka" },
  { label: "Kerala", value: "kerala" },
  { label: "Madhya Pradesh", value: "madhya-pradesh" },
  { label: "Maharashtra", value: "maharashtra" },
  { label: "Manipur", value: "manipur" },
  { label: "Meghalaya", value: "meghalaya" },
  { label: "Mizoram", value: "mizoram" },
  { label: "Nagaland", value: "nagaland" },
  { label: "Odisha", value: "odisha" },
  { label: "Punjab", value: "punjab" },
  { label: "Rajasthan", value: "rajasthan" },
  { label: "Sikkim", value: "sikkim" },
  { label: "Tamil Nadu", value: "tamil-nadu" },
  { label: "Telangana", value: "telangana" },
  { label: "Tripura", value: "tripura" },
  { label: "Uttar Pradesh", value: "uttar-pradesh" },
  { label: "Uttarakhand", value: "uttarakhand" },
  { label: "West Bengal", value: "west-bengal" },
];

/** Qualification levels, used by filters and the profile form. */
export const QUALIFICATIONS: { label: string; value: string }[] = [
  { label: "10th Pass", value: "10th" },
  { label: "12th Pass", value: "12th" },
  { label: "ITI / Diploma", value: "diploma" },
  { label: "Graduate", value: "graduate" },
  { label: "Post Graduate", value: "post-graduate" },
  { label: "B.Ed / D.El.Ed", value: "bed" },
  { label: "Engineering (B.E/B.Tech)", value: "engineering" },
  { label: "Medical (MBBS/BDS/Nursing)", value: "medical" },
  { label: "Law (LLB)", value: "law" },
  { label: "Any Degree", value: "any" },
];

export const SOCIAL_CATEGORIES: { label: string; value: string }[] = [
  { label: "General / UR", value: "general" },
  { label: "OBC", value: "obc" },
  { label: "SC", value: "sc" },
  { label: "ST", value: "st" },
  { label: "EWS", value: "ews" },
];

export const JOB_STATUSES: { label: string; value: string }[] = [
  { label: "Active", value: "active" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Closed", value: "closed" },
  { label: "Recently Closed", value: "recently_closed" },
];

/** Revalidation windows (seconds) — see Section 5, ISR requirement. */
export const REVALIDATE = {
  /** Listings change most often. */
  listing: 60 * 30, // 30 min
  /** Detail pages: a few hours. */
  detail: 60 * 60 * 3, // 3 hours
  /** Evergreen prep content. */
  evergreen: 60 * 60 * 24, // 24 hours
} as const;

/** Rows per page on listings (pagination, not infinite scroll — SEO). */
export const PAGE_SIZE = 25;
