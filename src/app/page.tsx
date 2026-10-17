import Link from "next/link";
import type { Metadata } from "next";

import { JobTable } from "@/components/jobs/JobTable";
import { NoticeBar } from "@/components/layout/NoticeBar";
import { PageContainer, Panel } from "@/components/layout/PageContainer";
import { RecentlyClosedSection } from "@/components/jobs/RecentlyClosedSection";
import { BrokenLinkReport } from "@/components/jobs/BrokenLinkReport";
import { RecentUpdatesPanel } from "@/components/updates/RecentUpdatesPanel";
import { isSupabaseConfigured } from "@/lib/env";
import {
  getClosingJobs,
  getLatestJobs,
  getRecentlyClosedJobs,
  listExams,
  listJobs,
  listRecentUpdates,
} from "@/lib/queries";
import { BOARDS } from "@/lib/boards";
import { HOMEPAGE_TARGET_JOBS, QUICK_LINKS } from "@/lib/site";

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
  const [latest, closing, recentlyClosed, bihar, updates, exams] =
    await Promise.all([
      getLatestJobs(8),
      getClosingJobs(6),
      getRecentlyClosedJobs(6),
      listJobs({ state: "bihar", status: "open", pageSize: 6 }),
      listRecentUpdates(6),
      listExams(8),
    ]);

  const notices = closing.map((job) => ({
    label: job.title,
    href: `/jobs/${job.slug}`,
    tag: "Closing Soon",
  }));

  // W5.8 — a homepage whose only job block is an empty table looks broken and
  // wastes the strongest page on the site. When there are fewer than
  // HOMEPAGE_TARGET_JOBS live jobs we stop leaning on the table alone and add
  // real sections below it (admit cards, results, answer keys, exam hubs,
  // result-checking guides). When there are none at all, the table is dropped
  // entirely rather than rendered empty.
  const hasJobs = latest.length > 0;
  const needsFallback = latest.length < HOMEPAGE_TARGET_JOBS;

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
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted" lang="hi">
            सरकारी नौकरी.ऑनलाइन पर पाएं केंद्र व राज्य सरकार की भर्तियां, बिहार
            सरकारी नौकरी (BPSC, BSSC, बिहार पुलिस, TRE), एडमिट कार्ड, रिजल्ट,
            आंसर की और सरकारी योजना की जानकारी — हर दिन अपडेट।
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

        {hasJobs ? (
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
        ) : null}

        {needsFallback ? (
          <HomeFallback
            biharJobs={bihar.jobs}
            biharTotal={bihar.total}
            updates={updates}
            exams={exams}
          />
        ) : null}

        <RecentlyClosedSection jobs={recentlyClosed} />
        <BrokenLinkReport jobs={latest} />
      </PageContainer>
    </>
  );
}

/**
 * W5.8 — the thin-list fill for the homepage.
 *
 * Every block disappears on its own when its data is empty: the updates panel
 * returns null at zero, the Bihar and exam blocks are skipped by length, and
 * the guide links (static config) are the one block that is always present —
 * which is the point, they are what a visitor needs when there is no vacancy to
 * show yet.
 */
function HomeFallback({
  biharJobs,
  biharTotal,
  updates,
  exams,
}: {
  biharJobs: Awaited<ReturnType<typeof listJobs>>["jobs"];
  biharTotal: number;
  updates: Awaited<ReturnType<typeof listRecentUpdates>>;
  exams: Awaited<ReturnType<typeof listExams>>;
}) {
  return (
    <div className="mt-6">
      <h2 className="mb-3 font-serif text-lg font-bold text-navy">
        Notifications, Admit Cards, Results &amp; Exam Guides
      </h2>

      <RecentUpdatesPanel updates={updates} />

      {biharJobs.length > 0 ? (
        <section aria-labelledby="bihar-jobs" className="gov-panel mb-4">
          <div className="gov-panel-title flex items-center justify-between gap-3">
            <h2 id="bihar-jobs" className="font-serif text-base font-bold text-white">
              Bihar Government Jobs
            </h2>
            <Link
              href="/bihar"
              className="text-xs font-semibold text-saffron no-underline hover:underline"
            >
              All {formatCount(biharTotal)} Bihar jobs →
            </Link>
          </div>
          <div className="p-3">
            <JobTable
              jobs={biharJobs}
              caption="Latest Bihar government vacancies"
              serialNumbers={false}
            />
          </div>
        </section>
      ) : null}

      {exams.length > 0 ? (
        <section aria-labelledby="exam-hubs" className="gov-panel mb-4">
          <div className="gov-panel-title">
            <h2 id="exam-hubs" className="font-serif text-base font-bold text-white">
              Exam Guides &amp; Syllabus
            </h2>
          </div>
          <ul className="flex flex-wrap gap-2 p-3">
            {exams.map((e) => (
              <li key={e.slug}>
                <Link
                  href={`/exams/${e.slug}`}
                  className="inline-block rounded-sm border border-rule bg-surface px-2.5 py-1.5 text-sm font-semibold text-navy no-underline hover:border-navy-400 hover:bg-navy-50 hover:no-underline"
                >
                  {e.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="how-to-check" className="gov-panel mb-4">
        <div className="gov-panel-title">
          <h2 id="how-to-check" className="font-serif text-base font-bold text-white">
            How to Check Results &amp; Admit Cards
          </h2>
        </div>
        <div className="p-3">
          <p className="mb-3 text-sm leading-relaxed text-ink-muted">
            Step-by-step guides to downloading your board result and hall
            tickets from the official portals.
          </p>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <li>
              <GuideLink href="/result/10th" label="10th (Matric) Result — How to Check" />
            </li>
            <li>
              <GuideLink href="/result/12th" label="12th (Inter) Result — How to Check" />
            </li>
            {HOW_TO_CHECK_BOARDS.map((b) => (
              <li key={b.slug}>
                <GuideLink
                  href={`/result/boards/${b.slug}`}
                  label={`${b.label} Result — How to Check`}
                />
              </li>
            ))}
            <li>
              <GuideLink href="/admit-card" label="Admit Card / Hall Ticket — How to Download" />
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}

/** Major boards we hold a dedicated result-checking guide for. */
const HOW_TO_CHECK_BOARDS = BOARDS.filter((b) =>
  ["cbse", "bseb", "cisce"].includes(b.slug),
).map((b) => ({
  slug: b.slug,
  // Board names are long ("CBSE — Central Board of Secondary Education"); the
  // part before the em-dash is the recognisable short name.
  label: b.name.split("—")[0].trim(),
}));

function GuideLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block rounded-sm border border-rule bg-surface px-3 py-2 text-sm font-semibold text-navy no-underline hover:border-navy-400 hover:bg-navy-50 hover:no-underline"
    >
      {label}
    </Link>
  );
}

function formatCount(n: number): string {
  return n > 0 ? new Intl.NumberFormat("en-IN").format(n) : "0";
}