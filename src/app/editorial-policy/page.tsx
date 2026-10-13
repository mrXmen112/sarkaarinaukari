import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { JsonLd } from "@/components/ui/JsonLd";
import { SITE } from "@/lib/site";
import { breadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: "Editorial & Data Verification Policy — How We Check Every Job" },
  description:
    "How SarkaariNaukri.online collects and verifies government job information: official sources only, human review before publishing, link checking, corrections policy and how to report an error.",
  alternates: { canonical: "/editorial-policy" },
  robots: { index: true, follow: true },
};

/**
 * Editorial & data-verification policy (Phase 5).
 *
 * This is the page that tells a reader — and a search engine — exactly how
 * each piece of information reaches the site. It is written to describe what
 * the code actually does, not what we wish it did.
 */
export default function EditorialPolicyPage() {
  return (
    <PageContainer>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Editorial & Data Policy", path: "/editorial-policy" },
        ])}
      />
      <Breadcrumbs items={[{ label: "Editorial & Data Policy" }]} />

      <PageHeader
        title="Editorial & Data Verification Policy"
        subtitle="Exactly how we collect, check, publish and correct the information on this site."
      />

      <div className="max-w-3xl space-y-6 text-sm leading-relaxed text-ink-muted">
        <section aria-labelledby="sources">
          <h2
            id="sources"
            className="mb-2 font-serif text-lg font-bold text-navy"
          >
            1. Where our information comes from
          </h2>
          <p>
            Every vacancy on {SITE.name} comes from the official notification
            of the recruiting body — the Bihar Public Service Commission, the
            Staff Selection Commission, a state public service commission, a
            police recruitment board, a railway recruitment board, and so on.
            We never copy a job listing from another job website, and we never
            publish a vacancy we cannot trace back to a government source.
          </p>
          <p>
            On every job page we show the{" "}
            <strong className="text-navy">source link</strong> to the
            recruiting body&apos;s own website and the date we last verified the
            listing. If you cannot find the same information on the official
            site that page links to, please treat our page as wrong and tell
            us.
          </p>
        </section>

        <section aria-labelledby="collection">
          <h2
            id="collection"
            className="mb-2 font-serif text-lg font-bold text-navy"
          >
            2. How vacancies are collected
          </h2>
          <p>
            Vacancies are collected two ways, and both end with a person
            checking the result:
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong className="text-navy">Manual entry.</strong> An editor
              opens the official notification, reads it, and fills in the post
              name, department, vacancy, dates, eligibility, fee and official
              links.
            </li>
            <li>
              <strong className="text-navy">Automated collection.</strong> Our
              scraper reads the public listing pages of recruiting bodies we
              have registered, and an extraction step turns each notice into a
              structured draft. Drafts{" "}
              <strong className="text-navy">always go into a review queue</strong>{" "}
              — nothing is published automatically. An editor reviews every
              field, fixes what the extraction missed, and only then approves
              it.
            </li>
          </ul>
          <p>
            Fields the notification does not state are left blank and shown as
            &ldquo;Not notified&rdquo;. We do not estimate a date, a vacancy
            count, or a fee that the notification does not give us.
          </p>
        </section>

        <section aria-labelledby="links">
          <h2
            id="links"
            className="mb-2 font-serif text-lg font-bold text-navy"
          >
            3. How we check links
          </h2>
          <p>
            Government portals move, expire and sometimes disappear. Every
            published job&apos;s apply link and notification PDF are checked
            automatically on a schedule, and by hand whenever a link is
            reported to us.
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              A link that returns <strong className="text-navy">404</strong>{" "}
              or points to a domain that{" "}
              <strong className="text-navy">no longer exists</strong> is
              treated as broken.
            </li>
            <li>
              We do not treat a slow server or a bot-protection response as
              broken — the link usually works for a real person.
            </li>
            <li>
              When a link is confirmed broken, the Apply button is replaced with
              a notice and the page says the link is under verification.{" "}
              <strong className="text-navy">The page itself stays online</strong>
              , because a dead link is not a reason to delete a page that people
              may already be searching for.
            </li>
          </ul>
          <p>
            You can see the current state of every link in our{" "}
            <Link
              href="/jobs"
              className="font-semibold text-navy underline decoration-navy/30 underline-offset-2 hover:decoration-navy"
            >
              job listings
            </Link>
            , and we review flagged links as part of the review queue.
          </p>
        </section>

        <section aria-labelledby="lifecycle">
          <h2
            id="lifecycle"
            className="mb-2 font-serif text-lg font-bold text-navy"
          >
            4. How long a job page stays online
          </h2>
          <p>
            Job pages are never deleted. Once the last date passes, the
            vacancy is marked closed, the Apply button is removed, and the page
            moves to a &ldquo;Recently Closed&rdquo; list for 30 days. After
            roughly 90 days it moves to the archive, where it remains
            indexable with a link to similar open vacancies — because the same
            recruitment usually comes back, and a visitor looking for it today
            often needs it next year too.
          </p>
        </section>

        <section aria-labelledby="corrections">
          <h2
            id="corrections"
            className="mb-2 font-serif text-lg font-bold text-navy"
          >
            5. Corrections
          </h2>
          <p>
            If you find an error — a wrong date, a wrong vacancy count, a
            missing link — please tell us. Include the job URL and what the
            official notification says. We correct errors as a priority, and
            expired or incorrect listings are removed as soon as they are
            confirmed.
          </p>
          <p>
            <Link
              href="/contact"
              className="font-semibold text-navy underline decoration-navy/30 underline-offset-2 hover:decoration-navy"
            >
              Contact us
            </Link>{" "}
            ·{" "}
            <Link
              href="/disclaimer"
              className="font-semibold text-navy underline decoration-navy/30 underline-offset-2 hover:decoration-navy"
            >
              Disclaimer
            </Link>
          </p>
        </section>

        <section aria-labelledby="independence">
          <h2
            id="independence"
            className="mb-2 font-serif text-lg font-bold text-navy"
          >
            6. Independence and advertising
          </h2>
          <p>
            {SITE.name} is an independent, privately-run information portal.
            We are not affiliated with, endorsed by, or connected to any
            government body, and we never ask for a fee to list a vacancy or
            to correct an error. The site carries advertising to cover running
            costs; advertisers have no say over which vacancies we publish or
            what our pages say.
          </p>
        </section>

        <p className="border-t border-rule pt-3 text-xs text-ink-faint">
          This page describes our actual process. If you find something here
          that does not match what you see on the site, please{" "}
          <Link href="/contact">tell us</Link>.
        </p>
      </div>
    </PageContainer>
  );
}