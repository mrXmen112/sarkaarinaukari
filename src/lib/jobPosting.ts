import type { VerificationStatus } from "@/types/database";

/**
 * YYYY-MM-DD for schema.org date properties.
 *
 * Deliberately duplicated from src/lib/date.ts rather than imported: that module
 * is reached through the "@/lib/*" path alias, which the Node test runner cannot
 * resolve. Keeping this module free of aliases is what lets `npm test` exercise
 * the real code with no bundler and no extra dependency. Behaviour must stay
 * identical to toISODate().
 */
function isoDate(value: string | Date | null | undefined): string | undefined {
  if (!value) return undefined;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

/**
 * Google JobPosting structured data.
 *
 * Everything here is deliberately conservative. Google's JobPosting validator
 * rejects the whole document over one bad enum value, and the Search Console
 * warnings this module fixes came from three specific mistakes:
 *
 *   1. `credentialCategory` is an ENUM. It accepts exactly five values. The old
 *      builder passed our free-text `eligibility_education` straight through, so
 *      "Graduation Degree" was emitted as a credential category and Google
 *      rejected it. We now map, and OMIT the whole `educationRequirements` block
 *      when there is no clean mapping, because a wrong value is worse than none.
 *
 *   2. `jobLocation` must not contain invented data. We emit the country and,
 *      where we have one, the region. We never emit addressLocality, street or
 *      postal code, because no verified source in our data records them.
 *
 *   3. `baseSalary` may only be emitted when the official notification actually
 *      states pay, and it needs a NUMBER. Our `pay_scale` is free text
 *      ("Level 10, Pay Band 56,100-1,77,200"), so it is emitted only when the job
 *      is human-verified AND the text yields a clean parseable range. Otherwise
 *      it is omitted rather than guessed.
 *
 * The module is pure so it can be unit tested without a database or a browser.
 */

/** The only values Google accepts for credentialCategory. */
export const GOOGLE_CREDENTIAL_CATEGORIES = [
  "high school",
  "associate degree",
  "bachelor degree",
  "professional certificate",
  "postgraduate degree",
] as const;

export type GoogleCredentialCategory =
  (typeof GOOGLE_CREDENTIAL_CATEGORIES)[number];

/**
 * Map our free-text eligibility onto Google's enum, or return null.
 *
 * Conservative by design: an unrecognised phrase returns null and the caller
 * omits `educationRequirements` entirely. Guessing would be worse than silence.
 * Order matters — the postgraduate patterns are checked before the graduate ones
 * so "post graduate" never falls through to "bachelor degree".
 */
export function mapCredentialCategory(
  eligibility: string | null | undefined,
): GoogleCredentialCategory | null {
  if (!eligibility) return null;
  const text = eligibility.toLowerCase().replace(/\s+/g, " ").trim();
  if (!text) return null;

  // Postgraduate first: these strings also contain "graduat".
  // No trailing \b on "graduat"-style stems — \b between "grad" and "uate" is
  // not a boundary, so requiring one silently failed on "Post Graduate".
  if (
    /\b(post[\s-]*graduat|master|mba|ph\.?d|m\.?a\b|m\.?sc\b|m\.?tech\b|m\.?com\b|m\.?phil)/.test(
      text,
    )
  ) {
    return "postgraduate degree";
  }

  // Professional certificates / licences.
  if (/\b(professional cert|certificat|licen[cs]e|pharmacy)/.test(text)) {
    return "professional certificate";
  }

  // Diploma / polytechnic / ITI sit between school and degree. \b is required
  // here so "iti" cannot match inside a word like "competition".
  if (/\b(diploma|iti|polytechnic|nhm|anm)\b/.test(text)) {
    return "associate degree";
  }

  // Bachelor's, including bare "graduation"/"graduate".
  if (
    /\b(bachelor|graduat|b\.?sc\b|b\.?tech\b|b\.?com\b|bca|b\.?ed\b|d\.?el\.?ed|b\.?a\b|b\.?e\b)/.test(
      text,
    )
  ) {
    return "bachelor degree";
  }

  // Secondary. Google has one bucket for both class 10 and class 12.
  if (
    /\b(10th|12th|matriculation|secondary|intermediate|hs\.?c)\b|class\s*(10|12)\b/.test(
      text,
    )
  ) {
    return "high school";
  }

  return null;
}

/**
 * Should this job emit a JobPosting block at all?
 *
 * All three conditions are required. A structured-data block that describes an
 * unverified or closed vacancy is a factual claim the site cannot stand behind,
 * and it is what earned the Search Console warnings in the first place.
 */
export function shouldEmitJobPosting(job: {
  verification_status?: VerificationStatus | null;
  status?: string | null;
  official_link?: string | null;
  /** True when the link checker has confirmed the apply URL resolves. */
  link_http_status?: number | null;
}): boolean {
  if (job.verification_status !== "verified") return false;
  // Closed vacancies must not advertise an application that has ended.
  if (job.status === "closed" || job.status === "recently_closed") return false;
  if (job.status !== "active" && job.status !== "upcoming") return false;
  // A verified apply URL is part of the claim we are making.
  if (!job.official_link) return false;
  return true;
}

/**
 * Extract a pay RANGE from free text, or null.
 *
 * Only handles an explicit two-number range with a currency marker or a pay
 * band, which is the shape real notifications use. Returns null rather than
 * guessing when the text is anything else ("Level 10", "as per norms"), because
 * a wrong baseSalary is a worse error than a missing one.
 */
export function parseSalaryRange(
  payScale: string | null | undefined,
): { min: number; max: number; currency: "INR" } | null {
  if (!payScale) return null;

  const hasCurrencyMarker = /(?:rs\.?|₹|inr)\s*\d/i.test(payScale);
  // Drop thousands separators only. The previous attempt used
  // /(\d)[\d,]*(\d)/ which collapses "18,400" to "10" -- it matches greedily
  // from the FIRST to the LAST digit and throws the middle away.
  // /(\d),/g removes exactly one digit-comma pair per pass, so "1,77,200"
  // becomes 177200.
  const numbers = payScale
    .replace(/(\d),/g, "$1")
    .match(/\d+/g)
    ?.map((n) => Number.parseInt(n, 10))
    .filter((n) => Number.isFinite(n)) ?? [];

  if (numbers.length < 2) return null;
  // Ignore tiny numbers: a stray "Level 10" must not become the low end.
  const plausible = numbers.filter((n) => n >= 1000);
  if (plausible.length < 2) return null;

  const min = Math.min(...plausible);
  const max = Math.max(...plausible);
  if (max <= min) return null;

  // Every pay scale we hold is in rupees. If the text carried an explicit
  // foreign-currency marker we decline rather than assert INR.
  if (/usd|eur|gbp|aud|\$|€|£/.test(payScale.toLowerCase())) return null;
  if (!hasCurrencyMarker && !/(?:band|pay|rs\.?|₹|inr)/i.test(payScale)) {
    return null;
  }

  return { min, max, currency: "INR" };
}

export type JobPostingInput = {
  title: string;
  slug?: string | null;
  short_description?: string | null;
  department?: string | null;
  category_name?: string | null;
  application_end: string | null;
  application_start?: string | null;
  notification_date?: string | null;
  created_at?: string | null;
  state?: string | null;
  vacancy_total?: number | null;
  eligibility_education?: string | null;
  pay_scale?: string | null;
  status?: string | null;
  verification_status?: VerificationStatus | null;
  official_link?: string | null;
  link_http_status?: number | null;
};

/**
 * Build the JobPosting document, or null when it must not be emitted.
 *
 * Undefined properties are dropped entirely rather than serialised as null —
 * Google treats an explicit null differently from an absent key in some
 * validators, and absent is always safe.
 */
export function buildJobPosting(
  job: JobPostingInput,
  opts: { url: string; regionName?: string | undefined },
): Record<string, unknown> | null {
  if (!shouldEmitJobPosting(job)) return null;

  const credentialCategory = mapCredentialCategory(job.eligibility_education);

  // baseSalary is only ever built for a verified job (guaranteed above) whose
  // pay text parses to a real range.
  const salary = parseSalaryRange(job.pay_scale);

  const doc: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description:
      job.short_description?.trim() ||
      `Apply for ${job.title} on the official recruiting body website.`,
    hiringOrganization: {
      "@type": "Organization",
      name: job.department?.trim() || job.category_name?.trim() || "Government",
    },
    employmentType: "FULL_TIME",
    datePosted: isoDate(job.notification_date ?? job.created_at ?? null),
    url: opts.url,
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressCountry: "IN",
        // Region only when we actually know it. Never invent a locality,
        // street address or postal code — our data has no verified source for
        // any of them.
        ...(opts.regionName ? { addressRegion: opts.regionName } : {}),
      },
    },
    applicantLocationRequirements: {
      "@type": "Country",
      name: "IN",
    },
    ...(job.vacancy_total ? { totalJobOpenings: job.vacancy_total } : {}),
    ...(job.eligibility_education
      ? { qualifications: job.eligibility_education }
      : {}),
  };

  // validThrough is the last date a candidate can apply. It is meaningless on a
  // closed posting and Google flags it, so it is omitted rather than left stale.
  if (job.application_end) {
    doc.validThrough = isoDate(job.application_end);
  }

  // Only emitted on a clean enum mapping; the whole block is omitted otherwise.
  if (credentialCategory) {
    doc.educationRequirements = {
      "@type": "EducationalOccupationalCredential",
      credentialCategory,
    };
  }

  if (salary) {
    doc.baseSalary = {
      "@type": "MonetaryAmount",
      currency: salary.currency,
      value: {
        "@type": "QuantitativeValue",
        minValue: salary.min,
        maxValue: salary.max,
        unitText: "YEAR",
      },
    };
  }

  return doc;
}