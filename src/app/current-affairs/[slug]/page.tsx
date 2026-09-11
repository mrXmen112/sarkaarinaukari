import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { DetailTable } from "@/components/ui/DataTable";
import { JsonLd } from "@/components/ui/JsonLd";
import { PageContainer, PageHeader, Panel } from "@/components/layout/PageContainer";
import {
  getAllCurrentAffairsSlugs,
  getCurrentAffairBySlug,
} from "@/lib/queries";
import {
  articleSchema,
  breadcrumbSchema,
} from "@/lib/seo";
import { SITE } from "@/lib/site";
import { formatDate } from "@/lib/date";
import { truncate } from "@/lib/utils";

export const revalidate = 10800; // 3 hours

export async function generateStaticParams() {
  const slugs = await getAllCurrentAffairsSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/current-affairs/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const affair = await getCurrentAffairBySlug(slug);
  if (!affair) return { title: "Current Affairs Not Found" };

  const title = affair.title ?? "Current Affairs";
  return {
    title,
    description: truncate(
      affair.content ?? `Daily current affairs for ${formatDate(affair.date)}.`,
      158,
    ),
    alternates: { canonical: `/current-affairs/${affair.slug}` },
    openGraph: {
      type: "article",
      title,
      description: truncate(affair.content ?? "", 158),
      url: `${SITE.url}/current-affairs/${affair.slug}`,
      publishedTime: affair.date,
    },
    robots: { index: true, follow: true },
  };
}

export default async function CurrentAffairDetailPage({
  params,
}: PageProps<"/current-affairs/[slug]">) {
  const { slug } = await params;
  const affair = await getCurrentAffairBySlug(slug);
  if (!affair) notFound();

  const url = `${SITE.url}/current-affairs/${affair.slug}`;

  return (
    <PageContainer>
      <JsonLd
        data={articleSchema({
          headline: affair.title ?? "Current Affairs",
          description:
            affair.content ??
            `Daily current affairs update for ${formatDate(affair.date)}.`,
          url,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Current Affairs", path: "/current-affairs" },
          { name: affair.title ?? "Update", path: `/current-affairs/${affair.slug}` },
        ])}
      />
      <Breadcrumbs
        items={[
          { label: "Current Affairs", href: "/current-affairs" },
          { label: affair.title ?? "Update" },
        ]}
      />

      <PageHeader
        title={affair.title ?? "Current Affairs Update"}
        meta={formatDate(affair.date)}
      />

      <Panel title="Daily Brief">
        {affair.content ? (
          <div className="whitespace-pre-line text-sm leading-relaxed">
            {affair.content}
          </div>
        ) : (
          <p className="text-sm text-ink-muted">
            Full content coming soon. Check back for the complete daily brief.
          </p>
        )}
      </Panel>

      <Panel title="Key Details">
        <DetailTable
          caption="Key details of this current affairs update"
          rows={[
            { label: "Date", value: formatDate(affair.date) },
            { label: "Subject", value: "Current Affairs / GK" },
          ]}
        />
      </Panel>
    </PageContainer>
  );
}