import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { DetailTable } from "@/components/ui/DataTable";
import { JsonLd } from "@/components/ui/JsonLd";
import { PageContainer, PageHeader, Panel } from "@/components/layout/PageContainer";
import { ExternalLinkRow, JobLinkPanel } from "@/components/updates/UpdatePanels";
import { formatDate, toISODate } from "@/lib/date";
import {
  getAllExamSlugs,
  getExamBySlug,
  listJobsBySyllabus,
} from "@/lib/queries";
import { articleSchema, breadcrumbSchema, faqSchema } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { FAQSection } from "@/components/ui/FAQSection";
import { ShareButtons } from "@/components/ui/ShareButtons";
import { truncate } from "@/lib/utils";
import type { ExamPatternStage } from "@/types/database";

export const revalidate = 10800; // 3h — books/FAQs rarely change but links do

export async function generateStaticParams() {
  const slugs = await getAllExamSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/exams/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const exam = await getExamBySlug(slug);
  if (!exam) return { title: "Exam Not Found" };

  const title = `${exam.name} 2026 — ${exam.conducting_body ?? "Preparation Guide"}`;
  return {
    title,
    description: truncate(
      exam.overview ??
        `Complete preparation guide for ${exam.name}: eligibility, exam pattern, syllabus, books, previous year papers and FAQs.`,
      158,
    ),
    alternates: { canonical: `/exams/${exam.slug}` },
    openGraph: {
      type: "article",
      title,
      description: truncate(exam.overview ?? "", 158),
      url: `${SITE.url}/exams/${exam.slug}`,
    },
    robots: { index: true, follow: true },
  };
}

export default async function ExamDetailPage({
  params,
}: PageProps<"/exams/[slug]">) {
  const { slug } = await params;
  const exam = await getExamBySlug(slug);
  if (!exam) notFound();

  const relatedJobs = exam.syllabus_id
    ? await listJobsBySyllabus(exam.syllabus_id, 6)
    : [];

  const faqs = (exam.faqs ?? []).map((f) => ({
    question: f.question,
    answer: f.answer,
  }));

  // Add dynamic FAQs if not enough from DB
  if (faqs.length < 3) {
    const extraFAQs = [
      {
        question: `${exam.name} ke liye eligibility criteria kya hai?`,
        answer: exam.eligibility ?? "Eligibility criteria are as per the official notification.",
      },
      {
        question: "Exam pattern kya hai?",
        answer: exam.exam_pattern && exam.exam_pattern.length > 0
          ? `${exam.exam_pattern.length} stage(s): ${exam.exam_pattern.map((s) => s.stage).join(", ")}.`
          : "Exam pattern is as per the official notification.",
      },
      {
        question: `Apply karne ki last date kab hai?`,
        answer: `Please check the official notification for application dates. Visit the conducting body's website for the latest updates.`,
      },
    ];
    for (const f of extraFAQs) {
      if (!faqs.some((x) => x.question === f.question)) faqs.push(f);
    }
  }

  const url = `${SITE.url}/exams/${exam.slug}`;

  return (
    <PageContainer>
      <JsonLd
        data={articleSchema({
          headline: exam.name,
          description: exam.overview ?? undefined,
          datePublished: toISODate(exam.created_at),
          url,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Exams", path: "/exams" },
          { name: exam.name, path: `/exams/${exam.slug}` },
        ])}
      />
      {faqs.length > 0 ? (
        <JsonLd data={faqSchema({ faqs, url, headline: exam.name })} />
      ) : null}

      <Breadcrumbs
        items={[{ label: "Exams", href: "/exams" }, { label: exam.name }]}
      />

      <ShareButtons title={exam.name} url={url} />

      <header className="mb-4 border-b-2 border-rule pb-3">
        <h1 className="text-2xl md:text-3xl">{exam.name}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {exam.conducting_body ?? "Government body"} ·{" "}
          {exam.short_name ?? exam.name}
        </p>
      </header>

      <Panel title="Exam Overview" className="mb-4">
        <p className="text-sm leading-relaxed whitespace-pre-line">
          {exam.overview ?? "Information coming soon."}
        </p>
      </Panel>

      <Panel title="Eligibility Criteria" className="mb-4">
        <p className="text-sm leading-relaxed whitespace-pre-line">
          {exam.eligibility ?? "As per the official notification."}
        </p>
      </Panel>

      <Panel title="Exam Pattern & Stages" className="mb-4">
        <div className="space-y-6">
          {(exam.exam_pattern ?? []).map((stage, i) => (
            <section key={stage.stage ?? i} aria-labelledby={`stage-${i}`}>
              <h2
                id={`stage-${i}`}
                className="gov-section-title mb-2 text-base font-semibold text-navy"
              >
                Stage {i + 1} — {stage.stage}
              </h2>

              {stage.subjects?.length ? (
                <div className="mb-3 overflow-x-auto">
                  <table className="gov-table">
                    <caption className="sr-only">
                      {stage.stage} — subject-wise questions & marks
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col" className="w-1/2">
                          Subject
                        </th>
                        <th scope="col" className="text-center">
                          Questions
                        </th>
                        <th scope="col" className="text-right">
                          Marks
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {stage.subjects.map((s) => (
                        <tr key={s.name}>
                          <td className="font-medium text-ink">
                            {s.name}
                          </td>
                          <td className="text-center tabular-nums text-ink-muted">
                            {s.questions ?? "—"}
                          </td>
                          <td className="text-right tabular-nums text-ink-muted">
                            {s.marks ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm md:grid-cols-3">
                {stage.mode ? (
                  <div>
                    <dt className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
                      Mode
                    </dt>
                    <dd>{stage.mode}</dd>
                  </div>
                ) : null}
                {stage.duration ? (
                  <div>
                    <dt className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
                      Duration
                    </dt>
                    <dd>{stage.duration}</dd>
                  </div>
                ) : null}
                {stage.total_questions != null ? (
                  <div>
                    <dt className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
                      Total Questions
                    </dt>
                    <dd className="tabular-nums">{stage.total_questions}</dd>
                  </div>
                ) : null}
                {stage.total_marks != null ? (
                  <div>
                    <dt className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
                      Total Marks
                    </dt>
                    <dd className="tabular-nums">{stage.total_marks}</dd>
                  </div>
                ) : null}
                {stage.negative_marking ? (
                  <div>
                    <dt className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
                      Negative Marking
                    </dt>
                    <dd>{stage.negative_marking}</dd>
                  </div>
                ) : null}
                {stage.notes ? (
                  <div className="col-span-2 md:col-span-3">
                    <dt className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
                      Note
                    </dt>
                    <dd>{stage.notes}</dd>
                  </div>
                ) : null}
              </dl>
            </section>
          ))}
        </div>
      </Panel>

      <Panel title="Full Syllabus & Preparation" className="mb-4">
        {exam.syllabus ? (
          <p className="mb-3 text-sm leading-relaxed text-ink-muted">
            Stage-wise subject & topic breakdown for this exam.
          </p>
        ) : (
          <p className="mb-3 text-sm leading-relaxed text-ink-muted">
            {exam.preparation_strategy ?? "Preparation guide coming soon."}
          </p>
        )}
      </Panel>

      <JsonLd
        data={breadcrumbSchema([
          { name: "Exams", path: "/exams" },
          { name: exam.name, path: `/exams/${exam.slug}` },
        ])}
      />

      <FAQSection
        title="Frequently Asked Questions"
        faqs={faqs}
        url={url}
        headline={exam.name}
      />
    </PageContainer>
  );
}
