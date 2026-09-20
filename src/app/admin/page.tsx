import Link from "next/link";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/date";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — SarkaariNaukri.online",
};

export default async function AdminDashboard() {
  const { supabase } = await requireAdmin();

  const [caRes, quizRes, yojanaRes, examRes, catRes, jobRes, admitRes, resultRes, keyRes, recentCA, recentQuiz, recentJobs] =
    await Promise.all([
      supabase
        .from("current_affairs")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("quizzes")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("yojana")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("exams")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("job_categories")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("jobs")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("admit_cards")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("results")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("answer_keys")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("current_affairs")
        .select("id, date, title, slug, is_published")
        .order("date", { ascending: false })
        .limit(5),
      supabase
        .from("quizzes")
        .select("id, title, slug, subject, is_published")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("jobs")
        .select("id, title, slug, status, is_published, application_end")
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Admin Dashboard" }]} />
      <PageHeader
        title="Admin Dashboard"
        subtitle="Manage content: jobs, current affairs, quizzes, yojana and exams."
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/jobs"
          className="rounded border border-rule p-4 no-underline hover:border-navy"
        >
          <h2 className="font-serif text-base font-bold text-navy">Jobs</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {jobRes.count ?? 0} jobs
          </p>
        </Link>
        <Link
          href="/admin/current-affairs"
          className="rounded border border-rule p-4 no-underline hover:border-navy"
        >
          <h2 className="font-serif text-base font-bold text-navy">
            Current Affairs
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            {caRes.count ?? 0} briefs
          </p>
        </Link>
        <Link
          href="/admin/quizzes"
          className="rounded border border-rule p-4 no-underline hover:border-navy"
        >
          <h2 className="font-serif text-base font-bold text-navy">Quizzes</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {quizRes.count ?? 0} quizzes
          </p>
        </Link>
        <Link
          href="/admin/yojana"
          className="rounded border border-rule p-4 no-underline hover:border-navy"
        >
          <h2 className="font-serif text-base font-bold text-navy">Yojana</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {yojanaRes.count ?? 0} schemes
          </p>
        </Link>
        <Link
          href="/admin/exams"
          className="rounded border border-rule p-4 no-underline hover:border-navy"
        >
          <h2 className="font-serif text-base font-bold text-navy">Exams</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {examRes.count ?? 0} exams
          </p>
        </Link>
        <Link
          href="/admin/job-categories"
          className="rounded border border-rule p-4 no-underline hover:border-navy"
        >
          <h2 className="font-serif text-base font-bold text-navy">
            Categories
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            {catRes.count ?? 0} job categories
          </p>
        </Link>
        <Link
          href="/admin/admit-cards"
          className="rounded border border-rule p-4 no-underline hover:border-navy"
        >
          <h2 className="font-serif text-base font-bold text-navy">
            Admit Cards
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            {admitRes.count ?? 0} cards
          </p>
        </Link>
        <Link
          href="/admin/results"
          className="rounded border border-rule p-4 no-underline hover:border-navy"
        >
          <h2 className="font-serif text-base font-bold text-navy">Results</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {resultRes.count ?? 0} results
          </p>
        </Link>
        <Link
          href="/admin/answer-keys"
          className="rounded border border-rule p-4 no-underline hover:border-navy"
        >
          <h2 className="font-serif text-base font-bold text-navy">
            Answer Keys
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            {keyRes.count ?? 0} keys
          </p>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded border border-rule p-4">
          <h2 className="font-serif text-base font-bold">Recent Jobs</h2>
          {(recentJobs.data ?? []).length === 0 ? (
            <p className="mt-2 text-sm text-ink-muted">None yet.</p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {(recentJobs.data ?? []).map((j) => (
                <li key={j.id}>
                  <Link
                    href={`/admin/jobs/${j.id}/edit`}
                    className="text-navy underline decoration-navy/30 underline-offset-2 hover:decoration-navy"
                  >
                    {j.title}
                  </Link>
                  <span className="ml-2 text-xs text-ink-muted">
                    {j.status}
                    {j.is_published ? "" : " • draft"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded border border-rule p-4">
          <h2 className="font-serif text-base font-bold">Recent Current Affairs</h2>
          {(recentCA.data ?? []).length === 0 ? (
            <p className="mt-2 text-sm text-ink-muted">None yet.</p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {(recentCA.data ?? []).map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/admin/current-affairs/${a.id}/edit`}
                    className="text-navy underline decoration-navy/30 underline-offset-2 hover:decoration-navy"
                  >
                    {a.title}
                  </Link>
                  <span className="ml-2 text-xs text-ink-muted">
                    {formatDate(a.date)}
                    {a.is_published ? "" : " • draft"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded border border-rule p-4">
          <h2 className="font-serif text-base font-bold">Recent Quizzes</h2>
          {(recentQuiz.data ?? []).length === 0 ? (
            <p className="mt-2 text-sm text-ink-muted">None yet.</p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {(recentQuiz.data ?? []).map((q) => (
                <li key={q.id}>
                  <Link
                    href={`/admin/quizzes/${q.id}/edit`}
                    className="text-navy underline decoration-navy/30 underline-offset-2 hover:decoration-navy"
                  >
                    {q.title}
                  </Link>
                  <span className="ml-2 text-xs text-ink-muted">
                    {q.subject ?? "GK"}
                    {q.is_published ? "" : " • draft"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageContainer>
  );
}