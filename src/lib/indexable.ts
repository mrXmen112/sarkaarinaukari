import type { Metadata } from "next";

import { VERIFICATION_GATE_ENABLED } from "@/lib/queries";
import type { VerificationStatus } from "@/types/database";

/**
 * The single source of truth for "may Google index this page?".
 *
 * This module exists because the robots meta tag and the sitemap used to make
 * that decision independently, which is how a page ends up `noindex` in the
 * markup but still listed in a sitemap (or the reverse). Both now call
 * `isIndexable()`, so they cannot disagree.
 *
 * The rule, per the brief: a page is indexable only when it has
 *   1. enough real prose to be worth a ranking,
 *   2. an official source link we can stand behind,
 *   3. a Last Verified date, and
 *   4. for jobs, verification_status = 'verified' (only once the gate is on).
 *
 * Anything failing any rule is `noindex, follow` and stays out of the sitemap.
 * `follow` is kept on purpose: a noindexed page should still pass its link
 * equity through to the pages it links to.
 */

/**
 * Minimum characters of real prose per template.
 *
 * These are set from the actual data, not guessed. Measured on the live DB:
 *   exams.overview   min 78 · avg 138 · max 266 chars
 *   exams.eligibility min 44 · avg 86
 *   yojana.description min 99 · avg 149 · max 188
 * plus eligibility (61+) and how_to_apply (83+) on every yojana row.
 *
 * So the largest exam page carries roughly 350 characters and the largest yojana
 * page roughly 450 — far below any threshold worth ranking. The numbers below
 * are deliberately above all of that: they describe a page that has actually
 * been written, not one that has been seeded.
 */
export const MIN_CONTENT_CHARS = {
  exam: 1200,
  yojana: 900,
  previousPapers: 600,
  job: 700,
  admitCard: 400,
  result: 400,
  answerKey: 400,
  update: 500,
} as const;

export type PageKind = keyof typeof MIN_CONTENT_CHARS | "generic";

export type IndexableSubject = {
  kind: PageKind;
  /** Total characters of real prose rendered on the page. */
  contentChars?: number;
  /** Official notification / portal / source URL. */
  officialSourceUrl?: string | null;
  /** ISO date a human last checked this content against its official source. */
  lastVerifiedAt?: string | null;
  /** Jobs only. */
  verificationStatus?: VerificationStatus | null;
  /** previous-papers only: how many official paper links exist. */
  officialPaperLinks?: number;
  /** Published rows only are ever candidates. */
  isPublished?: boolean;
};

export type IndexVerdict = {
  indexable: boolean;
  /** Why it was rejected, for the /admin inventory and for debugging. */
  reasons: string[];
};

function hasOfficialLink(url: string | null | undefined): boolean {
  return typeof url === "string" && url.trim().length > 0 && /^https?:\/\//i.test(url.trim());
}

/**
 * Decide indexability. Pure and synchronous so it can be unit tested and called
 * from both the metadata export and the sitemap generator.
 */
export function isIndexable(subject: IndexableSubject): IndexVerdict {
  const reasons: string[] = [];

  if (subject.isPublished === false) reasons.push("not published");

  // Jobs are governed ENTIRELY by the Phase 8A gate and nothing else, and this
  // is checked FIRST so no content heuristic can contradict it.
  //
  // While the gate is off, a published job is indexable exactly as it was
  // before Phase 8A. Applying the content threshold here instead would noindex
  // thin seeded jobs while the sitemap still advertised them — the precise
  // contradiction this module exists to prevent.
  //
  // When the gate is on, verification_status is the single authority. Note it is
  // deliberately NOT link_last_checked_at: that is written by the automated link
  // checker and proves a URL resolves, not that a human matched the page to its
  // official notification.
  if (subject.kind === "job") {
    if (VERIFICATION_GATE_ENABLED && subject.verificationStatus !== "verified") {
      reasons.push(`not verified (${subject.verificationStatus ?? "null"})`);
    }
    return { indexable: reasons.length === 0, reasons };
  }

  const minimum = MIN_CONTENT_CHARS[subject.kind as keyof typeof MIN_CONTENT_CHARS] ?? 0;
  const chars = subject.contentChars ?? 0;
  if (minimum > 0 && chars < minimum) {
    reasons.push(`thin content: ${chars} chars, need ${minimum}`);
  }

  // previous-papers is the one template whose whole reason to exist is the
  // papers. Without at least one official link it is an empty shell, so the
  // content-length rule alone is not enough of a test.
  if (subject.kind === "previousPapers" && (subject.officialPaperLinks ?? 0) < 1) {
    reasons.push("no officially published paper links");
  }

  if (!hasOfficialLink(subject.officialSourceUrl)) {
    reasons.push("no official source link");
  }

  if (!subject.lastVerifiedAt) {
    reasons.push("no Last Verified date");
  }

  return { indexable: reasons.length === 0, reasons };
}

