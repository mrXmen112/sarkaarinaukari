"use client";

import { useState, type FormEvent } from "react";

import {
  extractQuickDraftAction,
  publishQuick,
  validateOfficialLinkAction,
} from "@/app/actions/quickPublish";
import {
  QUICK_KINDS,
  QUICK_KIND_LABELS,
  type QuickKind,
} from "@/lib/quickKinds";

type FieldSpec = {
  key: string;
  label: string;
  kind?: "date" | "textarea" | "json";
  rows?: number;
};

const FIELD_SPECS: Record<QuickKind, FieldSpec[]> = {
  job: [
    { key: "title", label: "Title" },
    { key: "department", label: "Department" },
    { key: "department_slug", label: "Department slug" },
    { key: "state", label: "State slug" },
    { key: "short_description", label: "Short description", kind: "textarea", rows: 3 },
    { key: "eligibility_education", label: "Education" },
    { key: "eligibility_age_min", label: "Age min" },
    { key: "eligibility_age_max", label: "Age max" },
    { key: "vacancy_total", label: "Total vacancies" },
    { key: "vacancy_breakdown", label: "Vacancy breakdown (JSON)", kind: "json", rows: 3 },
    { key: "application_fee", label: "Application fee (JSON)", kind: "json", rows: 3 },
    { key: "age_relaxation", label: "Age relaxation (JSON)", kind: "json", rows: 3 },
    { key: "selection_process", label: "Selection process (one per line)", kind: "textarea", rows: 3 },
    { key: "pay_scale", label: "Pay scale" },
    { key: "notification_date", label: "Notification date", kind: "date" },
    { key: "application_start", label: "Application start", kind: "date" },
    { key: "application_end", label: "Application end", kind: "date" },
    { key: "exam_date", label: "Exam date", kind: "date" },
    { key: "notification_pdf_link", label: "Notification PDF link" },
    { key: "official_link", label: "Official link" },
  ],
  result: [
    { key: "title", label: "Title" },
    { key: "description", label: "Description", kind: "textarea", rows: 3 },
    { key: "result_date", label: "Result date", kind: "date" },
    { key: "cutoff_data", label: "Cutoff data (JSON)", kind: "json", rows: 3 },
    { key: "merit_list_link", label: "Merit list link" },
    { key: "official_link", label: "Official link" },
  ],
  "admit-card": [
    { key: "title", label: "Title" },
    { key: "description", label: "Description", kind: "textarea", rows: 3 },
    { key: "release_date", label: "Release date", kind: "date" },
    { key: "exam_date", label: "Exam date", kind: "date" },
    { key: "download_link", label: "Download link" },
    { key: "official_link", label: "Official link" },
  ],
  "answer-key": [
    { key: "title", label: "Title" },
    { key: "description", label: "Description", kind: "textarea", rows: 3 },
    { key: "type", label: "Type (provisional / final)" },
    { key: "release_date", label: "Release date", kind: "date" },
    { key: "objection_last_date", label: "Objection last date", kind: "date" },
    { key: "download_link", label: "Download link" },
    { key: "official_link", label: "Official link" },
  ],
};

const fieldCls = "mt-1 w-full rounded border border-rule px-3 py-2 text-sm";
const labelCls = "mt-3 block text-xs font-semibold";

