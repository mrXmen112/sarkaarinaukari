import { SITE } from "./site.ts";
import { isoDatePlusDays } from "./date.ts";

/**
 * JobPosting JSON-LD for eligible recruitment pages only.
 *
 * Google's JobPosting guidance requires a real, currently open vacancy with a
 * verifiable hiring organisation and dates. A closed, upcoming, unverified,
 * non-job or figure-withheld row must NOT emit it — unlike Article/FAQPage,
 * JobPosting is a live job offer and a stale one is a policy violation.
 */
export type JobPostingSubject = {
  title: string;
  slug: string;
  department: string | null;
  state: string | null;
  short_description: string | null;
  eligibility_education: string | null;
  notice_number: string | null;
  vacancy_total: number | null;
  application_end: string;
  official_link: string;
  official_apply_url: string | null;
  apply_link_verified: boolean;
  verification_status: string;
  type: string;
  status: string;
  published_at: string | null;
  notification_date: string | null;
  created_at: string;
};

export function jobPostingSchema(
  job: JobPostingSubject,
  opts: { withheld?: boolean; today?: string } = {},
): Record<string, unknown> | null {
  const today = opts.today ?? isoDatePlusDays(0);
  if (
    job.verification_status !== "verified" ||
    job.type !== "job" ||
    job.status !== "active" ||
    job.application_end < today ||
    opts.withheld ||
    !/^https?:\/\//i.test(job.official_link) ||
    !Number.isFinite(Number(job.vacancy_total)) ||
    Number(job.vacancy_total) <= 0
  ) {
    return null;
  }

  const posted = job.published_at ?? job.notification_date ?? job.created_at;
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description:
      job.short_description ??
      `Government recruitment: ${job.title}. See the official notification for full details.`,
    datePosted: String(posted).slice(0, 10),
    validThrough: String(job.application_end).slice(0, 10),
    url: `${SITE.url.replace(/\/+$/, "")}/jobs/${job.slug}`,
    hiringOrganization: {
      "@type": "Organization",
      name: job.department || "Government of India",
    },
    totalJobOpenings: Number(job.vacancy_total),
  };

  if (job.state) {
    schema.jobLocation = {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressRegion: job.state },
    };
  }
  if (job.eligibility_education) {
    schema.educationRequirements = job.eligibility_education;
  }
  if (job.notice_number) {
    schema.identifier = {
      "@type": "PropertyValue",
      name: "Advertisement number",
      value: job.notice_number,
    };
  }
  if (job.apply_link_verified && job.official_apply_url) {
    schema.directApply = true;
    schema.applicationUrl = job.official_apply_url;
  }
  return schema;
}
