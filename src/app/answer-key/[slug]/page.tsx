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
import { getAllAnswerKeySlugs, getAnswerKeyBySlug } from "@/lib/queries";
import { articleSchema, breadcrumbSchema } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { truncate } from "@/lib/utils";
import type { AnswerKeyType } from "@/types/database";

export const revalidate = 10800; // 3 hours

export async function generateStaticParams() {
  const slugs = await getAllAnswerKeySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/answer-key/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const key = await getAnswerKeyBySlug(slug);
  if (!key) return { title: "Answer Key Not Found" };

  const title = `${key.title} — Sarkari Answer Key`;
  return {
    title,
    description: truncate(
      key.description ??
        `Download the ${key.type ?? ""} answer key for ${key.title}.`,
      158,
    ),
    alternates: { canonical: `/answer-key/${key.slug}` },
    openGraph: {
      type: "article",
      title,
      description: truncate(key.description ?? "", 158),
      url: `${SITE.url}/answer-key/${key.slug}`,
      publishedTime: key.release_date ?? undefined,
    },
    robots: { index: true, follow: true },
  };
}

export default async function AnswerKeyDetailPage({
  params,
}: PageProps<"/answer-key/[slug]">) {
  const { slug } = await params;
  const key = await getAnswerKeyBySlug(slug);
  if (!key) notFound();

  const url = `${SITE.url}/answer-key/${key.slug}`;
  const objectionOpen =
    !!key.objection_last_date &&
    new Date(`${key.objection_last_date}T23:59:59`) >=
      new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00`);

  return (
    <PageContainer>
      <JsonLd data={articleSchema({
        headline: key.title,
        description: key.description ?? undefined,
        datePublished: toISODate(key.release_date),
        url,
      })} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Answer Key", path: "/answer-key" },
          { name: key.title, path: `/answer-key/${key.slug}` },
        ])}
      />

      <Breadcrumbs
        items={[{ label: "Answer Key", href: "/answer-key" }, { label: key.title }]}
      />

      <header className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b-2 border-navy pb-3">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl">{key.title}</h1>
          <p className="mt-1">
            <TypeBadge type={key.type} />
          </p>
        </div>
        <div className="shrink-0">
          {objectionOpen ? (
            <UpdateDeadlineBadge label="Objection Last Date" date={key.objection_last_date} />
          ) : (
            <UpdateDeadlineBadge
              label="Release Date"
              date={key.release_date}
              fallback="—"
            />
          )}
        </div>
      </header>

      {key.description ? (
        <Panel title="Important Update Details" className="mb-4">
          <p className="text-sm leading-relaxed whitespace-pre-line">
            {key.description}
          </p>
        </Panel>
      ) : null}

      <Panel title="Answer Key Details" className="mb-4">
        <DetailTable
          caption="Answer key details"
          rows={[
            {
              label: "Post / Exam",
              value: key.jobs ? (
                <Link
                  href={`/jobs/${key.jobs.slug}`}
                  className="font-semibold text-navy no-underline hover:text-alert hover:underline"
                >
                  {key.jobs.title}
                </Link>
              ) : (
                "—"
              ),
            },
            {
              label: "Key Type",
              value: key.type ? `${key.type[0].toUpperCase()}${key.type.slice(1)}` : "—",
            },
            { label: "Release Date", value: formatDate(key.release_date) },
            {
              label: "Objection Last Date",
              value: key.objection_last_date
                ? formatDate(key.objection_last_date)
                : "No objection window",
            },
          ]}
        />
      </Panel>

      <Panel title="Important Links" className="mb-4">
        <ul className="divide-y divide-rule">
          {key.download_link ? (
            <ExternalLinkRow
              href={key.download_link}
              label="Download Answer Key (PDF)"
              icon="pdf"
            />
          ) : null}
          {key.official_link && key.official_link !== key.download_link ? (
            <ExternalLinkRow href={key.official_link} label="Official Website" icon="globe" />
          ) : null}
        </ul>
      </Panel>

      <JobLinkPanel job={key.jobs} />
    </PageContainer>
  );
}

function TypeBadge({ type }: { type: AnswerKeyType | null }) {
  const isProvisional = type === "provisional";
  return (
    <span
      className={
        isProvisional
          ? "inline-block rounded-sm bg-alert-bg px-2 py-0.5 text-xs font-bold text-alert"
          : "inline-block rounded-sm bg-navy-50 px-2 py-0.5 text-xs font-bold text-navy"
      }
    >
      {isProvisional ? "Provisional Answer Key" : "Final Answer Key"}
    </span>
  );
}