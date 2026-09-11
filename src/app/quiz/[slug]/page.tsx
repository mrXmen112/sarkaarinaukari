import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/ui/JsonLd";
import { PageContainer, PageHeader, Panel } from "@/components/layout/PageContainer";
import QuizRunner from "@/components/quiz/QuizRunner";
import {
  getAllQuizSlugs,
  getQuizBySlug,
} from "@/lib/queries";
import {
  articleSchema,
  breadcrumbSchema,
} from "@/lib/seo";
import { SITE } from "@/lib/site";
import { truncate } from "@/lib/utils";

export const revalidate = 10800; // 3 hours

export async function generateStaticParams() {
  const slugs = await getAllQuizSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/quiz/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const quiz = await getQuizBySlug(slug);
  if (!quiz) return { title: "Quiz Not Found" };

  const title = `${quiz.title} — Free Practice Test`;
  return {
    title,
    description: truncate(
      quiz.description ?? `Free practice test with ${quiz.questions?.length ?? 0} questions for ${quiz.subject ?? "GK"}.`,
      158,
    ),
    alternates: { canonical: `/quiz/${quiz.slug}` },
    openGraph: {
      type: "article",
      title,
      description: truncate(quiz.description ?? "", 158),
      url: `${SITE.url}/quiz/${quiz.slug}`,
      publishedTime: quiz.updated_at,
    },
    robots: { index: true, follow: true },
  };
}

export default async function QuizDetailPage({
  params,
}: PageProps<"/quiz/[slug]">) {
  const { slug } = await params;
  const quiz = await getQuizBySlug(slug);
  if (!quiz) notFound();

  const url = `${SITE.url}/quiz/${quiz.slug}`;

  return (
    <PageContainer>
      <JsonLd
        data={articleSchema({
          headline: quiz.title,
          description:
            quiz.description ??
            `Free online practice test for ${quiz.subject ?? "GK"}.`,
          url,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Quiz & Mock Tests", path: "/quiz" },
          { name: quiz.title, path: `/quiz/${quiz.slug}` },
        ])}
      />
      <Breadcrumbs
        items={[
          { label: "Quiz & Mock Tests", href: "/quiz" },
          { label: quiz.title },
        ]}
      />

      <PageHeader
        title={quiz.title}
        subtitle={quiz.description ?? undefined}
        meta={`${quiz.questions?.length ?? 0} questions • ${quiz.subject ?? "GK"}`}
      />

      <Panel title="Take the Quiz">
        <QuizRunner quizId={quiz.id} questions={quiz.questions ?? []} />
      </Panel>
    </PageContainer>
  );
}