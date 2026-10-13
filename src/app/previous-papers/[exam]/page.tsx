import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { getExamBySlug } from "@/lib/queries";
import { breadcrumbSchema, faqSchema } from "@/lib/seo";
import { JsonLd } from "@/components/ui/JsonLd";
import { SITE } from "@/lib/site";

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: PageProps<"/previous-papers/[exam]">): Promise<Metadata> {
  const { exam } = await params;
  const record = await getExamBySlug(exam);
  if (!record) return { title: "Exam Not Found" };
  return {
    title: {
      absolute: `${record.name} Previous Year Question Papers — Official PDFs`,
    },
    description: `Previous year question papers for ${record.name}: official question paper PDFs released by the conducting body, with links to the syllabus and exam pattern. Papers are linked from official sources only.`,
    alternates: { canonical: `/previous-papers/${exam}` },
    robots: { index: true, follow: true },
  };
}

/**
 * Previous year papers (Phase 4B).
 *
 * RULE: we only list papers that the conducting body itself published, linked
 * from an official domain. Coaching-site mirrors and paid material are never
 * used. When the body has not published a paper, the page says so plainly
 * instead of inventing a download link.
 */
export default async function PreviousPapersPage({
  params,
}: PageProps<"/previous-papers/[exam]">) {
  const { exam } = await params;
  const record = await getExamBySlug(exam);
  if (!record) notFound();

  const url = `${SITE.url}/previous-papers/${exam}`;
  const papers = Array.isArray(record.previous_year_papers)
    ? record.previous_year_papers
    : [];

  const byYear = new Map<number, { year: number; link: string; label?: string }[]>();
  for (const paper of papers) {
    const list = byYear.get(paper.year) ?? [];
    list.push({ year: paper.year, link: paper.link, label: paper.label });
    byYear.set(paper.year, list);
  }
  const years = [...byYear.keys()].sort((a, b) => b - a);

  const faqs = [
    {
      question: `${record.name} ki previous year papers kahan se milte hain?`,
      answer:
        "Only from the conducting body's own website. Most commissions upload the question papers they actually used to the used-paper section of their portal shortly after each exam. We link to those official PDFs and never to coaching-site mirrors or paid material.",
    },
    {
      question: "Kya har saal ka paper available hota hai?",
      answer:
        "No. Many bodies publish papers only for recent years, and some publish only the question paper without the final answer key. If a year is missing here, it means the body has not released it publicly yet.",
    },
    {
      question: "Answer key kahan se dekhein?",
      answer:
        "The official answer key is usually published alongside the paper or with the result. Check the exam page and the conducting body's site — this site never provides unofficial or compiled answer keys.",
    },
  ];

  return (
    <PageContainer>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Exams", path: "/exams" },
          { name: record.name, path: `/exams/${exam}` },
          { name: "Previous Papers", path: `/previous-papers/${exam}` },
        ])}
      />
      <JsonLd data={faqSchema({ faqs, url, headline: `${record.name} Previous Papers` })} />

      <Breadcrumbs
        items={[
          { label: "Exams", href: "/exams" },
          { label: record.name, href: `/exams/${exam}` },
          { label: "Previous Papers" },
        ]}
      />

      <PageHeader
        title={`${record.name} — Previous Year Question Papers`}
        subtitle={`Official question papers released by ${record.conducting_body ?? "the conducting body"}. Papers from coaching sites or paid material are never listed.`}
      />

      {years.length > 0 ? (
        <section aria-labelledby="papers" className="mb-5">
          <h2 id="papers" className="mb-2 font-serif text-base font-bold text-navy">
            Available papers ({years.length} year{years.length > 1 ? "s" : ""})
          </h2>
          <ul className="space-y-2">
            {years.map((year) => (
              <li key={year} className="rounded-sm border border-rule bg-surface p-3">
                <h3 className="font-serif text-sm font-bold text-navy">{year}</h3>
                <ul className="mt-1 space-y-1">
                  {(byYear.get(year) ?? []).map((paper, i) => (
                    <li key={i}>
                      <a
                        href={paper.link}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="text-sm font-semibold text-navy underline decoration-navy/30 underline-offset-2 hover:decoration-navy"
                      >
                        Download {paper.label ?? `${record.short_name ?? record.name} ${year}`} question paper (PDF) ↗
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section aria-labelledby="no-papers" className="gov-panel mb-5">
          <div className="gov-panel-title" id="no-papers">
            No official papers published yet
          </div>
          <div className="space-y-2 p-3 text-sm text-ink-muted">
            <p>
              {record.conducting_body ?? "The conducting body"} has not
              released official question papers for this exam on its own
              website, so there is nothing for us to link to. We never fill
              this gap with coaching-site copies or paid material.
            </p>
            <p>
              Check the{" "}
              <a
                href={`/exams/${exam}`}
                className="font-semibold text-navy underline decoration-navy/30 underline-offset-2 hover:decoration-navy"
              >
                {record.name} exam page
              </a>{" "}
              for the syllabus and exam pattern in the meantime — used papers
              usually appear there first.
            </p>
          </div>
        </section>
      )}

      <section aria-labelledby="related" className="mb-5">
        <h2 id="related" className="mb-2 font-serif text-base font-bold text-navy">
          Related
        </h2>
        <ul className="flex flex-wrap gap-2">
          <li>
            <Link
              href={`/exams/${exam}`}
              className="inline-block rounded-sm border border-rule bg-surface px-3 py-1.5 text-sm font-semibold text-navy no-underline hover:border-navy-400 hover:bg-navy-50"
            >
              {record.name} exam details
            </Link>
          </li>
          {record.syllabus?.slug ? (
            <li>
              <Link
                href={`/syllabus/${record.syllabus.slug}`}
                className="inline-block rounded-sm border border-rule bg-surface px-3 py-1.5 text-sm font-semibold text-navy no-underline hover:border-navy-400 hover:bg-navy-50"
              >
                Syllabus
              </Link>
            </li>
          ) : null}
        </ul>
      </section>

      <section aria-labelledby="faqs" className="mb-5">
        <h2 id="faqs" className="mb-2 font-serif text-base font-bold text-navy">
          Frequently asked questions
        </h2>
        <ul className="space-y-2">
          {faqs.map((faq) => (
            <li key={faq.question} className="rounded-sm border border-rule bg-surface p-3">
              <h3 className="text-sm font-bold text-navy">{faq.question}</h3>
              <p className="mt-1 text-sm text-ink-muted">{faq.answer}</p>
            </li>
          ))}
        </ul>
      </section>
    </PageContainer>
  );
}