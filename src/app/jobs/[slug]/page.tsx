import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CountdownBadge } from "@/components/ui/CountdownBadge";
import { DetailTable } from "@/components/ui/DataTable";
import { JsonLd } from "@/components/ui/JsonLd";
import { PageContainer, Panel } from "@/components/layout/PageContainer";
import { JobActions } from "@/components/jobs/JobActions";
import { JobTable } from "@/components/jobs/JobTable";
import { ApplyButton } from "@/components/jobs/ApplyButton";
import { RecruitmentTimeline } from "@/components/jobs/RecruitmentTimeline";
import { AdSlot } from "@/components/ads/AdSlot";
import { T } from "@/components/i18n/T";

/** AdSense slot id for the in-content unit on job detail pages. */
const JOB_PAGE_IN_CONTENT_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_JOB ?? "";
import { hasBrokenLink } from "@/lib/url";
import { formatDate } from "@/lib/date";
import { resolveSlug } from "@/lib/slugRedirects";
import { robotsFor } from "@/lib/indexable";
import { CATEGORY_PAGES_BY_SLUG } from "@/lib/landingPages";
import { STATE_SLUGS } from "@/lib/landingPagesState";
import { categoryLabel as fmtCategoryLabel, formatIndianNumber, formatRupees, truncate } from "@/lib/utils";
import {
  getAllJobSlugs,
  getJobBySlug,
  getJobTimeline,
  getRelatedJobs,
  stateLabel,
} from "@/lib/queries";
import { breadcrumbSchema, jobPostingSchema, jobFAQSchema } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { FAQSection } from "@/components/ui/FAQSection";
import { ShareButtons } from "@/components/ui/ShareButtons";

export const revalidate = 10800; // 3 hours — job detail pages

