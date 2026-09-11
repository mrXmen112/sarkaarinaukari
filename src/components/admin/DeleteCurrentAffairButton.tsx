"use client";

import { useTransition } from "react";
import Link from "next/link";

import { deleteCurrentAffair } from "@/app/actions/admin";

export function DeleteCurrentAffairButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm("Delete this current affairs brief? This cannot be undone.")) {
      return;
    }
    startTransition(async () => {
      await deleteCurrentAffair(id);
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