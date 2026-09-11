"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";

import {
  createJobCategory,
  updateJobCategory,
  type AdminResult,
} from "@/app/actions/admin";
import type { JobCategory } from "@/types/database";

const initial: AdminResult = { ok: true };

export function JobCategoryForm({
  category,
}: {
  category?: JobCategory | null;
}) {
  const router = useRouter();
  const isEdit = Boolean(category?.id);

  const [state, action, pending] = useActionState(
    async (_prev: AdminResult, formData: FormData) => {
      const input = {
        name: String(formData.get("name") ?? ""),
        parent_category: String(formData.get("parent_category") ?? ""),
        sort_order: Number(formData.get("sort_order") ?? 100),
      };
      const res = isEdit
        ? await updateJobCategory(category!.id, input)
        : await createJobCategory(input);
      if (res.ok) router.push("/admin/job-categories");
      return res;
    },
    initial,
  );

  const fieldCls = "mt-1 w-full rounded border border-rule px-3 py-2 text-sm";
  const labelCls = "mt-3 block text-xs font-semibold";

  return (
    <form action={action} className="max-w-xl rounded border border-rule p-4">
      <label className={labelCls}>
        Name
        <input
          name="name"
          type="text"
          required
          defaultValue={category?.name ?? ""}
          className={fieldCls}
        />
      </label>

      <label className={labelCls}>
        Parent category
        <input
          name="parent_category"
          type="text"
          placeholder="e.g. state, central, up, bihar"
          defaultValue={category?.parent_category ?? ""}
          className={fieldCls}
        />
      </label>

      <label className={labelCls}>
        Sort order
        <input
          name="sort_order"
          type="number"
          defaultValue={category?.sort_order ?? 100}
          className={fieldCls}
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50"
      >
        {pending ? "Saving…" : isEdit ? "Save Changes" : "Create Category"}
      </button>

      {state.ok === false && (
        <p className="mt-3 text-xs font-medium text-red-700">{state.error}</p>
      )}
    </form>
  );
}