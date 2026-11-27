"use client";

import { useActionState } from "react";

import {
  quickImportOfficial,
  type QuickImportResult,
} from "@/app/actions/quickImport";

const initial: QuickImportResult = { ok: true, message: "" };

const field = "mt-1 w-full rounded border border-rule px-3 py-2 text-sm";
const label = "mt-3 block text-xs font-semibold";

/**
 * Fallback for official notices that our collectors cannot fetch (bot-blocked
 * portals such as UPSC/SSC/RRB). Every field is still cross-checked against
 * the official page text or a pasted excerpt before publication.
 */
export default function QuickImportPage() {
  const [state, action, pending] = useActionState(quickImportOfficial, initial);

  return (
    <div className="max-w-3xl">
      <h1 className="mb-2 font-serif text-xl font-bold text-navy">Quick Import (Official Notice)</h1>
      <p className="mb-4 text-sm text-ink-muted">
        For blocked portals only. Enter the values exactly as printed in the official notice.
        Publication happens automatically if every value is found in the official source text;
        otherwise the attempt is logged as an import error.
      </p>

      <form action={action} className="rounded border border-rule bg-surface p-4">
        <label className={label}>Recruitment title
          <input name="title" required className={field} placeholder="e.g. UPSC Civil Services Examination 2026" />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className={label}>Department / authority
            <input name="department" required className={field} />
          </label>
          <label className={label}>State slug (blank = central)
            <input name="state" className={field} placeholder="e.g. bihar" />
          </label>
          <label className={label}>Advertisement / notification number
            <input name="notice_number" className={field} />
          </label>
          <label className={label}>Total vacancies
            <input name="vacancy_total" type="number" min="1" className={field} />
          </label>
          <label className={label}>Application start (YYYY-MM-DD)
            <input name="start_date" type="date" className={field} />
          </label>
          <label className={label}>Application last date (YYYY-MM-DD)
            <input name="end_date" type="date" required className={field} />
          </label>
        </div>
        <label className={label}>Qualification
          <input name="eligibility" className={field} />
        </label>
        <label className={label}>Pay scale
          <input name="pay_scale" className={field} />
        </label>
        <label className={label}>Official notice URL
          <input name="official_link" type="url" required className={field} />
        </label>
        <label className={label}>Official application URL
          <input name="apply_url" type="url" className={field} />
        </label>
        <label className={label}>Official notification PDF
          <input name="notification_pdf" type="url" className={field} />
        </label>
        <label className={label}>
          Official notice text (required when the URL serves a PDF or blocks automated fetch)
          <textarea name="source_text" rows={6} className={field} />
        </label>

        <button type="submit" disabled={pending} className="mt-4 rounded bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {pending ? "Checking…" : "Verify & publish"}
        </button>
        {state.message ? (
          <p className={`mt-3 text-sm ${state.ok ? "text-ingreen" : "text-alert"}`}>{state.message}</p>
        ) : null}
      </form>
    </div>
  );
}
