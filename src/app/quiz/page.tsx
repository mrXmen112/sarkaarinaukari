import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { DataTable } from "@/components/ui/DataTable";
import { JsonLd } from "@/components/ui/JsonLd";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { TitleCell } from "@/components/updates/UpdatePanels";
import { listQuizzes } from "@/lib/queries";
import { breadcrumbSchema } from "@/lib/seo";

export const revalidate = 10800; // 3 hours

export const metadata: Metadata = {
  title: "Quiz & Mock Tests — Free GK Practice for Sarkari Exams",
  description:
    "Free online quiz and mock test practice for SSC, BPSC, Bihar Police, RRB and other government exams. Test your GK and subject knowledge instantly.",
  alternates: { canonical: "/quiz" },
};

export default async function QuizListingPage() {
  const quizzes = await listQuizzes();

  return (
    <PageContainer>
      <JsonLd
        data={breadcrumbSchema([{ name: "Quiz & Mock Tests", path: "/quiz" }])}
      />
      <Breadcrumbs items={[{ label: "Quiz & Mock Tests" }]} />

      <PageHeader
        title="Quiz & Mock Tests"
        subtitle="Free practice tests for SSC, BPSC, Bihar Police, RRB and other exams. Pick a quiz, answer instantly, and see your score on submission."
        meta={`${quizzes.length} quizzes available`}
      />

      <DataTable
        columns={[
          {
            key: "title",
            header: "Quiz",
            cell: (quiz) => (
              <TitleCell href={`/quiz/${quiz.slug}`} title={quiz.title} />
            ),
          },
          {
            key: "subject",
            header: "Subject",
            cell: (quiz) => (
              <span className="whitespace-nowrap text-ink-muted">
                {quiz.subject ?? "GK"}
              </span>
            ),
          },
          {
            key: "questions",
            header: "Questions",
            hideBelow: "md",
            cell: (quiz) => (
              <span className="tabular-nums text-ink-muted">
                {quiz.questions?.length ?? 0}
              </span>
            ),
          },
        ]}
        rows={quizzes}
        rowKey={(quiz) => quiz.id}
        caption="Free online quizzes and mock tests for government exam preparation."
        serialNumbers
        empty={
          <p>
            No quizzes available yet. Practice tests appear here as soon as
            they are published.
          </p>
        }
      />
    </PageContainer>
  );
}