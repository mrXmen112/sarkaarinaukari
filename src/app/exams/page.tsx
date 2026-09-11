import type { Metadata } from "next";
import Link from "next/link";

import { DataTable } from "@/components/ui/DataTable";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/ui/JsonLd";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { listExams } from "@/lib/queries";
import { breadcrumbSchema } from "@/lib/seo";

export const revalidate = 86400; // 24h — evergreen prep content (Section 5)

export const metadata: Metadata = {
  title: "Competitive Exams 2026 — Sarkari Exam Preparation",
  description:
    "Complete preparation guides for state & central government competitive exams: SSC CGL, BPSC 70th, IBPS PO, SSC GD, RRB Group D and UPSC CSE — syllabus, pattern, books, cutoffs and FAQs.",
  alternates: { canonical: "/exams" },
};

export default async function ExamsListingPage() {
  const exams = await listExams(100);

  return (
    <PageContainer>
      <JsonLd data={breadcrumbSchema([{ name: "Exams", path: "/exams" }])} />
      <Breadcrumbs items={[{ label: "Exams" }]} />

      <PageHeader
        title="Competitive Exams — Sarkari Exam Preparation 2026"
        subtitle="Structured preparation guides for the country's biggest government recruitment exams."
        meta={
          exams.length > 0
            ? `Preparation guides for ${exams.length} competitive exams`
            : "No exam guides published yet"
        }
      />

      <DataTable
        columns={[
          {
            key: "name",
            header: "Exam",
            cell: (exam) => (
              <div>
                <Link
                  href={`/exams/${exam.slug}`}
                  className="font-semibold text-navy no-underline hover:text-alert hover:underline"
                >
                  {exam.name}
                </Link>
                <div className="mt-0.5 text-xs text-ink-muted">
                  {exam.short_name ?? "—"}
                </div>
              </div>
            ),
          },
          {
            key: "body",
            header: "Conducting Body",
            hideBelow: "md",
            cell: (exam) => (
              <span className="text-ink-muted">{exam.conducting_body ?? "—"}</span>
            ),
          },
          {
            key: "stages",
            header: "Exam Stages",
            align: "center",
            hideBelow: "sm",
            cell: (exam) => (
              <span className="tabular-nums text-ink-muted">
                {exam.exam_pattern?.length ?? 0}
              </span>
            ),
          },
          {
            key: "syllabus",
            header: "Syllabus",
            align: "right",
            cell: (exam) =>
              exam.syllabus ? (
                <Link
                  href={`/syllabus/${exam.syllabus.slug}`}
                  className="font-semibold text-navy no-underline hover:text-alert hover:underline"
                >
                  View →
                </Link>
              ) : (
                <span className="text-ink-faint">—</span>
              ),
          },
        ]}
        rows={exams}
        rowKey={(exam) => exam.slug}
        caption="Competitive exam preparation guides"
        serialNumbers
        empty={
          <p>No exam preparation guides published yet. Check back soon.</p>
        }
      />
    </PageContainer>
  );
}
