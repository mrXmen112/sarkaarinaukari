import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { BOARDS, BOARDS_BY_SLUG } from "@/lib/boards";
import { breadcrumbSchema, faqSchema } from "@/lib/seo";
import { JsonLd } from "@/components/ui/JsonLd";
import { SITE } from "@/lib/site";

export const revalidate = 86400;

export function generateStaticParams() {
  return BOARDS.map((board) => ({ slug: board.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/result/boards/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const board = BOARDS_BY_SLUG[slug];
  if (!board) return { title: "Board Not Found" };
  const cls = board.classes.join(" & ");
  return {
    title: {
      absolute: `${board.name} ${cls} Result 2026 — Check on Official Website`,
    },
    description: `How to check ${board.name} ${cls} result on the official portal (${board.portalHost}): step-by-step guide, what you need, re-evaluation and compartment information. We never store your roll number or marks.`,
    alternates: { canonical: `/result/boards/${board.slug}` },
    robots: { index: true, follow: true },
  };
}

export default async function BoardResultPage({
  params,
}: PageProps<"/result/boards/[slug]">) {
  const { slug } = await params;
  const board = BOARDS_BY_SLUG[slug];
  if (!board) notFound();

  const url = `${SITE.url}/result/boards/${board.slug}`;
  const clsLabel = board.classes.join(" & ");

  const faqs = [
    {
      question: `${board.name} result kaise check karein?`,
      answer: `Open the official portal at ${board.portalHost}, choose the result link for ${clsLabel}, and enter the details the board asks for — usually your roll number and date of birth as printed on the admit card. This page never asks for those details; we only link to the official site.`,
    },
    {
      question: `${board.name} result ke liye kya kya chahiye?`,
      answer: board.needs,
    },
    {
      question: "Result dekhne ke liye fees lagti hai kya?",
      answer:
        "No. Checking a board result on the official portal is free of charge. Any site asking for a fee to show you a result is not the board's official portal.",
    },
    {
      question: "Marks ya roll number kya ye website store karti hai?",
      answer:
        "No. SarkaariNaukri.online never asks for, receives or stores a student's roll number, marks or personal details. Every check happens on the board's own website.",
    },
  ];

  return (
    <PageContainer>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Result", path: "/result" },
          { name: `Class ${board.classes[0]}`, path: `/result/${board.classes[0]}` },
          { name: board.name, path: `/result/boards/${board.slug}` },
        ])}
      />
      <JsonLd data={faqSchema({ faqs, url, headline: board.name })} />

      <Breadcrumbs
        items={[
          { label: "Result", href: "/result" },
          { label: `Class ${board.classes[0]}`, href: `/result/${board.classes[0]}` },
          { label: board.name },
        ]}
      />

      <PageHeader
        title={`${board.name} — ${clsLabel} Result`}
        subtitle={board.note}
      />

      <div className="mb-5 rounded-sm border-2 border-saffron bg-saffron-bg p-4">
        <p className="text-sm font-bold text-navy">
          Check your result on the official website
        </p>
        <p className="mt-1 text-sm text-ink">
          You will be redirected to{" "}
          <strong className="text-navy">{board.portalHost}</strong>, the
          board&apos;s own portal. We never collect your roll number or marks.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <a
            href={board.portalUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="gov-btn"
          >
            Check {clsLabel} Result on {board.portalHost} ↗
          </a>
          <span className="text-xs text-ink-muted">
            Portal verified {board.verified}
          </span>
        </div>
      </div>

      <section aria-labelledby="steps" className="gov-panel mb-4">
        <div className="gov-panel-title" id="steps">
          How to check the result — step by step
        </div>
        <div className="p-3">
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            <li>
              Keep your <strong>admit card / hall ticket</strong> ready — the
              roll number printed on it is what the portal asks for.{" "}
              {board.needs}
            </li>
            <li>
              Open the official portal:{" "}
              <a
                href={board.portalUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="font-semibold text-navy underline decoration-navy/30 underline-offset-2 hover:decoration-navy"
              >
                {board.portalUrl}
              </a>
            </li>
            <li>
              Select the result link for {clsLabel} on the board&apos;s
              homepage.
            </li>
            <li>
              Enter the roll number (and date of birth, where asked) exactly as
              printed on your admit card.
            </li>
            <li>
              Submit and view the subject-wise marksheet. Download or save the
              provisional marksheet for your records.
            </li>
          </ol>
        </div>
      </section>

      {board.alternatives.length > 0 ? (
        <section aria-labelledby="alts" className="gov-panel mb-4">
          <div className="gov-panel-title" id="alts">
            Other official ways to access the result
          </div>
          <div className="p-3">
            <ul className="divide-y divide-rule">
              {board.alternatives.map((alt) => (
                <li key={alt.href} className="py-2.5">
                  <a
                    href={alt.href}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-sm font-semibold text-navy no-underline hover:text-alert hover:underline"
                  >
                    {alt.label} ↗
                  </a>
                  {alt.note ? (
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {alt.note}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="reval" className="gov-panel mb-4">
        <div className="gov-panel-title" id="reval">
          Re-evaluation, compartment and what to do next
        </div>
        <div className="space-y-2 p-3 text-sm text-ink-muted">
          <p>
            If you believe your marks were evaluated incorrectly, the process is
            called <strong>re-evaluation</strong> (or re-totalling) and must be
            applied for within the window the board announces, usually within
            a few weeks of the result declaration. The application is made on
            the same official portal or through your school — never through a
            third-party site.
          </p>
          <p>
            If you fail one or two subjects, you can appear for the{" "}
            <strong>compartment</strong> or supplementary examination, whose
            dates and eligibility the board publishes separately. Students who
            pass the compartment exam receive their marks on the next
            supplementary statement of marks.
          </p>
          <p>
            Keep both your original statement of marks and a downloaded copy.
            Some boards also publish a marksheet verification service (for
            example DigiLocker or a state e-marksheet portal) listed above.
          </p>
        </div>
      </section>

      <section aria-labelledby="privacy-note" className="mb-4 rounded-sm border border-rule bg-navy-50 p-4">
        <h2 id="privacy-note" className="font-serif text-base font-bold text-navy">
          We never store your result data
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          This site does not ask for your roll number, date of birth or marks,
          and has no student database. The button above opens{" "}
          {board.portalHost} in a new tab, and everything you type stays on the
          board&apos;s own website.
        </p>
      </section>

      <nav aria-label="Other boards" className="mb-4">
        <h2 className="mb-2 font-serif text-base font-bold text-navy">
          Other boards
        </h2>
        <ul className="flex flex-wrap gap-2">
          {BOARDS.filter((b) => b.slug !== board.slug)
            .slice(0, 10)
            .map((b) => (
              <li key={b.slug}>
                <Link
                  href={`/result/boards/${b.slug}`}
                  className="inline-block rounded-sm border border-rule bg-surface px-3 py-1.5 text-sm font-semibold text-navy no-underline hover:border-navy-400 hover:bg-white"
                >
                  {b.name.split(" — ")[0]}
                </Link>
              </li>
            ))}
        </ul>
      </nav>
    </PageContainer>
  );
}