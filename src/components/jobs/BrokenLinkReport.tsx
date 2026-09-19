import Link from "next/link";

import { getBrokenLinks } from "@/lib/url";
import type { JobWithCategory } from "@/types/database";

interface BrokenLinkReportProps {
  jobs: JobWithCategory[];
}

/**
 * Development/admin component that lists all jobs with broken
 * or placeholder apply links. Renders nothing if all links are valid.
 */
export function BrokenLinkReport({ jobs }: BrokenLinkReportProps) {
  const broken = getBrokenLinks(jobs);

  if (broken.length === 0) return null;

  return (
    <section className="gov-panel mt-6 border-alert" aria-labelledby="broken-links">
      <div className="gov-panel-title bg-alert">
        <h2 id="broken-links" className="font-serif text-base font-bold text-white">
          ⚠️ Broken / Placeholder Apply Links ({broken.length})
        </h2>
      </div>
      <div className="p-3">
        <table className="gov-table text-sm">
          <thead>
            <tr>
              <th className="border-rule">Job</th>
              <th className="border-rule">URL</th>
              <th className="border-rule">Issue</th>
            </tr>
          </thead>
          <tbody>
            {broken.map((item) => (
              <tr key={item.slug}>
                <td>
                  <Link
                    href={`/jobs/${item.slug}`}
                    className="text-navy no-underline hover:underline"
                  >
                    {item.title}
                  </Link>
                </td>
                <td className="font-mono text-xs break-all">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-alert no-underline hover:underline"
                  >
                    {item.url}
                  </a>
                </td>
                <td className="text-alert text-xs">{item.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
