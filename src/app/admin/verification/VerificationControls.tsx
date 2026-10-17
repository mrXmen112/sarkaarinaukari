"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  bulkSetVerificationAction,
  setJobVerificationAction,
  verifyExamAction,
  verifyJobAction,
  verifyYojanaAction,
  type VerificationResult,
} from "@/app/actions/verification";

/**
 * Client controls for /admin/verification.
 *
 * The service-role key lives only in the server actions; this component imports
 * nothing from @/lib/supabase. Every action re-checks requireAdmin() server-side,
 * so hiding a button here is presentation only and never the security boundary.
 */

function useAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function run(fn: () => Promise<VerificationResult>, onDone?: () => void) {
    startTransition(async () => {
      const result = await fn();
      setMessage(
        result.ok
          ? { ok: true, text: result.message }
          : { ok: false, text: result.error },
      );
      if (result.ok) {
        onDone?.();
        router.refresh();
      }
    });
  }

  return { pending, message, setMessage, run };
}

function Banner({
  message,
  onDismiss,
}: {
  message: { ok: boolean; text: string } | null;
  onDismiss: () => void;
}) {
  if (!message) return null;
  return (
    <p
      role="status"
      className={`mb-3 rounded-sm border px-3 py-2 text-sm ${
        message.ok
          ? "border-ingreen bg-ingreen-bg text-ingreen"
          : "border-alert bg-alert-bg text-alert"
      }`}
    >
      {message.text}{" "}
      <button
        type="button"
        onClick={onDismiss}
        className="ml-2 underline"
        aria-label="Dismiss message"
      >
        dismiss
      </button>
    </p>
  );
}

const btn =
  "rounded-sm border border-navy px-2 py-1 text-xs font-semibold text-navy hover:bg-navy hover:text-white disabled:opacity-50";
const btnDanger =
  "rounded-sm border border-alert px-2 py-1 text-xs font-semibold text-alert hover:bg-alert hover:text-white disabled:opacity-50";

/* ------------------------------------------------------------------ */

export function JobRowControls({ jobId, slug }: { jobId: string; slug: string }) {
  const { pending, message, run } = useAction();

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          disabled={pending}
          className={btn}
          onClick={() => run(() => verifyJobAction(jobId, "Checked against official notification"))}
        >
          Verify
        </button>
        <button
          type="button"
          disabled={pending}
          className={btn}
          onClick={() => run(() => setJobVerificationAction(jobId, "needs_review", "Sent back for review"))}
        >
          Needs review
        </button>
        <button
          type="button"
          disabled={pending}
          className={btnDanger}
          onClick={() => run(() => setJobVerificationAction(jobId, "unverified", "Marked unverified"))}
        >
          Unverify
        </button>
        <a
          href={`/jobs/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-ink-muted underline"
        >
          view page
        </a>
      </div>
      {message ? (
        <p className={`mt-1 text-xs ${message.ok ? "text-ingreen" : "text-alert"}`}>
          {message.text}
        </p>
      ) : null}
    </div>
  );
}

export function ExamRowControls({
  slug,
  officialLink,
}: {
  slug: string;
  officialLink: string | null;
}) {
  const { pending, message, run } = useAction();
  const [link, setLink] = useState(officialLink ?? "");

  return (
    <div className="min-w-0">
      <label className="sr-only" htmlFor={`exam-link-${slug}`}>
        Official source link for {slug}
      </label>
      <input
        id={`exam-link-${slug}`}
        type="url"
        inputMode="url"
        placeholder="https://official.example.gov.in/..."
        value={link}
        onChange={(e) => setLink(e.target.value)}
        className="w-full rounded-sm border border-rule px-2 py-1 text-xs"
      />
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          disabled={pending}
          className={btn}
          onClick={() => run(() => verifyExamAction(slug, link, "Checked against official source"))}
        >
          Save + verify
        </button>
        <a
          href={`/exams/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-ink-muted underline"
        >
          view page
        </a>
      </div>
      {message ? (
        <p className={`mt-1 text-xs ${message.ok ? "text-ingreen" : "text-alert"}`}>
          {message.text}
        </p>
      ) : null}
    </div>
  );
}

export function YojanaRowControls({ slug }: { slug: string }) {
  const { pending, message, run } = useAction();

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          disabled={pending}
          className={btn}
          onClick={() => run(() => verifyYojanaAction(slug, "Checked against official source"))}
        >
          Verify
        </button>
        <a
          href={`/yojana/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-ink-muted underline"
        >
          view page
        </a>
      </div>
      {message ? (
        <p className={`mt-1 text-xs ${message.ok ? "text-ingreen" : "text-alert"}`}>
          {message.text}
        </p>
      ) : null}
    </div>
  );
}

export function BulkControls({
  selected,
  onClear,
}: {
  selected: string[];
  onClear: () => void;
}) {
  const { pending, message, setMessage, run } = useAction();

  return (
    <div className="rounded-sm border-2 border-saffron bg-saffron-bg p-3">
      <Banner message={message} onDismiss={() => setMessage(null)} />
      <p className="mb-2 text-sm font-semibold text-navy">
        Bulk action — {selected.length} selected
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={pending || selected.length === 0}
          className={btn}
          onClick={() =>
            run(() => bulkSetVerificationAction(selected, "verified"), onClear)
          }
        >
          Verify selected
        </button>
        <button
          type="button"
          disabled={pending || selected.length === 0}
          className={btn}
          onClick={() =>
            run(() => bulkSetVerificationAction(selected, "needs_review"), onClear)
          }
        >
          Send to review
        </button>
        <button
          type="button"
          disabled={pending || selected.length === 0}
          className={btnDanger}
          onClick={() =>
            run(() => bulkSetVerificationAction(selected, "unverified"), onClear)
          }
        >
          Unverify selected
        </button>
        <button
          type="button"
          disabled={pending || selected.length === 0}
          className="text-xs underline"
          onClick={onClear}
        >
          Clear selection
        </button>
      </div>
      <p className="mt-2 text-xs text-ink-muted">
        Bulk actions apply to every job currently in the{" "}
        <code>unverified</code> or <code>needs_review</code> state, not only the
        rows ticked here, so review the counts before using them.
      </p>
    </div>
  );
}

export function SelectionBar({
  selected,
  toggle,
  clear,
  allVisibleIds,
}: {
  selected: string[];
  toggle: (id: string) => void;
  clear: () => void;
  allVisibleIds: string[];
}) {
  const all = selected.length === allVisibleIds.length && allVisibleIds.length > 0;
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={all}
          onChange={() => {
            if (all) clear();
            else allVisibleIds.forEach((id) => {
              if (!selected.includes(id)) toggle(id);
            });
          }}
        />
        Select all shown
      </label>
      <span className="text-ink-muted">{selected.length} selected</span>
    </div>
  );
}
