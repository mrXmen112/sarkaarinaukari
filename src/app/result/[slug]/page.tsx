import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { DetailTable } from "@/components/ui/DataTable";
import { JsonLd } from "@/components/ui/JsonLd";
import { PageContainer, Panel } from "@/components/layout/PageContainer";
import {
  ExternalLinkRow,
  JobLinkPanel,
  UpdateDeadlineBadge,
} from "@/components/updates/UpdatePanels";
import { formatDate, toISODate } from "@/lib/date";
import { getAllResultSlugs, getResultBySlug } from "@/lib/queries";
import { articleSchema, breadcrumbSchema } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { categoryLabel, truncate } from "@/lib/utils";
import type { ResultCutoff } from "@/types/database";

export const revalidate = 10800; // 3 hours

export async function generateStaticParams() {
  const slugs = await getAllResultSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/result/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const result = await getResultBySlug(slug);
  if (!result) return { title: "Result Not Found" };

  const title = `${result.title} — Sarkari Result`;
  return {
    title,
    description: truncate(
      result.description ??
        `Result details and category-wise cutoff marks for ${result.title}.`,
      158,
    ),
    alternates: { canonical: `/result/${result.slug}` },
    openGraph: {
      type: "article",
      title,
      description: truncate(result.description ?? "", 158),
      url: `${SITE.url}/result/${result.slug}`,
      publishedTime: result.result_date ?? undefined,
    },
    robots: { index: true, follow: true },
  };
}

export default async function ResultDetailPage({
  params,
}: PageProps<"/result/[slug]">) {
  const { slug } = await params;
  const result = await getResultBySlug(slug);
  if (!result) notFound();

  const url = `${SITE.url}/result/${result.slug}`;
  const cutoff = normalizeCutoff(result.cutoff_data);

  return (
    <PageContainer>
      <JsonLd data={articleSchema({
        headline: result.title,
        description: result.description ?? undefined,
        datePublished: toISODate(result.result_date),
        url,
      })} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Result", path: "/result" },
          { name: result.title, path: `/result/${result.slug}` },
        ])}
      />

      <Breadcrumbs
        items={[{ label: "Result", href: "/result" }, { label: result.title }]}
      />

      <header className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b-2 border-navy pb-3">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl">{result.title}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Declared {formatDate(result.result_date)}
          </p>
        </div>
        <div className="shrink-0">
          <UpdateDeadlineBadge
            label="Result Date"
            date={result.result_date}
            fallback="—"
          />
        </div>
      </header>

      {result.description ? (
        <Panel title="Important Update Details" className="mb-4">
          <p className="text-sm leading-relaxed whitespace-pre-line">
            {result.description}
          </p>
        </Panel>
      ) : null}

      <Panel title="Result Details" className="mb-4">
        <DetailTable
          caption="Result details"
          rows={[
            {
              label: "Post / Exam",
              value: result.jobs ? (
                <Link
                  href={`/jobs/${result.jobs.slug}`}
                  className="font-semibold text-navy no-underline hover:text-alert hover:underline"
                >
                  {result.jobs.title}
                </Link>
              ) : (
                "—"
              ),
            },
            { label: "Result Date", value: formatDate(result.result_date) },
          ]}
        />
      </Panel>

      {cutoff.length > 0 ? (
        <Panel title="Cutoff Marks (Category-wise)" className="mb-4">
          <CutoffTable rows={cutoff} />
        </Panel>
      ) : null}

      <Panel title="Important Links" className="mb-4">
        <ul className="divide-y divide-rule">
          {result.merit_list_link ? (
            <ExternalLinkRow
              href={result.merit_list_link}
              label="Download Merit List / Check Result"
              icon="pdf"
            />
          ) : null}
          {result.official_link ? (
            <ExternalLinkRow href={result.official_link} label="Official Website" icon="globe" />
          ) : null}
        </ul>
      </Panel>

      <JobLinkPanel job={result.jobs} />
    </PageContainer>
  );
}

function normalizeCutoff(data: ResultCutoff | null): [string, number | string][] {
  if (!data) return [];
  return Object.entries(data).sort((a, b) => {
    const na = Number(a[1]);
    const nb = Number(b[1]);
    if (Number.isFinite(na) && Number.isFinite(nb)) return nb - na;
    return 0;
  });
}

function CutoffTable({
  rows,
}: {
  rows: [string, number | string][];
}) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="gov-table">
        <caption className="sr-only">Category-wise cutoff marks</caption>
        <tbody>
          {rows.map(([key, value]) => (
            <tr key={key}>
              <th
                scope="row"
                className="w-2/5 border-t border-r border-rule bg-navy-50 px-2.5 py-2 text-left align-top font-sans text-sm font-semibold text-navy"
              >
                {categoryLabel(key)}
              </th>
              <td className="font-semibold tabular-nums">{String(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}