function dateValue(raw: string): string {
  const m = raw.match(/^\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : "";
}

export function QuickPublishForm({
  jobs,
}: {
  jobs: { id: string; title: string }[];
}) {
  const [kind, setKind] = useState<QuickKind>("job");
  const [url, setUrl] = useState("");
  const [fields, setFields] = useState<Record<string, string> | null>(null);
  const [flags, setFlags] = useState<Record<string, true>>({});
  const [jobId, setJobId] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [busy, setBusy] = useState<"none" | "extract" | "validate" | "publish">("none");
  const [linkOk, setLinkOk] = useState<boolean | null>(null);
  const [linkReason, setLinkReason] = useState("");
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const officialLink = (fields?.official_link ?? url).trim();
  const canPublish = fields !== null && linkOk === true && busy === "none";

  function resetExtraction() {
    setFields(null);
    setFlags({});
    setLinkOk(null);
    setLinkReason("");
    setMessage(null);
  }

  function setField(key: string, value: string) {
    setFields((prev) => (prev ? { ...prev, [key]: value } : prev));
    if (key === "official_link") {
      setLinkOk(null);
      setLinkReason("");
    }
  }

  async function onExtract() {
    resetExtraction();
    setBusy("extract");
    const res = await extractQuickDraftAction(kind, url);
    setBusy("none");
    if (!res.ok) {
      setMessage({ tone: "err", text: res.error });
      return;
    }
    setFields(res.draft.fields);
    setFlags(res.draft.flags);
    setMessage({ tone: "ok", text: "Extracted — review and edit, then validate the link." });
  }

  async function onValidate() {
    setBusy("validate");
    const res = await validateOfficialLinkAction(officialLink);
    setBusy("none");
    setLinkOk(res.ok);
    setLinkReason(res.reason);
  }

  async function onPublish(e: FormEvent) {
    e.preventDefault();
    if (!fields) return;
    setBusy("publish");
    const res = await publishQuick({ kind, officialLink, jobId, fields, isPublished });
    setBusy("none");
    if (res.ok) {
      setMessage({ tone: "ok", text: "Published." });
      resetExtraction();
      setUrl("");
    } else {
      setMessage({ tone: "err", text: res.error });
    }
  }

  const spec = FIELD_SPECS[kind];

  return (
    <div className="max-w-3xl space-y-4">
      <div className="rounded border border-rule p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelCls}>
            What are you publishing?
            <select
              value={kind}
              onChange={(e) => {
                setKind(e.target.value as QuickKind);
                resetExtraction();
              }}
              className={fieldCls}
            >
              {QUICK_KINDS.map((k) => (
                <option key={k} value={k}>
                  {QUICK_KIND_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
          <label className={labelCls}>
            Official URL (page or PDF)
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              className={fieldCls}
            />
          </label>
        </div>
        <button
          type="button"
          onClick={onExtract}
          disabled={busy !== "none" || !url.trim()}
          className="mt-4 rounded bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50"
        >
          {busy === "extract" ? "Fetching & extracting…" : "Fetch & Extract"}
        </button>
      </div>

      {message && (
        <p
          className={
            "text-sm font-medium " + (message.tone === "ok" ? "text-green-700" : "text-red-700")
          }
        >
          {message.text}
        </p>
      )}

      {fields && (
        <form onSubmit={onPublish} className="rounded border border-rule p-4">
          {Object.keys(flags).length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {Object.keys(flags).map((f) => (
                <span
                  key={f}
                  className={
                    "rounded px-1.5 py-0.5 text-[11px] font-medium " +
                    (f.startsWith("missing_")
                      ? "bg-red-50 text-red-700"
                      : "bg-amber-50 text-amber-800")
                  }
                >
                  {f.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          )}

          {kind !== "job" && (
            <label className={labelCls}>
              Related job (links it into the job&apos;s Recruitment Timeline)
              <select
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                className={fieldCls}
              >
                <option value="">— none —</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </select>
            </label>
          )}

          {spec.map((f) => {
            const value = fields[f.key] ?? "";
            return (
              <label key={f.key} className={labelCls}>
                {f.label}
                {f.kind === "date" ? (
                  <input
                    type="date"
                    value={dateValue(value)}
                    onChange={(e) => setField(f.key, e.target.value)}
                    className={fieldCls}
                  />
                ) : f.kind === "textarea" || f.kind === "json" ? (
                  <textarea
                    rows={f.rows ?? 3}
                    spellCheck={f.kind !== "json"}
                    value={value}
                    onChange={(e) => setField(f.key, e.target.value)}
                    className={fieldCls + (f.kind === "json" ? " font-mono text-xs" : "")}
                  />
                ) : (
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setField(f.key, e.target.value)}
                    className={fieldCls}
                  />
                )}
              </label>
            );
          })}

          <label className="mt-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
            />
            Publish immediately
          </label>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onValidate}
              disabled={busy !== "none" || !officialLink}
              className="rounded border border-rule px-4 py-2 text-sm font-semibold text-navy hover:border-navy disabled:opacity-50"
            >
              {busy === "validate" ? "Checking…" : "Validate official link"}
            </button>
            <button
              type="submit"
              disabled={!canPublish}
              title={linkOk === true ? "" : "Validate the official link before publishing"}
              className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50"
            >
              {busy === "publish" ? "Publishing…" : "Publish"}
            </button>
            {linkOk !== null && (
              <span
                className={
                  "text-xs font-medium " + (linkOk ? "text-green-700" : "text-red-700")
                }
              >
                Link {linkOk ? "OK" : "failed"}: {linkReason}
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
