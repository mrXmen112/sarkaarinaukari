"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  approvePendingEntry,
  rejectPendingEntry,
} from "@/app/actions/reviewQueue";
import type { AdminResult } from "@/app/actions/admin";
import {
  flagChips,
  flattenStructured,
  isSupportedTarget,
  prettyLabel,
  type FlatFields,
} from "@/lib/reviewQueue";
import type { Job, JobCategory } from "@/types/database";

export type ReviewEntry = {
  id: string;
  target_type: string;
  structured_data: Record<string, unknown>;
  confidence_flags: Record<string, unknown>;
  created_at: string;
  source_url: string | null;
};

const fieldCls = "mt-1 w-full rounded border border-rule px-3 py-2 text-sm";
const labelCls = "mt-3 block text-xs font-semibold";
const flaggedCls =
  "mt-1 w-full rounded border border-red-500 bg-red-50/40 px-3 py-2 text-sm";

function isLongValue(v: string): boolean {
  const t = v.trim();
  return (
    t.includes("\n") || t.startsWith("{") || t.startsWith("[") || t.length > 120
  );
}

export function ReviewEntryForm({
  entry,
  categories,
  jobs,
}: {
  entry: ReviewEntry;
  categories: JobCategory[];
  jobs: Pick<Job, "id" | "title">[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<AdminResult | null>(null);

  const data = entry.structured_data;
  const structured = data && typeof data === "object" && !Array.isArray(data);
  const [fields, setFields] = useState<FlatFields>(() =>
    structured ? flattenStructured(data as Record<string, unknown>) : {},
  );

  const [categoryId, setCategoryId] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [statusVal, setStatusVal] = useState("active");
  const [jobId, setJobId] = useState("");
  const [published, setPublished] = useState(true);

  const chips = flagChips(entry.confidence_flags ?? {});
  const missingKeys = new Set(
    chips.filter((c) => c.tone === "red").map((c) => c.key.replace(/^missing_/, "")),
  );
  const supported = isSupportedTarget(entry.target_type);
  const officialLink = (fields.official_link ?? "").trim();

  function set(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function handleApprove() {
    setResult(null);
    startTransition(async () => {
      const res = await approvePendingEntry(entry.id, fields, {
        category_id: categoryId,
        state: stateVal.trim(),
        status: statusVal,
        job_id: jobId.trim(),
        is_published: published,
      });
      if (res.ok) {
        router.refresh();
      } else {
        setResult(res);
      }
    });
  }

  function handleReject() {
    if (!window.confirm("Reject this entry? It will never go live.")) return;
    setResult(null);
    startTransition(async () => {
      const res = await rejectPendingEntry(entry.id);
      if (res.ok) {
        router.refresh();
      } else {
        setResult(res);
      }
    });
  }

  return (
    <article className="rounded border border-rule p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="min-w-0 flex-1 text-sm font-bold">
          {fields.title || <span className="text-red-700">(no title)</span>}
        </h3>
        <span className="shrink-0 text-xs text-ink-muted">
          queued {entry.created_at.slice(0, 10)}
        </span>
      </div>

      <div className="mt-1 flex flex-wrap gap-1.5">
        {chips.length === 0 ? (
          <span className="rounded bg-green-50 px-2 py-0.5 text-xs font-medium text-green-800">
            all fields present
          </span>
        ) : (
          chips.map((c) => (
            <span
              key={c.key}
              className={
                c.tone === "red"
                  ? "rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700"
                  : "rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800"
              }
            >
              {c.key}
            </span>
          ))
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {entry.source_url && (
          <a
            href={entry.source_url}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-navy hover:underline"
          >
            Original source page ↗
          </a>
        )}
        {officialLink && officialLink !== entry.source_url && (
          <a
            href={officialLink}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-navy hover:underline"
          >
            Official link ↗
          </a>
        )}
      </div>

      {!structured ? (
        <p className="mt-3 text-sm text-red-700">
          Structured data is not an object — approve is disabled. Reject this
          entry or fix it in the database directly.
        </p>
      ) : !supported ? (
        <p className="mt-3 text-sm text-ink-muted">
          Auto-approve is not wired for “{entry.target_type}” yet — add it
          manually from the {entry.target_type} admin section, then Reject this
          entry.
        </p>
      ) : (
        <div className="mt-2 grid gap-x-4 md:grid-cols-2">
          {Object.entries(fields).map(([key, value]) => {
            const flagged = missingKeys.has(key);
            return (
              <label key={key} className={labelCls}>
                <span className="inline-flex items-center gap-1.5">
                  {prettyLabel(key)}
                  {flagged && (
                    <span className="rounded bg-red-50 px-1.5 py-px text-[10px] font-bold uppercase text-red-700">
                      missing
                    </span>
                  )}
                </span>
                {isLongValue(value) ? (
                  <textarea
                    value={value}
                    rows={3}
                    onChange={(e) => set(key, e.target.value)}
                    className={flagged ? flaggedCls : fieldCls}
                  />
                ) : (
                  <input
                    value={value}
                    type="text"
                    onChange={(e) => set(key, e.target.value)}
                    className={flagged ? flaggedCls : fieldCls}
                  />
                )}
              </label>
            );
          })}
        </div>
      )}

      {supported && structured && (
        <div className="mt-3 rounded border border-dashed border-rule p-3">
          <p className="text-xs font-semibold">Listing extras (not from LLM)</p>
          <div className="grid gap-x-4 md:grid-cols-2">
            {entry.target_type === "job" && (
              <>
                <label className={labelCls}>
                  Category
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className={fieldCls}
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
                  State (slug, e.g. bihar — blank = central)
                  <input
                    value={stateVal}
                    type="text"
                    onChange={(e) => setStateVal(e.target.value)}
                    className={fieldCls}
                  />
                </label>
                <label className={labelCls}>
                  Status
                  <select
                    value={statusVal}
                    onChange={(e) => setStatusVal(e.target.value)}
                    className={fieldCls}
                  >
                    <option value="active">active</option>
                    <option value="upcoming">upcoming</option>
                    <option value="closed">closed</option>
                  </select>
                </label>
              </>
            )}
            {entry.target_type !== "job" && (
              <label className={labelCls}>
                Link to job (optional — leave blank to link later)
                <select
                  value={jobId}
                  onChange={(e) => setJobId(e.target.value)}
                  className={fieldCls}
                >
                  <option value="">— none —</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="mt-3 flex items-center gap-2 text-xs font-semibold">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
              />
              Published (visible on site immediately)
            </label>
          </div>
        </div>
      )}

      {result && !result.ok && (
        <p className="mt-3 text-sm font-medium text-red-700">{result.error}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {supported && structured && (
          <button
            type="button"
            onClick={handleApprove}
            disabled={pending}
            className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50"
          >
            {pending ? "Working…" : "Approve & publish"}
          </button>
        )}
        <button
          type="button"
          onClick={handleReject}
          disabled={pending}
          className="rounded border border-rule px-4 py-2 text-sm font-semibold text-red-700 hover:border-red-400 disabled:opacity-50"
        >
          {pending ? "Working…" : "Reject"}
        </button>
      </div>
    </article>
  );
}
