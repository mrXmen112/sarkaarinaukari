"use client";

import { useTransition } from "react";

import { deleteQuiz } from "@/app/actions/admin";

export function DeleteQuizButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm("Delete this quiz and its attempts? This cannot be undone.")) {
      return;
    }
    startTransition(async () => {
      await deleteQuiz(id);
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