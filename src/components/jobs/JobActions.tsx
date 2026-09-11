"use client";

import { useTransition, useState } from "react";

import Link from "next/link";

import { toggleAppliedJob, toggleSavedJob } from "@/app/actions/profile";

export function JobActions({ jobId }: { jobId: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function apply() {
    startTransition(async () => {
      const res = await toggleAppliedJob(jobId);
      setMessage(
        res.ok ? "Marked as applied." : `Sign in first: ${res.error}`,
      );
    });
  }

  function save() {
    startTransition(async () => {
      const res = await toggleSavedJob(jobId);
      setMessage(
        res.ok ? "Saved to your dashboard." : `Sign in first: ${res.error}`,
      );
    });
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={apply}
          disabled={pending}
          className="rounded bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-800 disabled:opacity-50"
        >
          {pending ? "Updating…" : "Mark as Applied"}
        </button>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded border border-rule px-3 py-1.5 text-xs font-semibold hover:border-navy-300 disabled:opacity-50"
        >
          Save Job
        </button>
      </div>
      {message ? (
        <p className="text-xs text-ink-muted">
          {message}
          {message.includes("Sign in") ? (
            <>
              {" "}
              <Link
                href="/login"
                className="font-semibold text-navy underline"
              >
                Login
              </Link>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}