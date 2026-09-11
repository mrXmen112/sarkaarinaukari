"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";

import {
  createExam,
  updateExam,
  type AdminResult,
} from "@/app/actions/admin";
import type { Exam } from "@/types/database";

const initial: AdminResult = { ok: true };

function toJson(value: unknown): string {
  if (value === null || value === undefined) return "[]";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "[]";
  }
}

export function ExamForm({ exam }: { exam?: Exam | null }) {
  const router = useRouter();
  const isEdit = Boolean(exam?.id);

  const [state, action, pending] = useActionState(
    async (_prev: AdminResult, formData: FormData) => {
      const input = {
        name: String(formData.get("name") ?? ""),
        short_name: String(formData.get("short_name") ?? ""),
        conducting_body: String(formData.get("conducting_body") ?? ""),
        overview: String(formData.get("overview") ?? ""),
        eligibility: String(formData.get("eligibility") ?? ""),
        exam_pattern_raw: String(formData.get("exam_pattern") ?? "[]"),
        preparation_strategy: String(formData.get("preparation_strategy") ?? ""),
        recommended_books_raw: String(formData.get("recommended_books") ?? "[]"),
        previous_year_papers_raw: String(formData.get("previous_year_papers") ?? "[]"),
        cutoff_trends_raw: String(formData.get("cutoff_trends") ?? "[]"),
        faqs_raw: String(formData.get("faqs") ?? "[]"),
        is_published: formData.get("is_published") === "on",
      };
      const res = isEdit
        ? await updateExam(exam!.id, input)
        : await createExam(input);
      if (res.ok) router.push("/admin/exams");
      return res;
    },
    initial,
  );

  const fieldCls = "mt-1 w-full rounded border border-rule px-3 py-2 text-sm";
  const labelCls = "mt-3 block text-xs font-semibold";

  return (
    <form action={action} className="max-w-2xl rounded border border-rule p-4">
      <label className={labelCls}>
        Name
        <input
          name="name"
          type="text"
          required
          defaultValue={exam?.name ?? ""}
          className={fieldCls}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className={labelCls}>
          Short name
          <input
            name="short_name"
            type="text"
            placeholder="e.g. BPSC"
            defaultValue={exam?.short_name ?? ""}
            className={fieldCls}
          />
        </label>
        <label className={labelCls}>
          Conducting body
          <input
            name="conducting_body"
            type="text"
            defaultValue={exam?.conducting_body ?? ""}
            className={fieldCls}
          />
        </label>
      </div>

      <label className={labelCls}>
        Overview
        <textarea
          name="overview"
          rows={4}
          defaultValue={exam?.overview ?? ""}
          className={fieldCls}
        />
      </label>

      <label className={labelCls}>
        Eligibility
        <textarea
          name="eligibility"
          rows={4}
          defaultValue={exam?.eligibility ?? ""}
          className={fieldCls}
        />
      </label>

      <label className={labelCls}>
        Exam pattern (JSON array)
        <textarea
          name="exam_pattern"
          rows={6}
          spellCheck={false}
          defaultValue={toJson(exam?.exam_pattern)}
          className={fieldCls + " font-mono text-xs"}
        />
      </label>

      <label className={labelCls}>
        Preparation strategy
        <textarea
          name="preparation_strategy"
          rows={4}
          defaultValue={exam?.preparation_strategy ?? ""}
          className={fieldCls}
        />
      </label>

      <label className={labelCls}>
        Recommended books (JSON array: {"[{ \"title\", \"author\" }]"})
        <textarea
          name="recommended_books"
          rows={4}
          spellCheck={false}
          defaultValue={toJson(exam?.recommended_books)}
          className={fieldCls + " font-mono text-xs"}
        />
      </label>

      <label className={labelCls}>
        Previous year papers (JSON array)
        <textarea
          name="previous_year_papers"
          rows={4}
          spellCheck={false}
          defaultValue={toJson(exam?.previous_year_papers)}
          className={fieldCls + " font-mono text-xs"}
        />
      </label>

      <label className={labelCls}>
        Cutoff trends (JSON array)
        <textarea
          name="cutoff_trends"
          rows={4}
          spellCheck={false}
          defaultValue={toJson(exam?.cutoff_trends)}
          className={fieldCls + " font-mono text-xs"}
        />
      </label>

      <label className={labelCls}>
        FAQs (JSON array: {"[{ \"question\", \"answer\" }]"})
        <textarea
          name="faqs"
          rows={4}
          spellCheck={false}
          defaultValue={toJson(exam?.faqs)}
          className={fieldCls + " font-mono text-xs"}
        />
      </label>

      <label className="mt-3 flex items-center gap-2 text-sm">
        <input
          name="is_published"
          type="checkbox"
          defaultChecked={exam ? exam.is_published : true}
        />
        Published
      </label>

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50"
      >
        {pending ? "Saving…" : isEdit ? "Save Changes" : "Create Exam"}
      </button>

      {state.ok === false && (
        <p className="mt-3 text-xs font-medium text-red-700">{state.error}</p>
      )}
    </form>
  );
}