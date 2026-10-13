"use client";

import { useState, useTransition } from "react";

import { runLinkCheckNow } from "@/app/actions/pipeline";

export function RunLinkCheckButton() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setMessage("");
          startTransition(async () => {
            const res = await runLinkCheckNow();
            setMessage(
              res.ok
                ? `Checked — ${res.flagged ?? 0} flagged.`
                : (res.error ?? "Link check failed"),
            );
          });
        }}
        className="gov-btn disabled:opacity-50"
      >
        {pending ? "Checking…" : "Run link check now"}
      </button>
      {message ? (
        <span className="text-sm text-ink-muted">{message}</span>
      ) : null}
    </div>
  );
}
