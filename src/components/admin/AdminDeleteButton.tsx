"use client";

import { useTransition } from "react";

import type { AdminResult } from "@/app/actions/admin";

export function AdminDeleteButton({
  id,
  confirmText,
  action,
}: {
  id: string;
  confirmText: string;
  action: (id: string) => Promise<AdminResult>;
}) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm(confirmText)) return;
    startTransition(async () => {
      await action(id);
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="text-xs font-semibold text-red-700 hover:underline disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}