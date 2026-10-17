import type { JobWithCategory } from "@/types/database";

import { SITE } from "@/lib/site";
import { buildJobPosting } from "@/lib/jobPosting";

/**
 * schema.org builders. Every builder returns a plain object that JsonLd
 * serialises to JSON — no XSS vectors, no dangerouslySetInnerHTML outside the
 * raw script component.
 */

/**
 * Resolve a state slug (e.g. "bihar") to its display name for schema.org
 * addressRegion. `STATE_NAMES` is declared later in this module; the lookup
 * only runs at call time, so the forward reference is safe.
 */
function stateName(code: string | null | undefined): string | undefined {
  if (!code) return undefined;
  return STATE_NAMES[code];
}

export type Breadcrumb = { name: string; path: string };

/**
 * Organization (Phase 2) — rendered once in the root layout. Honest
 * descriptor: an independent information portal, not a government body.
 */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    // Google requires a square raster logo of at least 512x512 for the
  // Organization rich result. The SVG is kept as an additional entry but is
  // not sufficient on its own.
  logo: `${SITE.url}/icon-512.png`,
  image: `${SITE.url}/icon-512.png`,
    description:
      "Sarkari Naukri, Admit Card, Result & Yojana information portal — an independent government-job listings website.",
    email: SITE.contactEmail,
    sameAs: (process.env.SITE_SAME_AS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    knowsAbout: [
      "Sarkari Naukri",
      "Government Jobs",
      "Bihar Public Service Commission",
      "Staff Selection Commission",
      "Admit Card",
      "Sarkari Result",
      "Sarkari Yojana",
    ],
  };
}

/**
 * WebSite + SearchAction (Phase 2) — powers the sitelinks search box once
 * the property is verified in Search Console. The search target matches the
 * /jobs listing's ?q= parameter.
 */
export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    inLanguage: "en-IN",
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE.url}/jobs?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** BreadcrumbList — site root to the current page. */
export function breadcrumbSchema(crumbs: Breadcrumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE.url,
      },
      ...crumbs.map((c, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: c.name,
        item: `${SITE.url}${c.path}`,
      })),
    ],
  };
}

/**
 * Article (Section 5) — used on exam-update detail pages (admit card, result,
 * answer key). Headline + publish date give search engines a dateline.
 */
export function articleSchema({
  headline,
  description,
  datePublished,
  dateModified,
  url,
}: {
  headline: string;
  description?: string;
  datePublished?: string;
  dateModified?: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    datePublished,
    dateModified: dateModified ?? datePublished,
    inLanguage: "en-IN",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: { "@type": "Organization", name: SITE.name },
    publisher: { "@type": "Organization", name: SITE.name },
  };
}

/**
 * JobPosting (Section 5 — required on every job detail page).
 * Dates are ISO; `application_end` drives validThrough.
 */
export function jobPostingSchema(job: JobWithCategory, url: string) {
  // Part C: the real builder lives in src/lib/jobPosting.ts so it can be unit
  // tested without a database. This wrapper only adapts the row shape.
  return buildJobPosting(
    {
      title: job.title,
      short_description: job.short_description,
      department: job.department,
      category_name: job.job_categories?.name,
      application_end: job.application_end,
      application_start: job.application_start,
      notification_date: job.notification_date,
      created_at: job.created_at,
      state: job.state,
      vacancy_total: job.vacancy_total,
      eligibility_education: job.eligibility_education,
      pay_scale: job.pay_scale,
      status: job.status,
      verification_status: job.verification_status,
      official_link: job.official_link,
      link_http_status: job.link_http_status,
    },
    { url, regionName: stateName(job.state) },
  );
}

/**
 * Generate FAQs from job data for schema.org FAQPage.
 */
export function jobFAQSchema(job: JobWithCategory, url: string) {
  const faqs = [
    {
      question: `Is ${job.title} ke liye age limit kya hai?`,
      answer: job.eligibility_age_min != null && job.eligibility_age_max != null
        ? `${job.eligibility_age_min} – ${job.eligibility_age_max} years. Age relaxation is available for SC/ST, OBC, EWS, and PwBD categories as per government norms.`
        : "Age limit is as per the official notification. Please check the official advertisement for category-wise age relaxation.",
    },
    {
      question: "Application fee kitni hai?",
      answer: job.application_fee && Object.keys(job.application_fee).length > 0
        ? `Application fee category-wise: ${Object.entries(job.application_fee).map(([k, v]) => `${k}: Rs ${v}`).join(", ")}. SC/ST/PwBD candidates are usually exempt.`
        : "Application fee is as per the official notification. Category-wise details are available in the official advertisement.",
    },
    {
      question: `Apply karne ki last date kab hai?`,
      answer: `Last date to apply for ${job.title} is ${new Date(job.application_end).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}. Apply before the deadline on the official website.`,
    },
    {
      question: "Selection process kya hai?",
      answer: job.selection_process && job.selection_process.length > 0
        ? `Selection process: ${job.selection_process.join(" → ")}. Final selection is based on merit and document verification.`
        : "Selection process is as per the official notification. Please verify stages in the official advertisement.",
    },
    {
      question: "Eligibility criteria kya hai?",
      answer: job.eligibility_education
        ? `Eligibility: ${job.eligibility_education}. Age and category requirements are mentioned in the official notification.`
        : "Eligibility criteria are as per the official notification. Please check the official advertisement for detailed requirements.",
    },
  ];

  return faqSchema({ faqs, url, headline: job.title });
}

/**
 * FAQPage (Section 5) — used on exam detail pages. One Question + Answer
 * entity per FAQ; builds an expandable rich-result in Google Search.
 */
export function faqSchema({
  faqs,
  url,
  headline,
}: {
  faqs: { question: string; answer: string }[];
  url: string;
  headline: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    headline,
    inLanguage: "en-IN",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
}

const STATE_NAMES: Record<string, string> = {
  bihar: "Bihar",
  "uttar-pradesh": "Uttar Pradesh",
  delhi: "Delhi",
  jharkhand: "Jharkhand",
  "madhya-pradesh": "Madhya Pradesh",
};
