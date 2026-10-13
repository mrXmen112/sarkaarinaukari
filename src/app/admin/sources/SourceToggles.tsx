"use client";

import { useTransition, useState } from "react";

import { toggleSourceActive, toggleSourceAutoPublish } from "@/app/actions/pipeline";

export function SourceToggles({
  id,
  isActive,
  autoPublish,
}: {
  id: string;
  isActive: boolean;
  autoPublish: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setMessage("");
    startTransition(async () => {
      const res = await action();
      setMessage(res.ok ? "Saved" : (res.error ?? "Failed"));
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => toggleSourceActive(id, !isActive))}
        className={
          isActive
            ? "rounded-sm bg-ingreen px-2 py-1 text-xs font-bold text-white disabled:opacity-50"
            : "rounded-sm bg-ink-faint px-2 py-1 text-xs font-bold text-white disabled:opacity-50"
        }
      >
        {isActive ? "Active" : "Paused"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => toggleSourceAutoPublish(id, !autoPublish))}
        className={
          autoPublish
            ? "rounded-sm bg-saffron px-2 py-1 text-xs font-bold text-navy disabled:opacity-50"
            : "rounded-sm border border-rule px-2 py-1 text-xs font-bold text-ink-muted disabled:opacity-50"
        }
        title="Trusted sources may be auto-published by future tooling (approval stays manual for now)"
      >
        {autoPublish ? "Auto-publish" : "Manual review"}
      </button>
      {message ? (
        <span className="text-xs text-ink-muted">{message}</span>
      ) : null}
    </div>
  );
}
