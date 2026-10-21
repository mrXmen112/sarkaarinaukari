/**
 * Central site configuration. Single source of truth for branding, nav,
 * and the legal disclaimer required on every page (Section 6).
 */

export const SITE = {
  name: "Sarkaarinaukri.online",
  shortName: "SarkaariNaukri",
  tagline: "Sarkari Naukri, Admit Card, Result & Yojana Information Portal",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sarkaarinaukri.online",
  locale: "en_IN",
  contactEmail: "wahid1874254@gmail.com",
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

/** Primary header navigation. `labelHi` renders in the Hindi UI (Phase 4F). */
export const PRIMARY_NAV: (NavItem & { labelHi?: string })[] = [
  { label: "Home", labelHi: "होम", href: "/" },
  { label: "Latest Jobs", labelHi: "नवीनतम जॉब", href: "/jobs" },
  { label: "Bihar Jobs", labelHi: "बिहार जॉब", href: "/bihar" },
  { label: "Admit Card", labelHi: "एडमिट कार्ड", href: "/admit-card" },
  { label: "Result", labelHi: "रिजल्ट", href: "/result" },
  { label: "Answer Key", labelHi: "आंसर की", href: "/answer-key" },
  { label: "Yojana", labelHi: "योजना", href: "/yojana" },
  { label: "Exams", labelHi: "परीक्षा", href: "/exams" },
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
  { label: "Bihar 12th Pass Jobs", href: "/bihar/12th-pass-jobs", hint: "Intermediate-level posts" },
];

/**
 * Homepage "Trending in Bihar" rail. Only pages that already exist and have
 * published data are listed here — this is an internal-link surface, not a
 * promise that a recruitment is open.
 */
export const TRENDING_LINKS: NavItem[] = [
  { label: "Bihar 12th Pass Jobs", href: "/bihar/12th-pass-jobs" },
  { label: "Bihar Police Jobs", href: "/bihar/bihar-police" },
  { label: "Bihar Home Guard", href: "/bihar/bihar-home-guard" },
  { label: "Bihar SSC Jobs", href: "/bihar/bssc" },
  { label: "BPSC 70th Exam", href: "/exams/bpsc-70th" },
  { label: "Bihar TRE Jobs", href: "/bihar/bihar-tre" },
  { label: "All Bihar Jobs", href: "/bihar" },
];

/** Footer link columns. `labelHi`/`headingHi` render in the Hindi UI. */
export const FOOTER_NAV: {
  heading: string;
  headingHi?: string;
  items: (NavItem & { labelHi?: string })[];
}[] = [
  {
    heading: "Jobs",
    headingHi: "जॉब",
    items: [
      { label: "All Jobs", labelHi: "सभी जॉब", href: "/jobs" },
      // These two used to be /jobs?category=central and /jobs?category=state.
      // Filter URLs are Disallow'd in robots.txt and canonicalise to /jobs, so
      // linking them from the footer fed Google a blocked-URL report for pages
      // it was told not to crawl. They now point at real indexable category
      // landing pages instead.
      { label: "Railway Jobs", labelHi: "रेलवे जॉब", href: "/jobs/category/railway" },
      { label: "Banking Jobs", labelHi: "बैंकिंग जॉब", href: "/jobs/category/banking" },
      { label: "Bihar Jobs", labelHi: "बिहार जॉब", href: "/bihar" },
      { label: "10th Pass Jobs", labelHi: "10th पास जॉब", href: "/jobs/10th-pass" },
      { label: "12th Pass Jobs", labelHi: "12th पास जॉब", href: "/jobs/12th-pass" },
      { label: "Bihar 12th Pass Jobs", href: "/bihar/12th-pass-jobs" },
      { label: "Graduate Jobs", labelHi: "ग्रेजुएट जॉब", href: "/jobs/graduate" },
    ],
  },
  {
    heading: "Exam Updates",
    headingHi: "परीक्षा अपडेट",
    items: [
      { label: "Admit Card", labelHi: "एडमिट कार्ड", href: "/admit-card" },
      { label: "Result", labelHi: "रिजल्ट", href: "/result" },
      { label: "Class 10 Result", labelHi: "कक्षा 10 रिजल्ट", href: "/result/10th" },
      { label: "Class 12 Result", labelHi: "कक्षा 12 रिजल्ट", href: "/result/12th" },
      { label: "Answer Key", labelHi: "आंसर की", href: "/answer-key" },
      {
        label: "Current Affairs",
        labelHi: "करेंट अफेयर्स",
        href: "/current-affairs",
      },
    ],
  },
  {
    heading: "Preparation",
    headingHi: "तैयारी",
    items: [
      {
        label: "Competitive Exams",
        labelHi: "प्रतियोगी परीक्षा",
        href: "/exams",
      },
      {
        label: "Quiz & Mock Tests",
        labelHi: "क्विज़ और मॉक टेस्ट",
        href: "/quiz",
      },
      { label: "Sarkari Yojana", labelHi: "सरकारी योजना", href: "/yojana" },
      { label: "My Dashboard", labelHi: "मेरा डैशबोर्ड", href: "/profile" },
    ],
  },
  {
    heading: "Information",
    headingHi: "जानकारी",
    items: [
      { label: "About Us", labelHi: "हमारे बारे में", href: "/about" },
      { label: "Contact", labelHi: "संपर्क", href: "/contact" },
      { label: "Privacy Policy", labelHi: "गोपनीयता नीति", href: "/privacy" },
      { label: "Terms of Use", labelHi: "उपयोग की शर्तें", href: "/terms" },
      { label: "Disclaimer", labelHi: "अस्वीकरण", href: "/disclaimer" },
      {
        label: "Editorial & Data Policy",
        labelHi: "संपादकीय नीति",
        href: "/editorial-policy",
      },
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

/**
 * W5.8 — how many live verified jobs the homepage must have before its "Latest
 * Government Jobs" table stands on its own. Below this the page also surfaces
 * admit cards, results, answer keys, exam hubs and result-checking guides, so a
 * thin job list never leaves the homepage looking empty.
 */
export const HOMEPAGE_TARGET_JOBS = 10;
