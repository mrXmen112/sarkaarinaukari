import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { DetailTable } from "@/components/ui/DataTable";
import { JsonLd } from "@/components/ui/JsonLd";
import { PageContainer, PageHeader, Panel } from "@/components/layout/PageContainer";
import { ExternalLinkRow } from "@/components/updates/UpdatePanels";
import { formatDate } from "@/lib/date";
import { getAllUpcomingSlugs, getUpcomingBySlug } from "@/lib/upcoming";
import { breadcrumbSchema, buildMeta } from "@/lib/seo";

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getAllUpcomingSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/jobs/coming-soon/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const row = await getUpcomingBySlug(slug);
  if (!row) return { title: "Recruitment Not Found" };
  return buildMeta({
    kind: "page",
    title: `${row.title} — Official Dates & Updates`,
    description: `${row.organization}: ${row.status.replace(/_/g, " ")}. Notification ${row.notification_date ? formatDate(row.notification_date) : "not yet announced"}. Verified against the official recruitment calendar.`,
    path: `/jobs/coming-soon/${row.slug}`,
    robots: { index: row.is_published, follow: true },
  });
}

export default async function ComingSoonDetailPage({
  params,
}: PageProps<"/jobs/coming-soon/[slug]">) {
  const { slug } = await params;
  const row = await getUpcomingBySlug(slug);
  if (!row) notFound();

  return (
    <PageContainer>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Coming Soon Jobs", path: "/jobs/coming-soon" },
          { name: row.title, path: `/jobs/coming-soon/${row.slug}` },
        ])}
      />
      <Breadcrumbs
        items={[
          { label: "Coming Soon Jobs", href: "/jobs/coming-soon" },
          { label: row.title },
        ]}
      />
      <PageHeader
        title={row.title}
        subtitle={`${row.organization} · ${row.level === "central" ? "Central Government" : row.level === "ut" ? "Union Territory" : "State Government"}`}
        meta={`${row.status.replace(/_/g, " ")} · ${row.date_confidence} dates`}
      />

      <Panel title="Official Schedule" className="mb-4">
        <DetailTable
          caption={`${row.title} official schedule`}
          rows={[
            { label: "Recruitment", value: row.title },
            { label: "Organization", value: row.organization },
            {
              label: "Government level",
              value:
                row.level === "central"
                  ? "Central Government"
                  : row.level === "ut"
                    ? `Union Territory${row.state ? ` · ${row.state}` : ""}`
                    : `State Government${row.state ? ` · ${row.state}` : ""}`,
            },
            { label: "Status", value: row.status.replace(/_/g, " ") },
            { label: "Date confidence", value: row.date_confidence },
            {
              label: "Notification date",
              value: row.notification_date ? formatDate(row.notification_date) : "Not yet announced",
            },
            {
              label: "Application last date",
              value: row.application_end ? formatDate(row.application_end) : "Not yet announced",
            },
            { label: "Examination date", value: row.exam_date ? formatDate(row.exam_date) : "Not yet announced" },
            { label: "Last verified", value: formatDate(row.last_verified_at) },
          ]}
        />
      </Panel>

      {row.eligibility_note ? (
        <Panel title="Important eligibility note" className="mb-4">
          <p className="text-sm leading-relaxed">{row.eligibility_note}</p>
        </Panel>
      ) : null}

      <Panel title="Detailed notification" className="mb-4">
        <p className="mb-3 text-sm leading-relaxed text-ink-muted">
          {row.status === "notification_scheduled"
            ? "The notification date is officially scheduled. Vacancies, eligibility, fee and salary will be published only when the detailed advertisement is released — we do not publish estimates."
            : "Dates are taken from an official tentative calendar and may change. Wait for the detailed advertisement before planning an application."}
        </p>
        <ul className="divide-y divide-rule">
          {row.calendar_url ? (
            <ExternalLinkRow href={row.calendar_url} label="Official calendar" icon="globe" />
          ) : null}
          {row.notification_url ? (
            <ExternalLinkRow href={row.notification_url} label="Official notification" icon="pdf" />
          ) : null}
          {row.apply_url ? (
            <ExternalLinkRow href={row.apply_url} label="Apply online (official)" icon="globe" />
          ) : null}
        </ul>
      </Panel>

      <p className="text-sm">
        <Link href="/jobs/coming-soon" className="font-semibold text-navy underline">
          ← Back to all coming soon jobs
        </Link>
      </p>
    </PageContainer>
  );
}
