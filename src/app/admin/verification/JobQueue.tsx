"use client";

import { useState } from "react";

import {
  BulkControls,
  JobRowControls,
  SelectionBar,
} from "./VerificationControls";

export type QueueRow = {
  id: string;
  slug: string;
  title: string;
  status: string;
  verification_status: string;
  link_flagged: boolean | null;
  link_http_status: number | null;
  official_link: string | null;
  source_url: string | null;
  verified_at: string | null;
  verified_by: string | null;
};

/**
 * The job verification queue.
 *
 * Selection state lives here rather than on the page because the row buttons
 * and the bulk bar both need it, and the page is a Server Component.
 */
export function JobQueue({ rows }: { rows: QueueRow[] }) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  const clear = () => setSelected([]);

  const allVisibleIds = rows.map((r) => r.id);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="gov-table w-full">
          <caption className="sr-only">
            Jobs awaiting human verification
          </caption>
          <thead>
            <tr>
              <th scope="col" className="w-8 border-b border-r border-rule bg-navy-50 px-2 py-1.5 text-left text-xs font-bold text-navy">
                <span className="sr-only">Select</span>
              </th>
              <th scope="col" className="border-b border-r border-rule bg-navy-50 px-2 py-1.5 text-left text-xs font-bold text-navy">
                Job
              </th>
              <th scope="col" className="border-b border-r border-rule bg-navy-50 px-2 py-1.5 text-left text-xs font-bold text-navy">
                State
              </th>
              <th scope="col" className="border-b border-r border-rule bg-navy-50 px-2 py-1.5 text-left text-xs font-bold text-navy">
                Link
              </th>
              <th scope="col" className="border-b border-rule bg-navy-50 px-2 py-1.5 text-left text-xs font-bold text-navy">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="align-top">
                <td className="border-b border-r border-rule px-2 py-2">
                  <input
                    type="checkbox"
                    aria-label={`Select ${row.title}`}
                    checked={selected.includes(row.id)}
                    onChange={() => toggle(row.id)}
                  />
                </td>
                <td className="border-b border-r border-rule px-2 py-2">
                  <p className="text-sm font-semibold text-navy">{row.title}</p>
                  <p className="font-mono text-xs text-ink-muted">{row.slug}</p>
                  {row.official_link ? (
                    <a
                      href={row.official_link}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="break-all text-xs text-navy underline"
                    >
                      {row.official_link}
                    </a>
                  ) : (
                    <p className="text-xs text-alert">No official link</p>
                  )}
                  {!row.source_url ? (
                    <p className="text-xs text-alert">No recorded source</p>
                  ) : null}
                </td>
                <td className="border-b border-r border-rule px-2 py-2 text-xs">
                  <span className="font-semibold">{row.verification_status}</span>
                  <br />
                  <span className="text-ink-muted">{row.status}</span>
                  {row.verified_at ? (
                    <>
                      <br />
                      <span className="text-ink-muted">
                        {row.verified_at.slice(0, 10)}
                      </span>
                    </>
                  ) : null}
                </td>
                <td className="border-b border-r border-rule px-2 py-2 text-xs">
                  {row.link_flagged ? (
                    <span className="font-bold text-alert">flagged dead</span>
                  ) : row.link_http_status ? (
                    <span className="text-ingreen">HTTP {row.link_http_status}</span>
                  ) : (
                    <span className="text-ink-muted">never checked</span>
                  )}
                </td>
                <td className="border-b border-rule px-2 py-2">
                  <JobRowControls jobId={row.id} slug={row.slug} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SelectionBar
        selected={selected}
        toggle={toggle}
        clear={clear}
        allVisibleIds={allVisibleIds}
      />

      <BulkControls selected={selected} onClear={clear} />
    </div>
  );
}