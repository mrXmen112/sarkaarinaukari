import Link from "next/link";
import type { Metadata } from "next";

import { JobTable } from "@/components/jobs/JobTable";
import { NoticeBar } from "@/components/layout/NoticeBar";
import { PageContainer, Panel } from "@/components/layout/PageContainer";
import { RecentlyClosedSection } from "@/components/jobs/RecentlyClosedSection";
import { BrokenLinkReport } from "@/components/jobs/BrokenLinkReport";
import { isSupabaseConfigured } from "@/lib/env";
import { getClosingJobs, getLatestJobs, getRecentlyClosedJobs } from "@/lib/queries";
import { QUICK_LINKS } from "@/lib/site";

export const revalidate = 1800; // 30 min — listings change often

export const metadata: Metadata = {
  title: "Latest Sarkari Naukri 2026 — Govt Jobs, Admit Card, Result & Yojana",
  description:
    "SarkaariNaukri.online: latest central & state government job notifications, Bihar jobs (BPSC, BSSC, Bihar Police, TRE), admit cards, results, answer keys, syllabus and Sarkari Yojana updates.",
  alternates: { canonical: "/" },
};

/**
 * Homepage. Live data (latest jobs + closing-soon ticker) when Supabase is
 * configured; a clear setup panel otherwise so the page never breaks.
 */
export default async function HomePage() {
  const [latest, closing, recentlyClosed] = await Promise.all([
    getLatestJobs(8),
    getClosingJobs(6),
    getRecentlyClosedJobs(6),
  ]);

  const notices = closing.map((job) => ({
    label: job.title,
    href: `/jobs/${job.slug}`,
    tag: "Closing Soon",
  }));

  return (
    <>
      <NoticeBar items={notices} />

      <PageContainer>
        <section className="mb-5">
          <h1>Latest Sarkari Naukri 2026 — Government Job Updates</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
            Welcome to SarkaariNaukri.online, an independent information portal
            for central and state government job notifications across India,
            with dedicated coverage of Bihar government jobs (BPSC, BSSC, Bihar
            Police, Bihar TRE teacher recruitment and more). Find active
            vacancies, admit cards, results, answer keys, exam syllabus and
            Sarkari Yojana schemes — verified against official sources and
            updated daily.
          </p>
        </section>

        <section aria-labelledby="quick-links" className="mb-6">
          <h2 id="quick-links" className="sr-only">
            Quick links
          </h2>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {QUICK_LINKS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex h-full flex-col rounded-sm border border-rule bg-surface p-3 no-underline transition-colors hover:border-navy-400 hover:bg-navy-50 hover:no-underline"
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
        </section>

        {!isSupabaseConfigured ? (
          <Panel title="Setup Required" className="mb-5">
            <p className="text-sm text-ink">
              Supabase is not configured yet. Create the project, run the
              schema migration, then add your keys to{" "}
              <code className="rounded-sm bg-page px-1 py-0.5 text-[0.8125rem]">
                .env.local
              </code>{" "}
              to enable live job listings.
            </p>
          </Panel>
        ) : null}

        <section aria-labelledby="latest-jobs" className="gov-panel">
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
              empty="No active jobs right now. Check back again shortly."
            />
          </div>
        </section>

        <RecentlyClosedSection jobs={recentlyClosed} />
        <BrokenLinkReport jobs={latest} />
      </PageContainer>
    </>
  );
}