/** Convenience wrapper for a `generateMetadata` robots field. */
export function robotsFor(subject: IndexableSubject): Metadata["robots"] {
  const { indexable } = isIndexable(subject);
  return { index: indexable, follow: true };
}

/** `true` when the sitemap generator should emit this URL. */
export function includeInSitemap(subject: IndexableSubject): boolean {
  return isIndexable(subject).indexable;
}

/* ------------------------------------------------------------------ */
/* Content measurement                                                 */
/* ------------------------------------------------------------------ */

/**
 * Length of a nullable text column, safe on null and undefined.
 *
 * Structured columns (exam_pattern, how_to_apply, selection_process) are typed as
 * arrays on some tables and plain text on others, so both are accepted and an
 * array is measured by its readable text, not its JSON length.
 */
export function chars(...parts: (string | null | undefined | unknown[])[]): number {
  return parts.reduce<number>((sum, p) => {
    if (typeof p === "string") return sum + p.trim().length;
    if (Array.isArray(p)) {
      return (
        sum +
        p.reduce<number>(
          (n, item) =>
            n +
            (typeof item === "string"
              ? item.trim().length
              : item && typeof item === "object"
                ? // e.g. { stage: "...", topics: "..." } — count the text only
                  Object.values(item)
                    .filter((v) => typeof v === "string")
                    .join(" ")
                    .trim().length
                : 0),
          0,
        )
      );
    }
    return sum;
  }, 0);
}

/**
 * Count only the *free-text* fields of an exam, not JSON blobs.
 *
 * previous_year_papers / faqs / recommended_books are structured data: a row can
 * hold a large array while still rendering a two-sentence page. Counting raw JSON
 * length would let a seeded array masquerade as real content.
 */
export function examContentChars(exam: {
  overview?: string | null;
  eligibility?: string | null;
  exam_pattern?: unknown[] | string | null;
  preparation_strategy?: string | null;
  conducting_body?: string | null;
}): number {
  return chars(
    exam.overview,
    exam.eligibility,
    exam.exam_pattern,
    exam.preparation_strategy,
    exam.conducting_body,
  );
}

/** Free-text content on a yojana record. */
export function yojanaContentChars(yojana: {
  description?: string | null;
  eligibility?: string | null;
  how_to_apply?: string | null;
  benefits_summary?: string | null;
  benefits?: string | null;
  title?: string | null;
}): number {
  return chars(
    yojana.title,
    yojana.description,
    yojana.eligibility,
    yojana.how_to_apply,
    yojana.benefits_summary,
    yojana.benefits,
  );
}

/** Free-text content on a job, counting only what a visitor actually reads. */
export function jobContentChars(job: {
  title?: string | null;
  short_description?: string | null;
  eligibility_education?: string | null;
  selection_process?: unknown[] | string | null;
  how_to_apply?: unknown[] | string | null;
  pay_scale?: string | null;
}): number {
  return chars(
    job.title,
    job.short_description,
    job.eligibility_education,
    job.selection_process,
    job.how_to_apply,
    job.pay_scale,
  );
}