import type { Metadata } from "next";

import type { JobWithCategory } from "@/types/database";

import { SITE } from "./site.ts";

/**
 * schema.org builders. Every builder returns a plain object that JsonLd
 * serialises to JSON — no XSS vectors, no dangerouslySetInnerHTML outside the
 * raw script component.
 */

export type Breadcrumb = { name: string; path: string };

/* ------------------------------------------------------------------ */
/* Shared page metadata                                                */
/* ------------------------------------------------------------------ */

export const SEO_TITLE_MAX = 60;
export const SEO_DESCRIPTION_MIN = 140;
export const SEO_DESCRIPTION_MAX = 160;

const DESCRIPTION_FILLER =
  " Check eligibility, important dates, application fee and the official link before applying. Read the official notification for category-wise details and verify every date before you apply.";

/** Collapse whitespace and cap a title at 60 characters without cutting a word. */
export function clampSeoTitle(value: string): string {
  const title = value.replace(/\s+/g, " ").trim();
  if (title.length <= SEO_TITLE_MAX) return title;

  const hardCut = title.slice(0, SEO_TITLE_MAX - 1);
  const lastSpace = hardCut.lastIndexOf(" ");
  const wordCut = lastSpace >= 30 ? hardCut.slice(0, lastSpace) : hardCut;
  return `${wordCut.replace(/[\s—:,-]+$/, "")}…`;
}

/**
 * Keep descriptions inside the 140-160 character window. Short copy is padded
 * with a factual, site-wide instruction rather than invented vacancy detail.
 */
export function clampSeoDescription(value: string): string {
  let text = value.replace(/\s+/g, " ").trim();
  if (text.length < SEO_DESCRIPTION_MIN) text += DESCRIPTION_FILLER;

  if (text.length > SEO_DESCRIPTION_MAX) {
    const hardCut = text.slice(0, SEO_DESCRIPTION_MAX - 3);
    const lastSpace = hardCut.lastIndexOf(" ");
    const wordCut = lastSpace >= 100 ? hardCut.slice(0, lastSpace) : hardCut;
    text = `${wordCut.replace(/[\s,;:—]+$/, "")}…`;
  }

  return text;
}

export type SeoPageKind =
  | "job"
  | "admit-card"
  | "result"
  | "answer-key"
  | "exam"
  | "landing"
  | "page";

export type BuildMetaInput = {
  kind: SeoPageKind;
  title: string;
  description?: string | null;
  /** Site-relative path, e.g. `/jobs/bihar-jail-sepoy-2026`. */
  path: string;
  robots?: Metadata["robots"];
  publishedTime?: string;
  modifiedTime?: string;
  image?: string;
};

/**
 * The single metadata builder for content pages.
 *
 * Keyword-first titles are capped at 60 characters, descriptions at 140-160,
 * and every page gets a self-referencing canonical plus matching Open Graph and
 * Twitter cards. Page templates only supply the copy; this function owns the
 * shape.
 */
export function buildMeta({
  kind,
  title,
  description,
  path,
  robots,
  publishedTime,
  modifiedTime,
  image = "/opengraph-image",
}: BuildMetaInput): Metadata {
  const cleanTitle = clampSeoTitle(title);
  const cleanDescription = clampSeoDescription(description ?? "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const canonical = `${SITE.url.replace(/\/+$/, "")}${cleanPath}`;
  const ogType: "article" | "website" =
    kind === "landing" || kind === "page" ? "website" : "article";

  return {
    title: { absolute: cleanTitle },
    description: cleanDescription,
    alternates: { canonical },
    openGraph: {
      type: ogType,
      title: cleanTitle,
      description: cleanDescription,
      url: canonical,
      siteName: SITE.name,
      locale: SITE.locale,
      images: [image],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: cleanTitle,
      description: cleanDescription,
      images: [image],
    },
    ...(robots ? { robots } : {}),
  };
}

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
 * Generate FAQs from job data for schema.org FAQPage.
 */
export function jobFAQSchema(job: JobWithCategory, url: string) {
  const faqs = [
    {
      question: `Is ${job.title} ke liye age limit kya hai?`,
      answer: job.eligibility_age_min != null && job.eligibility_age_max != null
        ? `${job.eligibility_age_min} – ${job.eligibility_age_max} years. Category-wise age relaxation is as prescribed in the official advertisement.`
        : "Age limit is as per the official notification. Please check the official advertisement for category-wise age relaxation.",
    },
    {
      question: "Application fee kitni hai?",
      answer: job.application_fee && Object.keys(job.application_fee).length > 0
        ? `Application fee category-wise: ${Object.entries(job.application_fee).map(([k, v]) => `${k}: Rs ${v}`).join(", ")}. Confirm any exemption or concession in the official advertisement.`
        : "Application fee is as per the official notification. Category-wise details are available in the official advertisement.",
    },
    {
      question: `Apply karne ki last date kab hai?`,
      answer:
        job.status === "closed"
          ? `The application window for ${job.title} closed on ${new Date(job.application_end).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}.`
          : `Last date to apply for ${job.title} is ${new Date(job.application_end).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}. Apply before the deadline on the official website.`,
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
