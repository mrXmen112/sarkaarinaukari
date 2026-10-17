import Link from "next/link";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer, PageHeader, Panel } from "@/components/layout/PageContainer";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";
import { isIndexable, MIN_CONTENT_CHARS } from "@/lib/indexable";
import { examContentChars, yojanaContentChars } from "@/lib/indexable";

import {
  ExamRowControls,
  YojanaRowControls,
} from "./VerificationControls";
import { JobQueue, type QueueRow } from "./JobQueue";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin — Verification" };

const QUEUE_LIMIT = 200;

type SummaryRow = {
  verification_status: string;
  status: string;
  job_count: number;
  flagged_dead: number;
};

type ExamRow = {
  slug: string;
  name: string;
  official_link: string | null;
  last_verified_at: string | null;
  overview: string | null;
  eligibility: string | null;
  exam_pattern: unknown[] | string | null;
  preparation_strategy: string | null;
  conducting_body: string | null;
};

type YojanaRow = {
  slug: string;
  title: string;
  official_link: string | null;
  last_verified_at: string | null;
  description: string | null;
  eligibility: string | null;
  how_to_apply: string | null;
  benefits_summary: string | null;
  benefits: string | null;
};

/**
 * Phase 8A verification queue (W2).
 *
 * `requireAdmin()` runs first, before any read. That is the real security
 * boundary — the SQL grants in 0017 are only half the defence.
 *
 * Reads use the SERVICE-ROLE client, not the cookie client from requireAdmin(),
 * because public.verification_summary was revoked from anon and authenticated in
 * migration 0017. The service-role key stays server-side; no component below is a
 * Client Component.
 */
