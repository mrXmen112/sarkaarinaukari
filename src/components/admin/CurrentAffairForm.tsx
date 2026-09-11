"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";

import {
  createCurrentAffair,
  updateCurrentAffair,
  type AdminResult,
} from "@/app/actions/admin";
import type { CurrentAffair } from "@/types/database";

const initial: AdminResult = { ok: true };

export function CurrentAffairForm({
  affair,
}: {
  affair?: CurrentAffair | null;
}) {
  const router = useRouter();
  const isEdit = Boolean(affair?.id);

  const [state, action, pending] = useActionState(
    async (_prev: AdminResult, formData: FormData) => {
      const input = {
        date: String(formData.get("date") ?? ""),
        title: String(formData.get("title") ?? ""),
        content: String(formData.get("content") ?? ""),
        is_published: formData.get("is_published") === "on",
      };
      const res = isEdit
        ? await updateCurrentAffair(affair!.id, input)
        : await createCurrentAffair(input);
      if (res.ok) router.push("/admin/current-affairs");
      return res;
    },
    initial,
  );

  const fieldCls = "mt-1 w-full rounded border border-rule px-3 py-2 text-sm";
  const labelCls = "mt-3 block text-xs font-semibold";

  return (
    <form action={action} className="max-w-2xl rounded border border-rule p-4">
      <label className={labelCls}>
        Date
        <input
          name="date"
          type="date"
          required
          defaultValue={affair?.date?.slice(0, 10) ?? ""}
          className={fieldCls}
        />
      </label>

      <label className={labelCls}>
        Title
        <input
          name="title"
          type="text"
          required
          defaultValue={affair?.title ?? ""}
          className={fieldCls}
        />
      </label>

      <label className={labelCls}>
        Content
        <textarea
          name="content"
          rows={10}
          defaultValue={affair?.content ?? ""}
          className={fieldCls}
        />
      </label>

      <label className="mt-3 flex items-center gap-2 text-sm">
        <input
          name="is_published"
          type="checkbox"
          defaultChecked={affair ? affair.is_published : true}
        />
        Published
      </label>

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50"
      >
        {pending ? "Saving…" : isEdit ? "Save Changes" : "Create Brief"}
      </button>

      {state.ok === false && (
        <p className="mt-3 text-xs font-medium text-red-700">{state.error}</p>
      )}
    </form>
  );
}