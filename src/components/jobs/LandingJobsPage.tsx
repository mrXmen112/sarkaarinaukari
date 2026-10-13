import Link from "next/link";

import { JobTable } from "@/components/jobs/JobTable";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { FAQSection } from "@/components/ui/FAQSection";
import { JsonLd } from "@/components/ui/JsonLd";
import { Pagination } from "@/components/ui/Pagination";
import { listJobs } from "@/lib/queries";
import { breadcrumbSchema, faqSchema } from "@/lib/seo";
import { PAGE_SIZE, SITE } from "@/lib/site";
import type { LandingPage } from "@/lib/landingPages";

/**
 * Shared renderer for every Phase 3 landing page (qualification, state,
 * category, Bihar organisation). One H1, original intro copy, a live filtered
 * job table, FAQ (with FAQPage JSON-LD), pagination and links to the
 * neighbouring landing pages for internal linking.
 */
export async function LandingJobsPage({
  config,
  path,
  breadcrumbName,
  pageNumber = 1,
}: {
  config: LandingPage;
  path: string;
  breadcrumbName: string;
  pageNumber?: number;
}) {
  // Open vacancies lead the page; a "recently closed" block is added only when
  // a category is between recruitment cycles, so thin org pages still carry
  // useful, honest content instead of an empty table.
  const [open, closed] = await Promise.all([
    listJobs({
      ...config.filters,
      page: pageNumber,
      pageSize: PAGE_SIZE,
    }),
    listJobs({
      ...config.filters,
      status: "recently_closed",
      page: 1,
      pageSize: 10,
    }),
  ]);
  const { jobs, total, totalPages } = open;
  const closedJobs = closed.jobs;
  const showClosed = total < 5 && closedJobs.length > 0;

  const url = `${SITE.url}${path}`;

  return (
    <PageContainer>
      <JsonLd data={breadcrumbSchema([{ name: breadcrumbName, path }])} />
      <JsonLd data={faqSchema({ faqs: config.faqs, url, headline: config.h1 })} />

      <Breadcrumbs items={[{ label: breadcrumbName }]} />

      <PageHeader title={config.h1} />

      <section aria-labelledby="intro" className="mb-5">
        <h2 id="intro" className="sr-only">
          About these vacancies
        </h2>
        <div className="max-w-3xl space-y-3 text-sm leading-relaxed text-ink-muted">
          {config.intro.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
        <p className="mt-3 text-xs text-ink-faint">
          Showing <strong className="text-navy">{total}</strong> open{" "}
          {total === 1 ? "vacancy" : "vacancies"} on this page.{" "}
          <Link
            href="/jobs"
            className="font-semibold text-navy underline decoration-navy/30 underline-offset-2 hover:decoration-navy"
          >
            Browse and filter all jobs
          </Link>
          .
        </p>
      </section>

      <section aria-labelledby="vacancies" className="gov-panel mb-6">
        <div className="gov-panel-title" id="vacancies">
          Current Vacancies
        </div>
        <div className="p-3">
          <JobTable
            jobs={jobs}
            caption={`Current government vacancies — ${config.h1}`}
            startIndex={(pageNumber - 1) * PAGE_SIZE}
            empty="No current vacancies match this category right now. Vacancies open in cycles — bookmark this page or browse all latest jobs."
          />
        </div>
      </section>

      <Pagination
        page={pageNumber}
        totalPages={totalPages}
        basePath={path}
        params={{}}
      />

      {showClosed ? (
        <section aria-labelledby="recently-closed" className="gov-panel mb-6 mt-4">
          <div className="gov-panel-title" id="recently-closed">
            Recently Closed (Applications Ended)
          </div>
          <div className="p-3">
            <JobTable
              jobs={closedJobs}
              caption={`Recently closed vacancies — ${config.h1}`}
            />
            <p className="mt-2 text-xs text-ink-muted">
              Apply buttons are removed once the last date passes — pages are
              kept online because the next recruitment for this post usually
              follows the same cycle.
            </p>
          </div>
        </section>
      ) : null}

      <FAQSection
        title="Frequently Asked Questions"
        faqs={config.faqs}
        url={url}
        headline={config.h1}
      />

      <nav aria-labelledby="related-pages" className="mt-6">
        <h2
          id="related-pages"
          className="mb-2 font-serif text-base font-bold text-navy"
        >
          Related Pages
        </h2>
        <ul className="flex flex-wrap gap-2">
          {config.neighbours.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="inline-block rounded-sm border border-rule bg-surface px-3 py-1.5 text-sm font-semibold text-navy no-underline hover:border-navy-400 hover:bg-navy-50"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </PageContainer>
  );
}

/** Metadata for a landing page (self-referencing canonical, no brand suffix). */
export function landingMetadata(config: LandingPage, path: string) {
  return {
    title: { absolute: config.metaTitle },
    description: config.metaDescription,
    alternates: { canonical: path },
    openGraph: {
      title: config.metaTitle,
      description: config.metaDescription,
      url: `${SITE.url}${path}`,
    },
    robots: { index: true, follow: true },
  };
}