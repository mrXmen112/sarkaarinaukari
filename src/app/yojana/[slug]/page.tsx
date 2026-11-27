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
import { articleSchema, breadcrumbSchema, buildMeta } from "@/lib/seo";
import { yojanaCategoryLabel, yojanaLevelLabel } from "@/lib/yojana";
import { SITE } from "@/lib/site";
import { robotsFor, yojanaContentChars } from "@/lib/indexable";
import { FAQSection } from "@/components/ui/FAQSection";
import { ShareButtons } from "@/components/ui/ShareButtons";
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

  // buildMeta gives this page the same absolute canonical, title/description
  // limits and social tags as every other content template.
  return buildMeta({
    kind: "yojana",
    title: `${yojana.title} — Benefits & Eligibility`,
    description: truncate(
      yojana.benefits_summary ??
        `Official details for ${yojana.title}: eligibility, benefits, required documents and application procedure.`,
      158,
    ),
    path: `/yojana/${yojana.slug}`,
    publishedTime: yojana.updated_at,
    robots: robotsFor({
      kind: "yojana",
      contentChars: yojanaContentChars(yojana),
      officialSourceUrl: yojana.official_link,
      lastVerifiedAt: yojana.last_verified_at,
      isPublished: yojana.is_published,
    }),
  });
}

export default async function YojanaDetailPage({
  params,
}: PageProps<"/yojana/[slug]">) {
  const { slug } = await params;
  const yojana = await getYojanaBySlug(slug);
  if (!yojana) notFound();

  const url = `${SITE.url}/yojana/${yojana.slug}`;

  const yojanaFAQs = [
    {
      question: `${yojana.title} ka eligibility kya hai?`,
      answer: yojana.eligibility ?? "Eligibility criteria are as per the official scheme notification.",
    },
    {
      question: "Scheme ke benefits kya hain?",
      answer: yojana.benefits_summary ?? yojana.benefits ?? "Benefits are as per the official scheme notification.",
    },
    {
      question: "Kaise apply karein?",
      answer: yojana.how_to_apply ?? "Apply through the official government portal or the nearest designated office.",
    },
    {
      question: "Official link kya hai?",
      answer: yojana.official_link ? `Visit ${yojana.official_link} for official details and application.` : "Please check the official government website for updates.",
    },
  ];

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

      <ShareButtons title={yojana.title} url={url} />

      <header className="mb-4 border-b-2 border-navy pb-3">
        <h1 className="text-2xl md:text-3xl">{yojana.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {yojanaLevelLabel(yojana.level)}
          {yojana.state ? ` · ${yojana.state.replace(/-/g, " ")}` : ""}
          {" · "}
          {yojanaCategoryLabel(yojana.category)}
          {" · "}
          <span className="capitalize">{yojana.availability_status}</span>
        </p>
      </header>

      <Panel title="Yojana Details" className="mb-4">
        <DetailTable
          caption={`${yojana.title} scheme details`}
          rows={[
            { label: "Scheme Name", value: yojana.title },
            { label: "Government Level", value: yojanaLevelLabel(yojana.level) },
            {
              label: "Applicable State / UT",
              value: yojana.state ? yojana.state.replace(/-/g, " ") : "All India",
            },
            { label: "Category", value: yojanaCategoryLabel(yojana.category) },
            { label: "Availability", value: yojana.availability_status },
            {
              label: "Key Benefits",
              value: yojana.benefits_summary ?? "—",
            },
            {
              label: "Last Verified",
              value: yojana.last_verified_at
                ? formatDate(yojana.last_verified_at)
                : "Not yet verified",
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

      {yojana.required_documents ? (
        <Panel title="Required Documents" className="mb-4">
          <div className="whitespace-pre-line text-sm leading-relaxed">
            {yojana.required_documents}
          </div>
        </Panel>
      ) : null}

      {yojana.how_to_apply ? (
        <Panel title="Application Procedure" className="mb-4">
          <div className="whitespace-pre-line text-sm leading-relaxed">
            {yojana.how_to_apply}
          </div>
        </Panel>
      ) : null}

      <Panel title="Important Links" className="mb-4">
        <ul className="divide-y divide-rule">
          {yojana.apply_url ? (
            <ExternalLinkRow
              href={yojana.apply_url}
              label="Apply Online (Official)"
              icon="globe"
            />
          ) : null}
          {yojana.official_link ? (
            <ExternalLinkRow
              href={yojana.official_link}
              label="Official Scheme Page"
              icon="globe"
            />
          ) : null}
        </ul>
      </Panel>

      <FAQSection
        title="Frequently Asked Questions"
        faqs={yojanaFAQs}
        url={url}
        headline={yojana.title}
      />
    </PageContainer>
  );
}
