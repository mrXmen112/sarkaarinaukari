import Link from "next/link";

import { formatDate } from "@/lib/date";

export type HomeStageItem = {
  title: string;
  slug: string;
  date: string | null;
};

type StageGroup = {
  title: string;
  href: string;
  items: HomeStageItem[];
};

/**
 * Homepage "Latest Results / Admit Cards / Answer Keys" block.
 *
 * All three queries already filter to released rows, newest first. Each column
 * disappears on its own when empty so the block never renders hollow headings.
 */
export function HomeStages({
  admitCards,
  results,
  answerKeys,
}: {
  admitCards: HomeStageItem[];
  results: HomeStageItem[];
  answerKeys: HomeStageItem[];
}) {
  const groups: StageGroup[] = [
    { title: "Latest Admit Cards", href: "/admit-card", items: admitCards },
    { title: "Latest Results", href: "/result", items: results },
    { title: "Latest Answer Keys", href: "/answer-key", items: answerKeys },
  ];
  if (groups.every((group) => group.items.length === 0)) return null;

  return (
    <section aria-labelledby="latest-updates" className="mb-6">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 id="latest-updates" className="font-serif text-lg font-bold text-navy">
            Latest Results, Admit Cards &amp; Answer Keys
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Only updates officially released by the recruiting body are listed.
          </p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {groups.map((group) =>
          group.items.length > 0 ? (
            <section key={group.href} className="gov-panel">
              <div className="gov-panel-title flex items-center justify-between gap-2">
                <h3 className="font-serif text-sm font-bold text-white">
                  {group.title}
                </h3>
                <Link
                  href={group.href}
                  className="text-[0.6875rem] font-semibold text-saffron no-underline hover:underline"
                >
                  View all →
                </Link>
              </div>
              <ul className="divide-y divide-rule p-2">
                {group.items.map((item) => (
                  <li key={item.slug} className="py-2">
                    <Link
                      href={`${group.href}/${item.slug}`}
                      className="text-sm font-semibold text-navy no-underline hover:text-alert hover:underline"
                    >
                      {item.title}
                    </Link>
                    {item.date ? (
                      <p className="mt-0.5 text-xs text-ink-faint">
                        {formatDate(item.date)}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null,
        )}
      </div>
    </section>
  );
}
