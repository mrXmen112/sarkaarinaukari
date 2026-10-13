"use client";

import { useState, useTransition } from "react";

import { toggleTelegramAutoPost } from "@/app/actions/pipeline";

/** Telegram auto-post master switch for the review queue (Phase 1). */
export function TelegramToggle({ enabled }: { enabled: boolean }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setMessage("");
          startTransition(async () => {
            const res = await toggleTelegramAutoPost(!enabled);
            setMessage(res.ok ? "Saved" : (res.error ?? "Failed"));
          });
        }}
        className={
          enabled
            ? "rounded-sm bg-ingreen px-3 py-1.5 text-sm font-bold text-white disabled:opacity-50"
            : "rounded-sm border border-rule px-3 py-1.5 text-sm font-bold text-ink-muted disabled:opacity-50"
        }
      >
        {enabled ? "Auto-post ON" : "Auto-post OFF"}
      </button>
      <span className="text-xs text-ink-muted">
        {enabled
          ? "Each approved job posts to your Telegram channel."
          : "Approvals stay on-site until you add TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID."}
      </span>
      {message ? (
        <span className="text-xs text-ink-muted">{message}</span>
      ) : null}
    </div>
  );
}
