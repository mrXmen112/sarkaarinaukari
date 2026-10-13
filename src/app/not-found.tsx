import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { SearchBox } from "@/components/ui/SearchBox";
import { JobTable } from "@/components/jobs/JobTable";
import { getLatestJobs } from "@/lib/queries";
import { QUICK_LINKS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Page Not Found — SarkaariNaukri.online",
  description:
    "The page you are looking for does not exist or has been moved. Return to the homepage or browse the latest government job notifications.",
  robots: { index: false, follow: true },
};

export default async function NotFoundPage() {
  const latest = await getLatestJobs(6);

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "404" }]} />
      <PageHeader
        title="404 — Page Not Found"
        subtitle="The page you requested does not exist or has been moved. Try a search below."
      />

      <div className="mb-6 max-w-xl">
        <Suspense fallback={<div className="h-11" />}>
          <SearchBox />
        </Suspense>
      </div>

      {latest.length > 0 ? (
        <section aria-labelledby="latest-jobs" className="gov-panel mb-6">
          <div className="gov-panel-title flex items-center justify-between gap-3">
            <h2 id="latest-jobs" className="font-serif text-base font-bold text-white">
              Latest Government Jobs
            </h2>
            <Link
              href="/jobs"
              className="text-xs font-semibold text-saffron no-underline hover:underline"
            >
              View All Jobs →
            </Link>
          </div>
          <div className="p-3">
            <JobTable
              jobs={latest}
              caption="Latest active government vacancies"
              serialNumbers={false}
            />
          </div>
        </section>
      ) : null}

      <nav aria-label="Popular pages">
        <h2 className="mb-2 font-serif text-base font-bold">
          Popular Pages
        </h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {QUICK_LINKS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex h-full flex-col rounded-sm border border-rule bg-surface p-3 no-underline hover:border-navy-400 hover:bg-navy-50"
              >
                <span className="font-serif text-base font-bold text-navy">
                  {item.label}
                </span>
                <span className="mt-0.5 text-xs text-ink-muted">
                  {item.hint}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </PageContainer>
  );
}