export default async function VerificationPage() {
  await requireAdmin();
  const supabase = createAdminClient();

  const [summaryRes, jobsRes, examsRes, yojanaRes] = await Promise.all([
    supabase.from("verification_summary").select("*"),
    supabase
      .from("jobs")
      .select(
        "id, slug, title, status, verification_status, link_flagged, link_http_status, official_link, source_url, verified_at, verified_by",
      )
      .eq("is_published", true)
      .in("verification_status", ["unverified", "needs_review"])
      .order("verification_status", { ascending: true })
      .order("title", { ascending: true })
      .limit(QUEUE_LIMIT),
    supabase
      .from("exams")
      .select(
        "slug, name, official_link, last_verified_at, overview, eligibility, exam_pattern, preparation_strategy, conducting_body",
      )
      .eq("is_published", true)
      .order("name"),
    supabase
      .from("yojana")
      .select(
        "slug, title, official_link, last_verified_at, description, eligibility, how_to_apply, benefits_summary, benefits",
      )
      .eq("is_published", true)
      .order("title"),
  ]);

  const summary = (summaryRes.data ?? []) as SummaryRow[];
  const jobs = (jobsRes.data ?? []) as QueueRow[];
  const exams = (examsRes.data ?? []) as ExamRow[];
  const yojana = (yojanaRes.data ?? []) as YojanaRow[];

  const totalJobs = summary.reduce((n, r) => n + r.job_count, 0);
  const verifiedCount = summary
    .filter((r) => r.verification_status === "verified")
    .reduce((n, r) => n + r.job_count, 0);

  // Why each exam/yojana is still noindexed, computed with the SAME function the
  // page and the sitemap use. Showing the reason is the point of this screen.
  const examReason = (row: ExamRow): string[] => {
    const verdict = isIndexable({
      kind: "exam",
      contentChars: examContentChars(row),
      officialSourceUrl: row.official_link,
      lastVerifiedAt: row.last_verified_at,
      isPublished: true,
    });
    return verdict.reasons;
  };
  const yojanaReason = (row: YojanaRow): string[] => {
    const verdict = isIndexable({
      kind: "yojana",
      contentChars: yojanaContentChars(row),
      officialSourceUrl: row.official_link,
      lastVerifiedAt: row.last_verified_at,
      isPublished: true,
    });
    return verdict.reasons;
  };

  const examVerified = exams.filter((e) => e.last_verified_at).length;
  const yojanaVerified = yojana.filter((y) => y.last_verified_at).length;

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Admin" }, { label: "Verification" }]} />
      <PageHeader
        title="Verification"
        subtitle="Nothing enters the Google index until a human matches it to an official notification"
      />

      {/* ---- status ---- */}
      <Panel title="Current state" className="mb-5">
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Published jobs" value={totalJobs} />
          <Stat label="Verified" value={verifiedCount} good={verifiedCount > 0} />
          <Stat
            label="Needs review"
            value={
              summary
                .filter((r) => r.verification_status === "needs_review")
                .reduce((n, r) => n + r.job_count, 0)
            }
          />
          <Stat
            label="Unverified"
            value={
              summary
                .filter((r) => r.verification_status === "unverified")
                .reduce((n, r) => n + r.job_count, 0)
            }
          />
        </dl>
        {verifiedCount === 0 ? (
          <p className="mt-3 rounded-sm border-2 border-saffron bg-saffron-bg px-3 py-2 text-sm text-navy">
            <strong>0 jobs verified.</strong> Keep{" "}
            <code>NEXT_PUBLIC_VERIFICATION_GATE</code> off until at least 25 are
            verified — turning it on now would empty the listings, the homepage
            and the job part of the sitemap.
          </p>
        ) : null}
        <p className="mt-3 text-sm text-ink-muted">
          <Link href="/admin/link-report" className="underline">
            Link report
          </Link>{" "}
          tells you which apply links are dead. A flagged job should be sent back
          to <code>needs_review</code>, not verified.
        </p>
      </Panel>

      {/* ---- jobs ---- */}
      <section aria-labelledby="jobs-queue" className="mb-8">
        <h2 id="jobs-queue" className="mb-2 text-base font-bold">
          Job queue{" "}
          <span className="text-sm font-normal text-ink-muted">
            ({jobs.length} of {totalJobs} shown, max {QUEUE_LIMIT})
          </span>
        </h2>
        {jobs.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Nothing awaiting verification. Every published job is verified.
          </p>
        ) : (
          <JobQueue rows={jobs} />
        )}
      </section>

      {/* ---- exams ---- */}
      <section aria-labelledby="exam-queue" className="mb-8">
        <h2 id="exam-queue" className="mb-2 text-base font-bold">
          Exam hubs{" "}
          <span className="text-sm font-normal text-ink-muted">
            ({examVerified} of {exams.length} verified — need{" "}
            {MIN_CONTENT_CHARS.exam}+ chars, an official link and a Last Verified
            date to be indexable)
          </span>
        </h2>
        <div className="overflow-x-auto">
          <table className="gov-table w-full">
            <caption className="sr-only">Exam hubs awaiting verification</caption>
            <thead>
              <tr>
                <th scope="col" className="border-b border-r border-rule bg-navy-50 px-2 py-1.5 text-left text-xs font-bold text-navy">
                  Exam
                </th>
                <th scope="col" className="border-b border-r border-rule bg-navy-50 px-2 py-1.5 text-left text-xs font-bold text-navy">
                  Still blocking the index
                </th>
                <th scope="col" className="border-b border-rule bg-navy-50 px-2 py-1.5 text-left text-xs font-bold text-navy">
                  Official source + verify
                </th>
              </tr>
            </thead>
            <tbody>
              {exams.map((row) => {
                const reasons = examReason(row);
                return (
                  <tr key={row.slug} className="align-top">
                    <td className="border-b border-r border-rule px-2 py-2">
                      <p className="text-sm font-semibold text-navy">{row.name}</p>
                      <p className="font-mono text-xs text-ink-muted">{row.slug}</p>
                      <p className="text-xs text-ingreen">
                        {row.last_verified_at
                          ? `verified ${row.last_verified_at.slice(0, 10)}`
                          : "not verified"}
                      </p>
                    </td>
                    <td className="border-b border-r border-rule px-2 py-2 text-xs">
                      {reasons.length === 0 ? (
                        <span className="font-bold text-ingreen">
                          indexable
                        </span>
                      ) : (
                        <ul className="list-disc pl-4 text-ink-muted">
                          {reasons.map((r) => (
                            <li key={r}>{r}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="border-b border-rule px-2 py-2">
                      <ExamRowControls
                        slug={row.slug}
                        officialLink={row.official_link}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---- yojana ---- */}
      <section aria-labelledby="yojana-queue" className="mb-8">
        <h2 id="yojana-queue" className="mb-2 text-base font-bold">
          Yojana{" "}
          <span className="text-sm font-normal text-ink-muted">
            ({yojanaVerified} of {yojana.length} verified — need{" "}
            {MIN_CONTENT_CHARS.yojana}+ chars and a Last Verified date)
          </span>
        </h2>
        <div className="overflow-x-auto">
          <table className="gov-table w-full">
            <caption className="sr-only">Yojana awaiting verification</caption>
            <thead>
              <tr>
                <th scope="col" className="border-b border-r border-rule bg-navy-50 px-2 py-1.5 text-left text-xs font-bold text-navy">
                  Scheme
                </th>
                <th scope="col" className="border-b border-r border-rule bg-navy-50 px-2 py-1.5 text-left text-xs font-bold text-navy">
                  Still blocking the index
                </th>
                <th scope="col" className="border-b border-rule bg-navy-50 px-2 py-1.5 text-left text-xs font-bold text-navy">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {yojana.map((row) => {
                const reasons = yojanaReason(row);
                return (
                  <tr key={row.slug} className="align-top">
                    <td className="border-b border-r border-rule px-2 py-2">
                      <p className="text-sm font-semibold text-navy">{row.title}</p>
                      <p className="font-mono text-xs text-ink-muted">{row.slug}</p>
                      {row.official_link ? (
                        <a
                          href={row.official_link}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="break-all text-xs text-navy underline"
                        >
                          {row.official_link}
                        </a>
                      ) : (
                        <p className="text-xs text-alert">No official link</p>
                      )}
                    </td>
                    <td className="border-b border-r border-rule px-2 py-2 text-xs">
                      {reasons.length === 0 ? (
                        <span className="font-bold text-ingreen">indexable</span>
                      ) : (
                        <ul className="list-disc pl-4 text-ink-muted">
                          {reasons.map((r) => (
                            <li key={r}>{r}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="border-b border-rule px-2 py-2">
                      <YojanaRowControls slug={row.slug} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </PageContainer>
  );
}

function Stat({
  label,
  value,
  good,
}: {
  label: string;
  value: number;
  good?: boolean;
}) {
  return (
    <div className="rounded-sm border border-rule bg-surface px-3 py-2">
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {label}
      </dt>
      <dd
        className={`text-2xl font-bold tabular-nums ${good ? "text-ingreen" : "text-navy"}`}
      >
        {value}
      </dd>
    </div>
  );
}