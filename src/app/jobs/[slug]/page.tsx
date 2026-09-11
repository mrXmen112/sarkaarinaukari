import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CountdownBadge } from "@/components/ui/CountdownBadge";
import { DetailTable } from "@/components/ui/DataTable";
import { JsonLd } from "@/components/ui/JsonLd";
import { PageContainer, Panel } from "@/components/layout/PageContainer";
import { JobActions } from "@/components/jobs/JobActions";
import { JobTable } from "@/components/jobs/JobTable";
import { formatDate } from "@/lib/date";
import { categoryLabel as fmtCategoryLabel, formatIndianNumber, formatRupees, truncate } from "@/lib/utils";
import {
  getAllJobSlugs,
  getJobBySlug,
  getRelatedJobs,
  stateLabel,
} from "@/lib/queries";
import { breadcrumbSchema, jobPostingSchema } from "@/lib/seo";
import { SITE } from "@/lib/site";

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

  const year = new Date(job.application_end).getUTCFullYear();
  const title = `${job.title} — Sarkari Naukri ${year}`;
  const description = truncate(
    job.short_description ??
      `Eligibility, vacancy, application dates and official apply link for ${job.title}.`,
    158,
  );

  return {
    title,
    description,
    alternates: { canonical: `/jobs/${slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `${SITE.url}/jobs/${slug}`,
    },
    robots: { index: true, follow: true },
  };
}

/**
 * Job detail page. Sections follow Section 4.2 of the PRD in exact order.
 * Statically generated per job and revalidated — never client-side fetched.
 */
export default async function JobDetailPage({ params }: PageProps<"/jobs/[slug]">) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) notFound();

  const related = await getRelatedJobs(job, 6);
  const url = `${SITE.url}/jobs/${job.slug}`;

  const breadcrumbs = [
    { name: "Latest Jobs", path: "/jobs" },
    ...(job.job_categories?.slug
      ? [{ name: job.job_categories.name, path: `/jobs?category=${job.job_categories.slug}` }]
      : []),
    ...(job.state
      ? [{ name: stateLabel(job.state), path: `/jobs?state=${job.state}` }]
      : []),
    { name: job.title, path: `/jobs/${job.slug}` },
  ];

  return (
    <PageContainer>
      <JsonLd data={jobPostingSchema(job, url)} />
      <JsonLd
        data={breadcrumbSchema(breadcrumbs.filter((b) => b.name !== job.title))}
      />

      <Breadcrumbs
        items={[
          { label: "Latest Jobs", href: "/jobs" },
          { label: job.title },
        ]}
      />

      {/* Section 1 — Title + Last Date countdown (top-right) */}
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b-2 border-navy pb-3">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl">{job.title}</h1>
          {job.status === "closed" ? (
            <p className="mt-1.5 inline-block rounded-sm bg-alert-bg px-2 py-0.5 text-xs font-bold text-alert">
              This vacancy has closed — next notification may be forthcoming.
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
      <Panel title="Post Overview" className="mb-4">
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
              label: "Total Vacancy",
              value: formatIndianNumber(job.vacancy_total),
            },
            {
              label: "Application Dates",
              value: `${formatDate(job.application_start)} to <strong>${formatDate(job.application_end)}</strong>`,
            },
            { label: "Exam Date", value: job.exam_date ? formatDate(job.exam_date) : "To be announced" },
            { label: "Pay Scale", value: job.pay_scale ?? "—" },
          ]}
        />
      </Panel>

      {/* Section 3 — Eligibility */}
      <Panel title="Eligibility Criteria" className="mb-4">
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
        <Panel title="Application Fee" className="mb-4">
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
      <Panel title="Selection Process" className="mb-4">
        <Steps items={job.selection_process ?? []} note="Post-wise process may differ — verify in the official notification." />
      </Panel>

      {/* Section 8 — How to Apply */}
      <Panel title="How to Apply Online" className="mb-4">
        <Steps items={job.how_to_apply ?? []} />
        <div className="mt-3">
          <Link
            href={job.official_link}
            target="_blank"
            rel="noopener noreferrer"
            className="gov-btn"
          >
            Apply Online (Official Website)
          </Link>
        </div>
      </Panel>

      {/* Section 9 — Important Links */}
      <Panel title="Important Links" className="mb-4">
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
            </Link>
          </li>
        </ul>
      </Panel>

      {/* Section 10 — Related jobs (internal linking for SEO) */}
      {related.length > 0 ? (
        <section aria-labelledby="related-jobs" className="gov-panel">
          <div className="gov-panel-title" id="related-jobs">
            Related Jobs
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