"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";

import {
  createAdmitCard,
  updateAdmitCard,
  createResult,
  updateResult,
  createAnswerKey,
  updateAnswerKey,
  type AdminResult,
} from "@/app/actions/admin";
import type { Job } from "@/types/database";

const initial: AdminResult = { ok: true };

type Kind = "admit-card" | "result" | "answer-key";

function toDate(value: string | null | undefined): string {
  return value?.slice(0, 10) ?? "";
}

function toJson(value: unknown): string {
  if (value === null || value === undefined) return "{}";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "{}";
  }
}

export function JobLinkedForm({
  kind,
  jobId,
  jobs,
  row,
}: {
  kind: Kind;
  jobId?: string;
  jobs: Pick<Job, "id" | "title">[];
  row?: Record<string, unknown> | null;
}) {
  const router = useRouter();
  const isEdit = Boolean(row?.id);
  const backPath =
    kind === "admit-card"
      ? "/admin/admit-cards"
      : kind === "result"
        ? "/admin/results"
        : "/admin/answer-keys";

  const [state, action, pending] = useActionState(
    async (_prev: AdminResult, formData: FormData) => {
      const get = (name: string) => String(formData.get(name) ?? "");
      const base = {
        job_id: get("job_id"),
        title: get("title"),
        description: get("description"),
        is_published: formData.get("is_published") === "on",
      };
      let res: AdminResult;
      if (kind === "admit-card") {
        const input = {
          ...base,
          release_date: get("release_date"),
          exam_date: get("exam_date"),
          download_link: get("download_link"),
          official_link: get("official_link"),
        };
        res = isEdit ? await updateAdmitCard(row!.id as string, input) : await createAdmitCard(input);
      } else if (kind === "result") {
        const input = {
          ...base,
          result_date: get("result_date"),
          cutoff_data: get("cutoff_data"),
          merit_list_link: get("merit_list_link"),
          official_link: get("official_link"),
        };
        res = isEdit ? await updateResult(row!.id as string, input) : await createResult(input);
      } else {
        const input = {
          ...base,
          type: get("type"),
          release_date: get("release_date"),
          objection_last_date: get("objection_last_date"),
          download_link: get("download_link"),
          official_link: get("official_link"),
        };
        res = isEdit ? await updateAnswerKey(row!.id as string, input) : await createAnswerKey(input);
      }
      if (res.ok) router.push(backPath);
      return res;
    },
    initial,
  );

  const fieldCls = "mt-1 w-full rounded border border-rule px-3 py-2 text-sm";
  const labelCls = "mt-3 block text-xs font-semibold";

  return (
    <form action={action} className="max-w-2xl rounded border border-rule p-4">
      <label className={labelCls}>
        Linked job
        <select name="job_id" className={fieldCls} defaultValue={jobId ?? ""}>
          <option value="">— none —</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title}
            </option>
          ))}
        </select>
      </label>

      <label className={labelCls}>
        Title
        <input
          name="title"
          type="text"
          required
          defaultValue={String(row?.title ?? "")}
          className={fieldCls}
        />
      </label>

      <label className={labelCls}>
        Description
        <textarea
          name="description"
          rows={4}
          defaultValue={String(row?.description ?? "")}
          className={fieldCls}
        />
      </label>

      {kind === "admit-card" && (
        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelCls}>
            Release date
            <input
              name="release_date"
              type="date"
              defaultValue={toDate(row?.release_date as string | null)}
              className={fieldCls}
            />
          </label>
          <label className={labelCls}>
            Exam date
            <input
              name="exam_date"
              type="date"
              defaultValue={toDate(row?.exam_date as string | null)}
              className={fieldCls}
            />
          </label>
        </div>
      )}

      {kind === "result" && (
        <>
          <label className={labelCls}>
            Result date
            <input
              name="result_date"
              type="date"
              defaultValue={toDate(row?.result_date as string | null)}
              className={fieldCls}
            />
          </label>
          <label className={labelCls}>
            Cutoff data (JSON object: {"{ \"general\": 75, \"obc\": 70 }"})
            <textarea
              name="cutoff_data"
              rows={4}
              spellCheck={false}
              defaultValue={toJson(row?.cutoff_data)}
              className={fieldCls + " font-mono text-xs"}
            />
          </label>
        </>
      )}

      {kind === "answer-key" && (
        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelCls}>
            Type
            <select name="type" className={fieldCls} defaultValue={String(row?.type ?? "provisional")}>
              <option value="provisional">Provisional</option>
              <option value="final">Final</option>
            </select>
          </label>
          <label className={labelCls}>
            Release date
            <input
              name="release_date"
              type="date"
              defaultValue={toDate(row?.release_date as string | null)}
              className={fieldCls}
            />
          </label>
          <label className={labelCls}>
            Objection last date
            <input
              name="objection_last_date"
              type="date"
              defaultValue={toDate(row?.objection_last_date as string | null)}
              className={fieldCls}
            />
          </label>
        </div>
      )}

      {kind !== "result" && (
        <label className={labelCls}>
          Download link
          <input
            name="download_link"
            type="url"
            defaultValue={String(row?.download_link ?? "")}
            className={fieldCls}
          />
        </label>
      )}
      {kind === "result" && (
        <label className={labelCls}>
          Merit list link
          <input
            name="merit_list_link"
            type="url"
            defaultValue={String(row?.merit_list_link ?? "")}
            className={fieldCls}
          />
        </label>
      )}

      <label className={labelCls}>
        Official link
        <input
          name="official_link"
          type="url"
          defaultValue={String(row?.official_link ?? "")}
          className={fieldCls}
        />
      </label>

      <label className="mt-3 flex items-center gap-2 text-sm">
        <input
          name="is_published"
          type="checkbox"
          defaultChecked={row ? Boolean(row.is_published) : true}
        />
        Published
      </label>

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50"
      >
        {pending ? "Saving…" : isEdit ? "Save Changes" : "Create"}
      </button>

      {state.ok === false && (
        <p className="mt-3 text-xs font-medium text-red-700">{state.error}</p>
      )}
    </form>
  );
}