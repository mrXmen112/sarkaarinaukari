import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { DetailTable, DataTable } from "@/components/ui/DataTable";
import { JsonLd } from "@/components/ui/JsonLd";
import {
  PageContainer,
  PageHeader,
  Panel,
} from "@/components/layout/PageContainer";
import {
  ExternalLinkRow,
  JobLinkPanel,
  UpdateDeadlineBadge,
} from "@/components/updates/UpdatePanels";
import { formatDate } from "@/lib/date";
import {
  getAllSyllabusSlugs,
  getExamBySyllabus,
  getSyllabusBySlug,
  listJobsBySyllabus,
} from "@/lib/queries";
import { articleSchema, breadcrumbSchema } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { truncate } from "@/lib/utils";
import type { Syllabus } from "@/types/database";

export const revalidate = 10800; // 3 hours

export async function generateStaticParams() {
  const slugs = await getAllSyllabusSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/syllabus/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const syllabus = await getSyllabusBySlug(slug);
  if (!syllabus) return { title: "Syllabus Not Found" };

  const title = `${syllabus.exam_name} — Syllabus & Exam Topics`;
  return {
    title,
    description: truncate(
      `Complete ${syllabus.exam_name} syllabus with stage-wise subjects and topics. Covers every section you must prepare before the exam.`,
      158,
    ),
    alternates: { canonical: `/syllabus/${syllabus.slug}` },
  };
}

export default async function SyllabusDetailPage({
  params,
}: PageProps<"/syllabus/[slug]">) {
  const { slug } = await params;
  const syllabus = await getSyllabusBySlug(slug);
  if (!syllabus) notFound();

  const exam = await getExamBySyllabus(syllabus.id);
  const jobs = await listJobsBySyllabus(syllabus.id);

  return (
    <PageContainer>
      <JsonLd data={articleSchema({
        headline: `${syllabus.exam_name} Syllabus`,
        description: `${syllabus.exam_name} stage-wise syllabus and topics.`,
        url: `${SITE.url}/syllabus/${syllabus.slug}`,
      })} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Syllabus", path: "/exams" },
          { name: syllabus.exam_name, path: `/syllabus/${syllabus.slug}` },
        ])}
      />

      <Breadcrumbs
        items={[{ label: "Syllabus", href: "/exams" }, { label: syllabus.exam_name }]}
      />

      <header className="mb-4 border-b-2 border-navy pb-3">
        <h1 className="text-2xl md:text-3xl">{syllabus.exam_name} — Syllabus</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {syllabus.stage ? `Stage: ${syllabus.stage}` : "Stage-wise syllabus"}
        </p>
      </header>

      {(syllabus.subjects ?? []).map((subject, i) => (
        <Panel key={subject.subject} title={subject.subject} className="mb-4">
          <div className="mb-2 text-xs font-semibold tracking-wide text-ink-muted uppercase">
            Topics ({subject.topics?.length ?? 0})
          </div>
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            {(subject.topics ?? []).map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
        </Panel>
      ))}

      <Panel title="Related Exam" className="mb-4">
        {exam ? (
          <p className="text-sm">
            This syllabus belongs to the{" "}
            <Link href={`/exams/${exam.slug}`} className="font-semibold text-navy no-underline hover:text-alert hover:underline">
              {exam.name}
            </Link>{" "}
            exam — see the full preparation guide including exam pattern, cutoffs and FAQ.
          </p>
        ) : (
          <p className="text-sm text-ink-muted">No exam guide linked yet.</p>
        )}
      </Panel>

      {jobs.map((job) => (
        <JobLinkPanel key={job.id} job={job} />
      ))}
    </PageContainer>
  );
}
