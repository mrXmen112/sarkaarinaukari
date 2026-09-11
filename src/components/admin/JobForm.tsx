"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";

import {
  createJob,
  updateJob,
  type JobInput,
  type AdminResult,
} from "@/app/actions/admin";
import type { Job, JobCategory, Syllabus } from "@/types/database";

const initial: AdminResult = { ok: true };

function toJson(value: unknown): string {
  if (value === null || value === undefined) return "{}";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "{}";
  }
}

function toLines(value: string[] | null | undefined): string {
  return (value ?? []).join("\n");
}

function toDate(value: string | null | undefined): string {
  return value?.slice(0, 10) ?? "";
}

export function JobForm({
  job,
  categories,
  syllabi,
}: {
  job?: Job | null;
  categories: JobCategory[];
  syllabi: Syllabus[];
}) {
  const router = useRouter();
  const isEdit = Boolean(job?.id);

  const [state, action, pending] = useActionState(
    async (_prev: AdminResult, formData: FormData) => {
      const get = (name: string) => String(formData.get(name) ?? "");
      const input: JobInput = {
        title: get("title"),
        category_id: get("category_id"),
        state: get("state"),
        department: get("department"),
        department_slug: get("department_slug"),
        short_description: get("short_description"),
        eligibility_education: get("eligibility_education"),
        eligibility_age_min: get("eligibility_age_min"),
        eligibility_age_max: get("eligibility_age_max"),
        age_relaxation: get("age_relaxation"),
        vacancy_total: get("vacancy_total"),
        vacancy_breakdown: get("vacancy_breakdown"),
        application_fee: get("application_fee"),
        selection_process: get("selection_process"),
        pay_scale: get("pay_scale"),
        how_to_apply: get("how_to_apply"),
        notification_pdf_link: get("notification_pdf_link"),
        notification_date: get("notification_date"),
        application_start: get("application_start"),
        application_end: get("application_end"),
        exam_date: get("exam_date"),
        official_link: get("official_link"),
        syllabus_id: get("syllabus_id"),
        status: get("status"),
        source_url: get("source_url"),
        is_published: formData.get("is_published") === "on",
      };
      const res = isEdit
        ? await updateJob(job!.id, input)
        : await createJob(input);
      if (res.ok) router.push("/admin/jobs");
      return res;
    },
    initial,
  );

  const fieldCls = "mt-1 w-full rounded border border-rule px-3 py-2 text-sm";
  const labelCls = "mt-3 block text-xs font-semibold";

  return (
    <form action={action} className="max-w-3xl rounded border border-rule p-4">
      <label className={labelCls}>
        Title
        <input
          name="title"
          type="text"
          required
          defaultValue={job?.title ?? ""}
          className={fieldCls}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className={labelCls}>
          Category
          <select
            name="category_id"
            className={fieldCls}
            defaultValue={job?.category_id ?? ""}
          >
            <option value="">— none —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className={labelCls}>
          State
          <input
            name="state"
            type="text"
            placeholder="central / bihar / up…"
            defaultValue={job?.state ?? ""}
            className={fieldCls}
          />
        </label>
        <label className={labelCls}>
          Department
          <input
            name="department"
            type="text"
            defaultValue={job?.department ?? ""}
            className={fieldCls}
          />
        </label>
        <label className={labelCls}>
          Department slug (filter key)
          <input
            name="department_slug"
            type="text"
            placeholder="e.g. bpsc, ssc, bihar-police"
            defaultValue={job?.department_slug ?? ""}
            className={fieldCls}
          />
        </label>
      </div>

      <label className={labelCls}>
        Short description
        <textarea
          name="short_description"
          rows={2}
          defaultValue={job?.short_description ?? ""}
          className={fieldCls}
        />
      </label>

      <label className={labelCls}>
        Eligibility — education
        <textarea
          name="eligibility_education"
          rows={3}
          defaultValue={job?.eligibility_education ?? ""}
          className={fieldCls}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className={labelCls}>
          Age min
          <input
            name="eligibility_age_min"
            type="number"
            defaultValue={job?.eligibility_age_min ?? ""}
            className={fieldCls}
          />
        </label>
        <label className={labelCls}>
          Age max
          <input
            name="eligibility_age_max"
            type="number"
            defaultValue={job?.eligibility_age_max ?? ""}
            className={fieldCls}
          />
        </label>
        <label className={labelCls}>
          Vacancy total
          <input
            name="vacancy_total"
            type="number"
            defaultValue={job?.vacancy_total ?? ""}
            className={fieldCls}
          />
        </label>
      </div>

      <label className={labelCls}>
        Age relaxation (JSON object: {"{ \"sc_st\": 5, \"obc\": 3 }"})
        <textarea
          name="age_relaxation"
          rows={3}
          spellCheck={false}
          defaultValue={toJson(job?.age_relaxation)}
          className={fieldCls + " font-mono text-xs"}
        />
      </label>

      <label className={labelCls}>
        Vacancy breakdown (JSON object: {"{ \"general\": 120, \"obc\": 80 }"})
        <textarea
          name="vacancy_breakdown"
          rows={3}
          spellCheck={false}
          defaultValue={toJson(job?.vacancy_breakdown)}
          className={fieldCls + " font-mono text-xs"}
        />
      </label>

      <label className={labelCls}>
        Application fee (JSON object: {"{ \"general\": 100, \"sc_st\": 0 }"})
        <textarea
          name="application_fee"
          rows={3}
          spellCheck={false}
          defaultValue={toJson(job?.application_fee)}
          className={fieldCls + " font-mono text-xs"}
        />
      </label>

      <label className={labelCls}>
        Selection process (one stage per line: Prelims / Mains / Interview)
        <textarea
          name="selection_process"
          rows={3}
          defaultValue={toLines(job?.selection_process)}
          className={fieldCls}
        />
      </label>

      <label className={labelCls}>
        Pay scale
        <input
          name="pay_scale"
          type="text"
          placeholder="e.g. ₹44,900 – ₹1,42,400"
          defaultValue={job?.pay_scale ?? ""}
          className={fieldCls}
        />
      </label>

      <label className={labelCls}>
        How to apply (one step per line)
        <textarea
          name="how_to_apply"
          rows={4}
          defaultValue={toLines(job?.how_to_apply)}
          className={fieldCls}
        />
      </label>

      <label className={labelCls}>
        Notification PDF link
        <input
          name="notification_pdf_link"
          type="url"
          defaultValue={job?.notification_pdf_link ?? ""}
          className={fieldCls}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className={labelCls}>
          Notification date
          <input
            name="notification_date"
            type="date"
            defaultValue={toDate(job?.notification_date)}
            className={fieldCls}
          />
        </label>
        <label className={labelCls}>
          Application start
          <input
            name="application_start"
            type="date"
            defaultValue={toDate(job?.application_start)}
            className={fieldCls}
          />
        </label>
        <label className={labelCls}>
          Application end
          <input
            name="application_end"
            type="date"
            required
            defaultValue={toDate(job?.application_end)}
            className={fieldCls}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className={labelCls}>
          Exam date
          <input
            name="exam_date"
            type="date"
            defaultValue={toDate(job?.exam_date)}
            className={fieldCls}
          />
        </label>
        <label className={labelCls}>
          Official link
          <input
            name="official_link"
            type="url"
            required
            placeholder="https://…"
            defaultValue={job?.official_link ?? ""}
            className={fieldCls}
          />
        </label>
        <label className={labelCls}>
          Source URL (provenance)
          <input
            name="source_url"
            type="url"
            defaultValue={job?.source_url ?? ""}
            className={fieldCls}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className={labelCls}>
          Syllabus
          <select
            name="syllabus_id"
            className={fieldCls}
            defaultValue={job?.syllabus_id ?? ""}
          >
            <option value="">— none —</option>
            {syllabi.map((s) => (
              <option key={s.id} value={s.id}>
                {s.exam_name}
              </option>
            ))}
          </select>
        </label>
        <label className={labelCls}>
          Status
          <select
            name="status"
            className={fieldCls}
            defaultValue={job?.status ?? "active"}
          >
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            <option value="upcoming">Upcoming</option>
          </select>
        </label>
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm">
        <input
          name="is_published"
          type="checkbox"
          defaultChecked={job ? job.is_published : true}
        />
        Published
      </label>

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50"
      >
        {pending ? "Saving…" : isEdit ? "Save Changes" : "Create Job"}
      </button>

      {state.ok === false && (
        <p className="mt-3 text-xs font-medium text-red-700">{state.error}</p>
      )}
    </form>
  );
}