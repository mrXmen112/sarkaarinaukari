import type { Metadata } from "next";
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
import {
  getAllAdmitCardSlugs,
  getAdmitCardBySlug,
} from "@/lib/queries";
import { articleSchema, breadcrumbSchema } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { truncate } from "@/lib/utils";

export const revalidate = 10800; // 3 hours

export async function generateStaticParams() {
  const slugs = await getAllAdmitCardSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/admit-card/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const card = await getAdmitCardBySlug(slug);
  if (!card) return { title: "Admit Card Not Found" };

  const title = `${card.title} — Sarkari Admit Card`;
  return {
    title,
    description: truncate(
      card.description ??
        `Download admit card for ${card.title}. Release date and exam date details.`,
      158,
    ),
    alternates: { canonical: `/admit-card/${card.slug}` },
    openGraph: {
      type: "article",
      title,
      description: truncate(card.description ?? "", 158),
      url: `${SITE.url}/admit-card/${card.slug}`,
      publishedTime: card.release_date ?? undefined,
    },
    robots: { index: true, follow: true },
  };
}

export default async function AdmitCardDetailPage({
  params,
}: PageProps<"/admit-card/[slug]">) {
  const { slug } = await params;
  const card = await getAdmitCardBySlug(slug);
  if (!card) notFound();

  const url = `${SITE.url}/admit-card/${card.slug}`;

  return (
    <PageContainer>
      <JsonLd data={articleSchema({
        headline: card.title,
        description: card.description ?? undefined,
        datePublished: toISODate(card.release_date),
        url,
      })} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Admit Card", path: "/admit-card" },
          { name: card.title, path: `/admit-card/${card.slug}` },
        ])}
      />

      <Breadcrumbs
        items={[
          { label: "Admit Card", href: "/admit-card" },
          { label: card.title },
        ]}
      />

      <header className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b-2 border-navy pb-3">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl">{card.title}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Release Date {formatDate(card.release_date)}
          </p>
        </div>
        <div className="shrink-0">
          <UpdateDeadlineBadge label="Exam Date" date={card.exam_date} />
        </div>
      </header>

      {card.description ? (
        <Panel title="Important Update Details" className="mb-4">
          <p className="text-sm leading-relaxed whitespace-pre-line">
            {card.description}
          </p>
        </Panel>
      ) : null}

      <Panel title="Admit Card Details" className="mb-4">
        <DetailTable
          caption="Admit card details"
          rows={[
            {
              label: "Post / Exam",
              value: card.jobs ? (
                <a
                  href={`/jobs/${card.jobs.slug}`}
                  className="font-semibold text-navy no-underline hover:text-alert hover:underline"
                >
                  {card.jobs.title}
                </a>
              ) : (
                "—"
              ),
            },
            { label: "Release Date", value: formatDate(card.release_date) },
            {
              label: "Exam Date",
              value: card.exam_date
                ? formatDate(card.exam_date)
                : "To be announced",
            },
            {
              label: "Download Status",
              value: card.download_link ? "Available" : "Yet to release",
            },
          ]}
        />
      </Panel>

      <Panel title="Important Links" className="mb-4">
        <ul className="divide-y divide-rule">
          {card.download_link ? (
            <ExternalLinkRow
              href={card.download_link}
              label="Download Admit Card (PDF)"
              icon="pdf"
            />
          ) : null}
          {card.official_link && card.official_link !== card.download_link ? (
            <ExternalLinkRow href={card.official_link} label="Official Website" icon="globe" />
          ) : null}
        </ul>
      </Panel>

      <JobLinkPanel job={card.jobs} />
    </PageContainer>
  );
}