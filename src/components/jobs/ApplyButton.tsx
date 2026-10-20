import { T } from "@/components/i18n/T";
import { classifyApplyLink, type ApplyLinkJob } from "@/lib/applyLink";

interface ApplyButtonProps {
  href: string;
  title: string;
}

/**
 * Plain outbound Apply button. Kept for callers that already know the href is a
 * real apply URL. Most call sites should use ApplyCta below instead, which
 * derives the destination and label from the row.
 */
export function ApplyButton({ href, title }: ApplyButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="gov-btn whitespace-nowrap"
      aria-label={`Apply online for ${title} on the official website (opens in a new tab)`}
    >
      <T k="applyOnline" />
    </a>
  );
}

/**
 * 2026-10 audit — the whole Apply call-to-action for a job, on the detail page.
 *
 * Uses the SAME classifier as the listing table, so a job can never show
 * "Apply" in the table and "under verification" on its own page. Renders:
 *
 *   closed  -> a "Closed" label (no link at all)
 *   apply   -> "Apply Online" (only a verified official apply URL)
 *   website -> one notice + "Official Website" (never labelled Apply)
 *   details -> one notice only (nothing safe to send them to)
 */
export function ApplyCta({
  job,
  title,
}: {
  job: ApplyLinkJob;
  title: string;
}) {
  const link = classifyApplyLink(job);

  if (link.kind === "closed") {
    return (
      <span className="inline-block rounded-sm bg-alert-bg px-3 py-2 text-sm font-bold text-alert">
        <T k="applicationsClosed" />
      </span>
    );
  }

  if (link.kind === "apply") {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="gov-btn whitespace-nowrap"
        aria-label={`Apply online for ${title} on the official website (opens in a new tab)`}
      >
        <T k="applyOnline" />
      </a>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <span className="inline-block rounded-sm border border-alert px-3 py-2 text-sm font-bold text-alert">
        <T k="applyLinkUnderVerification" />
      </span>
      {link.kind === "website" ? (
        <a
          href={link.href}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="gov-btn whitespace-nowrap"
          aria-label={`Visit the official website for ${title} (opens in a new tab)`}
        >
          <T k="officialWebsite" />
        </a>
      ) : null}
    </div>
  );
}
