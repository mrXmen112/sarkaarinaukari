"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";

import {
  createQuiz,
  updateQuiz,
  type AdminResult,
} from "@/app/actions/admin";
import type { Quiz } from "@/types/database";

const initial: AdminResult = { ok: true };

export function QuizForm({ quiz }: { quiz?: Quiz | null }) {
  const router = useRouter();
  const isEdit = Boolean(quiz?.id);

  const [state, action, pending] = useActionState(
    async (_prev: AdminResult, formData: FormData) => {
      const input = {
        title: String(formData.get("title") ?? ""),
        subject: String(formData.get("subject") ?? ""),
        description: String(formData.get("description") ?? ""),
        questionsRaw: String(formData.get("questions") ?? ""),
        is_published: formData.get("is_published") === "on",
      };
      const res = isEdit
        ? await updateQuiz(quiz!.id, input)
        : await createQuiz(input);
      if (res.ok) router.push("/admin/quizzes");
      return res;
    },
    initial,
  );

  const fieldCls = "mt-1 w-full rounded border border-rule px-3 py-2 text-sm";
  const labelCls = "mt-3 block text-xs font-semibold";

  return (
    <form action={action} className="max-w-2xl rounded border border-rule p-4">
      <label className={labelCls}>
        Title
        <input
          name="title"
          type="text"
          required
          defaultValue={quiz?.title ?? ""}
          className={fieldCls}
        />
      </label>

      <label className={labelCls}>
        Subject
        <input
          name="subject"
          type="text"
          defaultValue={quiz?.subject ?? ""}
          placeholder="e.g. GK, GA, Polity"
          className={fieldCls}
        />
      </label>

      <label className={labelCls}>
        Description
        <input
          name="description"
          type="text"
          defaultValue={quiz?.description ?? ""}
          className={fieldCls}
        />
      </label>

      <label className={labelCls}>
        Questions (JSON array)
        <textarea
          name="questions"
          rows={14}
          spellCheck={false}
          defaultValue={
            quiz?.questions
              ? JSON.stringify(quiz.questions, null, 2)
              : JSON.stringify(
                  [
                    {
                      question: "Example question?",
                      options: ["Option A", "Option B", "Option C", "Option D"],
                      correct_index: 0,
                      explanation: "Why this answer is correct.",
                    },
                  ],
                  null,
                  2,
                )
          }
          className={fieldCls + " font-mono text-xs"}
        />
      </label>

      <label className="mt-3 flex items-center gap-2 text-sm">
        <input
          name="is_published"
          type="checkbox"
          defaultChecked={quiz ? quiz.is_published : true}
        />
        Published
      </label>

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50"
      >
        {pending ? "Saving…" : isEdit ? "Save Changes" : "Create Quiz"}
      </button>

      {state.ok === false && (
        <p className="mt-3 text-xs font-medium text-red-700">{state.error}</p>
      )}
    </form>
  );
}