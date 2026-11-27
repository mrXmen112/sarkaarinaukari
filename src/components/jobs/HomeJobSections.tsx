import Link from "next/link";

export type HomeSectionItem = {
  title: string;
  href: string;
  meta?: string | null;
};

export type HomeSection = {
  id: string;
  title: string;
  viewAll: string;
  viewAllLabel?: string;
  items: HomeSectionItem[];
};

/**
 * Compact, link-first panels for the homepage's category slices. A section is
 * omitted when it has no live records: an empty panel is not useful content and
 * must never be filled with placeholder or invented vacancies.
 */
export function HomeJobSections({ sections }: { sections: HomeSection[] }) {
  const visible = sections.filter((s) => s.items.length > 0);
  if (visible.length === 0) return null;

  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      {visible.map((section) => (
        <section
          key={section.id}
          aria-labelledby={`home-section-${section.id}`}
          className="gov-panel"
        >
          <div className="gov-panel-title flex items-center justify-between gap-3">
            <h2
              id={`home-section-${section.id}`}
              className="font-serif text-base font-bold text-white"
            >
              {section.title}
            </h2>
            <Link
              href={section.viewAll}
              className="text-xs font-semibold text-saffron no-underline hover:underline"
            >
              {section.viewAllLabel ?? "View All"} →
            </Link>
          </div>
          <ul className="divide-y divide-rule p-3 text-sm">
            {section.items.map((item) => (
              <li key={item.href} className="py-2 first:pt-0 last:pb-0">
                <Link
                  href={item.href}
                  className="font-semibold text-navy no-underline hover:underline"
                >
                  {item.title}
                </Link>
                {item.meta ? (
                  <span className="block text-xs text-ink-muted">{item.meta}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