export async function generateStaticParams() {
  const slugs = await getAllJobSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/jobs/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJobBySlug(slug);

  if (!job) return { title: "Job Not Found" };

  const end = new Date(job.application_end);
  const year = end.getUTCFullYear();
  const lastDateShort = end.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

  // Titles like "Bihar Home Guard 2026" must not become "...2026 2026".
  const cleanedTitle = job.title.replace(/\s+20\d{2}\s*$/, "").trim() || job.title;

  const vacancyPart = job.vacancy_total
    ? `${formatIndianNumber(job.vacancy_total)} Posts, `
    : "";

  const title =
    job.status === "closed"
      ? `${cleanedTitle} ${year} — Application Closed, Details & Notification`
      : `${cleanedTitle} ${year}: ${vacancyPart}Last Date ${lastDateShort}, Apply Online`;

  const vacancySentence = job.vacancy_total
    ? `${formatIndianNumber(job.vacancy_total)} vacancies.`
    : "";
  const educationSentence = job.eligibility_education
    ? ` Eligibility: ${job.eligibility_education}.`
    : "";
  const description = truncate(
    `${job.title}: ${vacancySentence} Last date ${formatDate(job.application_end)}.${educationSentence} Application fee, selection process, official notification PDF and apply link.`,
    158,
  );

  return {
    // Absolute: these long, keyword-aware titles should not also carry the
    // "%s | SarkaariNaukri" suffix from the root layout template.
    title: { absolute: title },
    description,
    alternates: { canonical: `/jobs/${slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `${SITE.url}/jobs/${slug}`,
      publishedTime: job.notification_date ?? undefined,
      modifiedTime: job.updated_at ?? undefined,
      images: ["/opengraph-image"],
    },
    // Phase 8A: a job nobody has checked against the official notification is
    // kept out of the index once NEXT_PUBLIC_VERIFICATION_GATE=on. Until then it
    // behaves exactly as it did before Phase 8A. This is the SAME function the
    // sitemap uses (src/app/sitemap.ts), which is why it must not be computed
    // here from verification_status directly — that produced 124 pages which the
    // sitemap advertised while their own robots tag said noindex.
    robots: robotsFor({
      kind: "job",
      verificationStatus: job.verification_status,
      isPublished: job.is_published,
    }),
  };
}

/**
 * Job detail page. Sections follow Section 4.2 of the PRD in exact order.
 * Statically generated per job and revalidated — never client-side fetched.
 */
export default async function JobDetailPage({ params }: PageProps<"/jobs/[slug]">) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) {
    // A slug that no longer resolves may still be a URL Google already knows.
    // Resolving it here keeps those old links out of the 404 report instead of
    // discarding whatever ranking they had. If nothing matches, this falls
    // through to the real 404 -- there is no catch-all route and no soft 404.
    const resolution = await resolveSlug(slug);
    if (resolution?.kind === "redirect") {
      permanentRedirect(resolution.to);
    }
    // A "gone" row marks a permanently withdrawn slug. It currently surfaces as
    // 404, because the App Router has no page primitive that sets 410 — a page
    // returns HTML with an implicit 200/404, and permanentRedirect only emits
    // 308. Serving a real 410 needs a Route Handler or a proxy rule, which
    // would put a lookup on every job request. No "gone" rows are seeded, so
    // this branch is dormant; 404 is still the correct "do not index" answer.
    notFound();
  }

  const related = await getRelatedJobs(job, 6);
  const timeline = await getJobTimeline(job.id);
  const url = `${SITE.url}/jobs/${job.slug}`;

  // Phase 8A — a bulk-seeded job we have not yet matched to an official
  // notification. It renders, but it is clearly labelled and carries no
  // JobPosting structured data, because we cannot stand behind the claims yet.
  const verified = job.verification_status === "verified";

  const breadcrumbs = [
    { name: "Latest Jobs", path: "/jobs" },
    ...(job.job_categories?.slug
      ? [
          {
            name: job.job_categories.name,
            // Prefer the indexable category landing page. Only ssc/railway/
            // banking/defence/police/teaching/psu have one, so anything else
            // falls back to /jobs rather than linking a blocked ?category= URL.
            path: CATEGORY_PAGES_BY_SLUG[job.job_categories.slug]
              ? `/jobs/category/${job.job_categories.slug}`
              : "/jobs",
          },
        ]
      : []),
    ...(job.state
      ? [
          {
            name: stateLabel(job.state),
            // Same reasoning: /jobs/state/<slug> is indexable, ?state= is not.
            path: STATE_SLUGS.includes(job.state)
              ? `/jobs/state/${job.state}`
              : "/jobs",
          },
        ]
      : []),
    { name: job.title, path: `/jobs/${job.slug}` },
  ];

  return (
      <PageContainer>
      {verified ? <JsonLd data={jobPostingSchema(job, url)} /> : null}
      <JsonLd
        data={jobFAQSchema(job, url)}
      />
      <JsonLd
        data={breadcrumbSchema(breadcrumbs.filter((b) => b.name !== job.title))}
      />

      <Breadcrumbs
        items={[
          { label: "Latest Jobs", href: "/jobs" },
          { label: job.title },
        ]}
      />

      <ShareButtons title={job.title} url={url} />

      {/* Phase 8A — "Details being verified" banner */}
      {!verified ? (
        <div
          role="status"
          className="mb-4 rounded-sm border-2 border-alert bg-alert-bg px-4 py-3"
        >
          <p className="text-sm font-bold text-alert">
            <span className="lang-en">Details being verified</span>
            <span className="lang-hi">विवरण सत्यापित किया जा रहा है</span>
          </p>
          <p className="mt-1 text-xs text-navy">
            <span className="lang-en">
              This listing has not yet been matched to a confirmed official
              notification, so the dates and vacancy figures shown here may be
              out of date. Please confirm everything on the recruiting body&apos;s
              own website before applying.
            </span>
            <span className="lang-hi">
              यह सूची अभी आधिकारिक अधिसूचना से मिलाई नहीं गई है, इसलिए यहाँ दी गई तारीखें
              और पदों की संख्या पुरानी हो सकती हैं। आवेदन से पहले कृपया संबंधित
              संस्थान की आधिकारिक वेबसाइट से सब कुछ जाँच लें।
            </span>
          </p>
        </div>
      ) : null}

      {/* Section 1 — Title + Last Date countdown (top-right) */}
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b-2 border-navy pb-3">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl">{job.title}</h1>
          {job.status === "closed" ? (
            <p className="mt-1.5 inline-block rounded-sm bg-alert-bg px-2 py-0.5 text-xs font-bold text-alert">
              <span className="lang-en">
                This vacancy has closed — next notification may be forthcoming.
              </span>
              <span className="lang-hi">
                यह भर्ती बंद हो चुकी है — अगली सूचना जल्द आ सकती है।
              </span>
            </p>
          ) : null}
          <div className="mt-2">
            <JobActions jobId={job.id} />
          </div>
        </div>
        <div className="shrink-0">
          <CountdownBadge date={job.application_end} />
        </div>
      </header>

      {/* Section 2 — Overview */}
      <Panel title={<T k="postOverview" />} className="mb-4">
        <DetailTable
          caption="Post overview details"
          rows={[
            { label: "Post Name", value: job.title },
            { label: "Department", value: job.department ?? "—" },
            {
              label: "Category",
              value:
                job.job_categories?.name ??
                (job.state ? stateLabel(job.state) : "—"),
            },
            {
              label: <T k="totalVacancy" />,
              value: formatIndianNumber(job.vacancy_total),
            },
            {
              label: "Application Dates",
              value: `${formatDate(job.application_start)} to <strong>${formatDate(job.application_end)}</strong>`,
            },
            { label: <T k="examDate" />, value: job.exam_date ? formatDate(job.exam_date) : "To be announced" },
            { label: <T k="payScale" />, value: job.pay_scale ?? "—" },
            {
              label: <T k="lastUpdated" />,
              value: formatDate(job.updated_at ?? job.created_at),
            },
          ]}
        />
      </Panel>

      {/* Section 2b — Quick summary + sticky Apply (Phase 4D/4E) */}
      <section aria-labelledby="quick-summary" className="gov-panel mb-4">
        <div className="gov-panel-title" id="quick-summary">
          Quick Summary
        </div>
        <div className="p-3">
          <DetailTable
            caption="Quick summary of this vacancy"
            rows={[
              { label: <T k="post" />, value: job.title },
              {
                label: <T k="totalVacancy" />,
                value: job.vacancy_total
                  ? formatIndianNumber(job.vacancy_total)
                  : <T k="notNotified" />,
              },
              {
                label: <T k="lastDate" />,
                value: `${formatDate(job.application_end)}${
                  job.status === "closed" ? " (closed)" : ""
                }`,
              },
              {
                label: <T k="applicationFeeLabel" />,
                value:
                  job.application_fee &&
                  Object.keys(job.application_fee).length > 0
                    ? `${fmtCategoryLabel("general")}: ${formatRupees(
                        (job.application_fee as Record<string, number>).general,
                      )}`
                    : <T k="notNotified" />,
              },
              {
                label: <T k="applyMode" />,
                value: "Online — official website only",
              },
              {
                label: <T k="ageLimit" />,
                value:
                  job.eligibility_age_min == null && job.eligibility_age_max == null
                    ? <T k="asPerNotification" />
                    : `${job.eligibility_age_min ?? "—"}–${job.eligibility_age_max ?? "—"} years`,
              },
            ]}
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {job.status === "closed" ? (
              <span className="inline-block rounded-sm bg-alert-bg px-3 py-2 text-sm font-bold text-alert">
                <T k="applicationsClosed" />
              </span>
            ) : job.link_flagged ? (
              <span className="inline-block rounded-sm border border-alert px-3 py-2 text-sm font-bold text-alert">
                <T k="applyLinkUnderVerification" />
              </span>
            ) : (
              <ApplyButton href={job.official_link} title={job.title} />
            )}
          </div>
        </div>
      </section>

      {/* Recruitment lifecycle — notification through result (Phase 1) */}
      <RecruitmentTimeline job={job} timeline={timeline} />

      {/* In-content ad: placed after the summary block and before eligibility, so
          it never sits between a post name and its Apply button. */}
      <AdSlot slot={JOB_PAGE_IN_CONTENT_SLOT} />

      {/* Section 3 — Eligibility */}
      <Panel title={<T k="eligibilityCriteria" />} className="mb-4">
        <div className="space-y-3 text-sm">
          <p>
            <span className="font-semibold text-navy">Education: </span>
            {job.eligibility_education ?? "As per official notification"}
          </p>
          <p>
            <span className="font-semibold text-navy">Age Limit: </span>
            {job.eligibility_age_min == null && job.eligibility_age_max == null
              ? "As per official notification"
              : `${job.eligibility_age_min ?? "—"} – ${job.eligibility_age_max ?? "—"} years (as on ${formatDate(job.notification_date ?? job.created_at)})`}
          </p>

          {job.age_relaxation && Object.keys(job.age_relaxation).length > 0 ? (
            <div>
              <AgeRelaxationTable data={job.age_relaxation} />
            </div>
          ) : null}
        </div>
      </Panel>

      {/* Section 4 — Application Fee */}
      {job.application_fee && Object.keys(job.application_fee).length > 0 ? (
        <Panel title={<T k="applicationFee" />} className="mb-4">
          <CategoryValueTable
            caption="Category-wise application fee"
            data={job.application_fee}
            format={(v) => formatRupees(v)}
          />
        </Panel>
      ) : null}

      {/* Section 5 — Vacancy Breakdown */}
      {job.vacancy_breakdown && Object.keys(job.vacancy_breakdown).length > 0 ? (
        <Panel title="Vacancy Details (Category-wise)" className="mb-4">
          <CategoryValueTable
            caption="Category-wise vacancy distribution"
            data={job.vacancy_breakdown}
            format={(v) => formatIndianNumber(v)}
          />
        </Panel>
      ) : null}

      {/* Section 6 — Selection Process */}
      <Panel title={<T k="selectionProcess" />} className="mb-4">
        <Steps items={job.selection_process ?? []} note="Post-wise process may differ — verify in the official notification." />
      </Panel>

      {/* Section 6b — Documents required (Phase 4D). Generic guidance only:
          what any government application needs, clearly labelled as such. */}
      <Panel title={<T k="documentsRequired" />} className="mb-4">
        <ul className="list-disc space-y-1 pl-5 text-sm text-ink-muted">
          <li>Recent passport-size photographs (number as per the notification)</li>
          <li>Signature / thumb impression on white background, as specified</li>
          <li>
            Class 10 marksheet and certificate for date of birth and category
            proof
          </li>
          <li>Higher-secondary marksheet and certificate (if the post requires it)</li>
          <li>Category certificate (SC/ST/OBC/EWS) or EWS certificate, if claiming relaxation</li>
          <li>PwD / differently-abled certificate and disability board UDID, where applicable</li>
          <li>
            Driving licence, ITI certificate or diploma, where the post specifies
            a trade or vehicle
          </li>
          <li>Experience certificate for posts that require it</li>
        </ul>
        <p className="mt-2 text-xs text-ink-faint">
          This is the standard document checklist for Indian government
          applications. The exact list, number of photos and certificate format
          are defined by the recruiting body — always read the official
          notification&apos;s annexure before uploading.
        </p>
      </Panel>

      {/* Section 6c — Salary details: only what the notification states. */}
      <Panel title={<T k="salaryDetails" />} className="mb-4">
        {job.pay_scale ? (
          <p className="text-sm text-ink">
            <strong className="text-navy">Pay scale:</strong> {job.pay_scale}
          </p>
        ) : (
          <p className="text-sm text-ink-muted">
            Pay scale not notified yet — it appears in the official advertisement
            once the recruiting body publishes it. In-hand salary depends on
            allowances, DA and deductions, so we never estimate it.
          </p>
        )}
      </Panel>

      {/* Trust block — provenance on every job page (Phase 5) */}
      <Panel title="Source & Verification" className="mb-4">
        <DetailTable
          caption="Where this information came from and when it was last checked"
          rows={[
            {
              label: "Official Source",
              value: job.source_url ? (
                <a
                  href={job.source_url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="font-semibold text-navy underline decoration-navy/30 underline-offset-2 hover:decoration-navy break-all"
                >
                  {job.source_url}
                </a>
              ) : (
                "Not recorded"
              ),
            },
            {
              label: "Last Verified",
              value: job.link_last_checked_at
                ? `${formatDate(job.link_last_checked_at)}${
                    job.link_flagged
                      ? " — apply link flagged for manual check"
                      : " — official link reachable"
                    }`
                : "Not checked yet",
            },
            {
              label: "Page Last Updated",
              value: formatDate(job.updated_at ?? job.created_at),
            },
            {
              label: "Data Policy",
              value: (
                <Link
                  href="/editorial-policy"
                  className="font-semibold text-navy underline decoration-navy/30 underline-offset-2 hover:decoration-navy"
                >
                  How we verify every vacancy
                </Link>
              ),
            },
          ]}
        />
      </Panel>

      {/* Section 8 — How to Apply */}
      <Panel title={<T k="howToApply" />} className="mb-4">
        <Steps items={job.how_to_apply ?? []} />
        {job.status === "closed" ? null : job.link_flagged ? (
<p className="mt-3 rounded-sm bg-alert-bg px-2.5 py-2 text-sm font-semibold text-alert">
            <T k="applyLinkUnderVerification" />
          </p>
        ) : (
          <div className="mt-3">
            <ApplyButton href={job.official_link} title={job.title} />
          </div>
        )}
        {hasBrokenLink(job) ? (
          <p className="mt-2 text-xs text-alert">
            ⚠️ Official apply link could not be verified. Please check the official website directly.
          </p>
        ) : null}
      </Panel>

      {/* Section 9 — Important Links */}
      <Panel title={<T k="importantLinks" />} className="mb-4">
        <ul className="divide-y divide-rule">
          {job.notification_pdf_link ? (
            <li>
              <Link
                href={job.notification_pdf_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 py-2.5 text-sm font-semibold text-navy no-underline hover:text-alert hover:underline"
              >
                <PdfGlyph /> Download Official Notification (PDF)
              </Link>
            </li>
          ) : null}
          {job.syllabus?.slug ? (
            <li>
              <Link
                href={`/syllabus/${job.syllabus.slug}`}
                className="flex items-center gap-2 py-2.5 text-sm font-semibold text-navy no-underline hover:text-alert hover:underline"
              >
                <SyllabusGlyph /> {job.syllabus.exam_name} — Syllabus
              </Link>
            </li>
          ) : null}
          <li>
            <Link
              href={job.official_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 py-2.5 text-sm font-semibold text-navy no-underline hover:text-alert hover:underline"
            >
              <GlobeGlyph /> Official Website
              {hasBrokenLink(job) ? (
                <span className="rounded-sm bg-alert-bg px-1.5 py-0.5 text-[0.625rem] font-bold text-alert">⚠ Verify</span>
              ) : null}
            </Link>
          </li>
        </ul>
      </Panel>

      {/* Section 10 — FAQ */}
      <FAQSection
        title="Frequently Asked Questions"
        faqs={[
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
        ]}
        url={url}
        headline={job.title}
      />

      {/* Section 11 — Related jobs (internal linking for SEO); closed jobs
          point readers to similar open vacancies instead of a dead end. */}
      {related.length > 0 ? (
        <section aria-labelledby="related-jobs" className="gov-panel">
          <div className="gov-panel-title" id="related-jobs">
            {job.status === "closed" ? "Similar Open Jobs" : "Related Jobs"}
          </div>
          <div className="p-3">
            <JobTable
              jobs={related}
              caption="Related active jobs"
              serialNumbers={false}
            />
          </div>
        </section>
      ) : null}
    </PageContainer>
  );
}

/* ------------------------------------------------------------------ */
/* Section-local presentational pieces                                 */
/* ------------------------------------------------------------------ */

/** Category-wise rows (fee, vacancy, age relaxation). */
function CategoryValueTable({
  caption,
  data,
  format,
}: {
  caption: string;
  data: Record<string, number>;
  format: (v: number) => string;
}) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="gov-table">
        <caption className="sr-only">{caption}</caption>
        <tbody>
          {Object.entries(data).map(([key, value]) => (
            <tr key={key}>
              <th
                scope="row"
                className="w-2/5 border-t border-r border-rule bg-navy-50 px-2.5 py-2 text-left align-top font-sans text-sm font-semibold text-navy"
              >
                {fmtCategoryLabel(key)}
              </th>
              <td className="font-semibold tabular-nums">{format(value ?? 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AgeRelaxationTable({ data }: { data: Record<string, number> }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="gov-table">
        <caption className="sr-only">Age relaxation by category</caption>
        <tbody>
          {Object.entries(data).map(([key, value]) => (
            <tr key={key}>
              <th
                scope="row"
                className="w-2/5 border-t border-r border-rule bg-navy-50 px-2.5 py-2 text-left align-top font-sans text-sm font-semibold text-navy"
              >
                {fmtCategoryLabel(key)}
              </th>
              <td>{value > 0 ? <>Upper age relaxation of {value} years</> : "No relaxation"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Steps({ items, note }: { items: string[]; note?: string }) {
  if (!items.length) {
    return (
      <p className="text-sm text-ink-muted">
        As per the official notification. {note ?? ""}
      </p>
    );
  }
  return (
    <ol className="list-decimal space-y-1.5 pl-5 text-sm">
      {items.map((step, i) => (
        <li key={i}>{step}</li>
      ))}
      {note ? <li className="text-xs text-ink-faint">{note}</li> : null}
    </ol>
  );
}

function PdfGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#B91C1C" strokeWidth="2" />
      <path d="M14 2v6h6" stroke="#B91C1C" strokeWidth="2" />
      <rect x="8" y="12" width="8" height="1.6" fill="#B91C1C" />
      <rect x="8" y="16" width="5" height="1.6" fill="#B91C1C" />
    </svg>
  );
}

function GlobeGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="#138808" strokeWidth="2" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" stroke="#138808" strokeWidth="2" />
    </svg>
  );
}

function SyllabusGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13z" stroke="#0B3D6E" strokeWidth="2" />
      <path d="M8 8h8M8 12h8M8 16h5" stroke="#0B3D6E" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}