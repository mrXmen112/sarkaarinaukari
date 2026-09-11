"use client";

import { useActionState } from "react";

import { upsertProfile, type ActionResult } from "@/app/actions/profile";
import type { SocialCategory, UserProfile } from "@/types/database";

const initialState: ActionResult = { ok: true };

const CATEGORIES: { value: SocialCategory; label: string }[] = [
  { value: "general", label: "General" },
  { value: "obc", label: "OBC" },
  { value: "sc", label: "SC" },
  { value: "st", label: "ST" },
  { value: "ews", label: "EWS" },
];

export function ProfileForm({ profile }: { profile: UserProfile | null }) {
  const [state, action, pending] = useActionState(
    (_prev: ActionResult, formData: FormData) =>
      upsertProfile({
        full_name: String(formData.get("full_name") ?? "") || undefined,
        age: formData.get("age")
          ? Number(formData.get("age")) || null
          : null,
        education: String(formData.get("education") ?? "") || undefined,
        category:
          (formData.get("category") as SocialCategory | "") || undefined,
        state: String(formData.get("state") ?? "") || undefined,
      }),
    initialState,
  );

  const inputCls =
    "mt-1 w-full rounded border border-rule px-3 py-2 text-sm";
  const fieldCls = "mt-3 block";

  return (
    <form action={action} className="mb-4 rounded border border-rule p-4">
      <h2 className="font-serif text-base font-bold">Profile Details</h2>

      <label className={fieldCls}>
        <span className="text-xs font-semibold">Full name</span>
        <input
          name="full_name"
          type="text"
          autoComplete="name"
          defaultValue={profile?.full_name ?? ""}
          className={inputCls}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className={fieldCls}>
          <span className="text-xs font-semibold">Age</span>
          <input
            name="age"
            type="number"
            min={10}
            max={100}
            defaultValue={profile?.age ?? ""}
            className={inputCls}
          />
        </label>

        <label className={fieldCls}>
          <span className="text-xs font-semibold">Category</span>
          <select
            name="category"
            defaultValue={profile?.category ?? ""}
            className={inputCls}
          >
            <option value="">Select category</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className={fieldCls}>
        <span className="text-xs font-semibold">Education</span>
        <input
          name="education"
          type="text"
          defaultValue={profile?.education ?? ""}
          placeholder="e.g. B.Sc, M.A., ITI"
          className={inputCls}
        />
      </label>

      <label className={fieldCls}>
        <span className="text-xs font-semibold">State</span>
        <input
          name="state"
          type="text"
          defaultValue={profile?.state ?? ""}
          placeholder="e.g. Bihar"
          className={inputCls}
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save Profile"}
      </button>

      {state.ok === false && (
        <p className="mt-3 text-xs font-medium text-red-700">{state.error}</p>
      )}
      {state.ok === true && state.data === undefined && !pending && (
        <p className="mt-3 text-xs font-medium text-green-800">
          Profile saved.
        </p>
      )}
    </form>
  );
}