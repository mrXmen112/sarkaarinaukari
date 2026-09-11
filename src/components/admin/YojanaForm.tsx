"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";

import {
  createYojana,
  updateYojana,
  type AdminResult,
} from "@/app/actions/admin";
import type { Yojana } from "@/types/database";

const initial: AdminResult = { ok: true };

export function YojanaForm({ yojana }: { yojana?: Yojana | null }) {
  const router = useRouter();
  const isEdit = Boolean(yojana?.id);

  const [state, action, pending] = useActionState(
    async (_prev: AdminResult, formData: FormData) => {
      const input = {
        title: String(formData.get("title") ?? ""),
        level: String(formData.get("level") ?? ""),
        state: String(formData.get("state") ?? ""),
        description: String(formData.get("description") ?? ""),
        benefits_summary: String(formData.get("benefits_summary") ?? ""),
        eligibility: String(formData.get("eligibility") ?? ""),
        benefits: String(formData.get("benefits") ?? ""),
        how_to_apply: String(formData.get("how_to_apply") ?? ""),
        official_link: String(formData.get("official_link") ?? ""),
        is_published: formData.get("is_published") === "on",
      };
      const res = isEdit
        ? await updateYojana(yojana!.id, input)
        : await createYojana(input);
      if (res.ok) router.push("/admin/yojana");
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
          defaultValue={yojana?.title ?? ""}
          className={fieldCls}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className={labelCls}>
          Level
          <select name="level" className={fieldCls} defaultValue={yojana?.level ?? "central"}>
            <option value="central">Central</option>
            <option value="state">State</option>
          </select>
        </label>
        <label className={labelCls}>
          State
          <input
            name="state"
            type="text"
            placeholder="e.g. bihar (leave blank for central)"
            defaultValue={yojana?.state ?? ""}
            className={fieldCls}
          />
        </label>
      </div>

      <label className={labelCls}>
        Description
        <textarea
          name="description"
          rows={3}
          defaultValue={yojana?.description ?? ""}
          className={fieldCls}
        />
      </label>

      <label className={labelCls}>
        Benefits summary (short line for listings)
        <input
          name="benefits_summary"
          type="text"
          defaultValue={yojana?.benefits_summary ?? ""}
          className={fieldCls}
        />
      </label>

      <label className={labelCls}>
        Eligibility
        <textarea
          name="eligibility"
          rows={4}
          defaultValue={yojana?.eligibility ?? ""}
          className={fieldCls}
        />
      </label>

      <label className={labelCls}>
        Benefits (detail)
        <textarea
          name="benefits"
          rows={5}
          defaultValue={yojana?.benefits ?? ""}
          className={fieldCls}
        />
      </label>

      <label className={labelCls}>
        How to apply
        <textarea
          name="how_to_apply"
          rows={4}
          defaultValue={yojana?.how_to_apply ?? ""}
          className={fieldCls}
        />
      </label>

      <label className={labelCls}>
        Official link
        <input
          name="official_link"
          type="url"
          defaultValue={yojana?.official_link ?? ""}
          className={fieldCls}
        />
      </label>

      <label className="mt-3 flex items-center gap-2 text-sm">
        <input
          name="is_published"
          type="checkbox"
          defaultChecked={yojana ? yojana.is_published : true}
        />
        Published
      </label>

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50"
      >
        {pending ? "Saving…" : isEdit ? "Save Changes" : "Create Yojana"}
      </button>

      {state.ok === false && (
        <p className="mt-3 text-xs font-medium text-red-700">{state.error}</p>
      )}
    </form>
  );
}