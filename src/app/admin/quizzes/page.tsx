import Link from "next/link";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { DeleteQuizButton } from "@/components/admin/DeleteQuizButton";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — Quizzes",
};

export default async function AdminQuizzesPage() {
  const { supabase } = await requireAdmin();

  const { data } = await supabase
    .from("quizzes")
    .select("id, title, slug, subject, questions, is_published")
    .order("created_at", { ascending: false })
    .limit(200);

  const quizzes = data ?? [];

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Admin" }]} />
      <PageHeader title="Quizzes" subtitle={`${quizzes.length} quizzes`} />

      <div className="mb-4">
        <Link
          href="/admin/quizzes/new"
          className="inline-block rounded bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"
        >
          + New Quiz
        </Link>
      </div>

      {quizzes.length === 0 ? (
        <p className="text-sm text-ink-muted">No quizzes yet.</p>
      ) : (
        <ul className="divide-y divide-rule rounded border border-rule">
          {quizzes.map((q) => {
            const count = Array.isArray(q.questions) ? q.questions.length : 0;
            return (
              <li key={q.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0">
                  <Link
                    href={`/admin/quizzes/${q.id}/edit`}
                    className="block truncate text-sm font-semibold text-navy no-underline hover:text-alert hover:underline"
                  >
                    {q.title}
                  </Link>
                  <span className="text-xs text-ink-muted">
                    {q.subject ?? "GK"} • {count} questions
                    {q.is_published ? "" : " • draft"}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Link
                    href={`/quiz/${q.slug}`}
                    className="text-xs font-semibold text-navy hover:underline"
                  >
                    View
                  </Link>
                  <DeleteQuizButton id={q.id} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </PageContainer>
  );
}