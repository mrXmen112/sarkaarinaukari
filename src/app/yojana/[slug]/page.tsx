import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { DetailTable } from "@/components/ui/DataTable";
import { JsonLd } from "@/components/ui/JsonLd";
import { PageContainer, PageHeader, Panel } from "@/components/layout/PageContainer";
import { ExternalLinkRow } from "@/components/updates/UpdatePanels";
import {
  getAllYojanaSlugs,
  getYojanaBySlug,
} from "@/lib/queries";
import {
  articleSchema,
  breadcrumbSchema,
} from "@/lib/seo";
import { SITE } from "@/lib/site";
import { formatDate } from "@/lib/date";
import { truncate } from "@/lib/utils";

export const revalidate = 21600; // 6 hours

export async function generateStaticParams() {
  const slugs = await getAllYojanaSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/yojana/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const yojana = await getYojanaBySlug(slug);
  if (!yojana) return { title: "Yojana Not Found" };

  const title = `${yojana.title} — Benefits, Eligibility & How to Apply`;
  return {
    title,
    description: truncate(
      yojana.benefits_summary ??
        `Detailed guide to the ${yojana.title} scheme — eligibility, benefits, documentsaine, and how to apply online.`,
      158,
    ),
    alternates: { canonical: `/yojana/${yojana.slug}` },
    openGraph: {
      type: "article",
      title,
      description: truncate(yojana.benefits_summary ?? "", 158),
      url: `${SITE.url}/yojana/${yojana.slug}`,
      publishedTime: yojana.updated_at,
    },
    robots: { index: true, follow: true },
  };
}

export default async function YojanaDetailPage({
  params,
}: PageProps<"/yojana/[slug]">) {
  const { slug } = await params;
  const yojana = await getYojanaBySlug(slug);
  if (!yojana) notFound();

  const url = `${SITE.url}/yojana/${yojana.slug}`;

  return (
    <PageContainer>
      <JsonLd
        data={articleSchema({
          headline: yojana.title,
          description:
            yojana.benefits_summary ??
            `Complete details of the ${yojana.title} yojana — eligibility, benefits, documents, and how to apply.`,
          url,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Sarkari Yojana", path: "/yojana" },
          { name: yojana.title, path: `/yojana/${yojana.slug}` },
        ])}
      />

      <Breadcrumbs
        items={[
          { label: "Sarkari Yojana", href: "/yojana" },
          { label: yojana.title },
        ]}
      />

      <header className="mb-4 border-b-2 border-navy pb-3">
        <h1 className="text-2xl md:text-3xl">{yojana.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {yojana.level === "central"
            ? "Central Government Scheme"
            : yojana.level === "state"
              ? `State Government (${yojana.state ?? "—"})`
              : "Government Scheme"}
        </p>
      </header>

      <Panel title="Yojana Details" className="mb-4">
        <DetailTable
          caption={`${yojana.title} scheme details`}
          rows={[
            { label: "Scheme Name", value: yojana.title },
            {
              label: "Type",
              value:
                yojana.level === "central"
                  ? "Central Government"
                  : yojana.level === "state"
                    ? `State Government (${yojana.state ?? "—"})`
                    : "—",
            },
            {
              label: "Key Benefits",
              value: yojana.benefits_summary ?? "—",
            },
            {
              label: "Last Updated",
              value: formatDate(yojana.updated_at),
            },
          ]}
        />
      </Panel>

      {yojana.eligibility ? (
        <Panel title="Eligibility" className="mb-4">
          <div className="whitespace-pre-line text-sm leading-relaxed">
            {yojana.eligibility}
          </div>
        </Panel>
      ) : null}

      {yojana.benefits ? (
        <Panel title="Benefits" className="mb-4">
          <div className="whitespace-pre-line text-sm leading-relaxed">
            {yojana.benefits}
          </div>
        </Panel>
      ) : null}

      {yojana.how_to_apply ? (
        <Panel title="How to Apply" className="mb-4">
          <div className="whitespace-pre-line text-sm leading-relaxed">
            {yojana.how_to_apply}
          </div>
        </Panel>
      ) : null}

      <Panel title="Important Links" className="mb-4">
        <ul className="divide-y divide-rule">
          {yojana.official_link ? (
            <ExternalLinkRow
              href={yojana.official_link}
              label="Official Website / Apply Online"
              icon="globe"
            />
          ) : null}
        </ul>
      </Panel>
    </PageContainer>
  );
}
