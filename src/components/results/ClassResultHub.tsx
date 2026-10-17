import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { boardsForClass } from "@/lib/boards";

/** Shared renderer for /result/10th and /result/12th (Phase 4C). */
export function ClassResultHub({ cls }: { cls: "10" | "12" }) {
  const label = `Class ${cls}`;

  const intro: string[] =
    cls === "10"
      ? [
          "Every Class 10 result is declared by the board that conducted the exam, so there is no single national result page. CBSE declares results for its own schools, while state boards such as Bihar (BSEB), Uttar Pradesh, Madhya Pradesh, Rajasthan, Maharashtra, West Bengal, Karnataka and Tamil Nadu publish their own results on their own portals.",
          "This page lists every major board's official result portal — each link verified against the board's own website — with the exact details you need to check your result, and links to per-board guides covering the step-by-step process, re-evaluation and compartment rules. We only guide and redirect you to the official portal; this site never asks for, stores or processes your roll number or marks.",
          "Keep your roll number and date of birth ready before you click through. If a portal is slow on result day, most boards also offer an SMS option or publish the same result on a second official domain — both are listed on the board pages here.",
        ]
      : [
          "Class 12 results are declared by the board or the conducting authority for each stream — CBSE, the state boards, and for vocational and open-school exams the respective national bodies. Because the declaring body differs, the correct result page depends entirely on your board and stream.",
          "This page lists every major board's official Class 12 result portal — each link verified against the board's own website — with the details you need before you check, and links to per-board guides covering the checking process, re-evaluation / re-totalling windows and compartment or supplementary exams. This site only guides and redirects to the official portal; we never collect roll numbers or marks.",
          "Note that some boards publish Class 12 results on a separate portal from Class 10 (for example Bihar's intermediate section, or Rajasthan where Class 12 is handled at division level) — the per-board pages spell this out.",
        ];

  const boards = boardsForClass(cls);

  return (
    <PageContainer>
      <Breadcrumbs
        items={[{ label: "Result", href: "/result" }, { label }]}
      />
      <PageHeader
        title={`${label} Result 2026 — All Board Official Result Portals`}
      />

      <section className="mb-5 max-w-3xl space-y-3 text-sm leading-relaxed text-ink-muted">
        {intro.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </section>

      <section aria-labelledby="boards" className="mb-6">
        <h2
          id="boards"
          className="mb-2 font-serif text-base font-bold text-navy"
        >
          Boards with {label} results ({boards.length})
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {boards.map((board) => (
            <li
              key={board.slug}
              className="rounded-sm border border-rule bg-surface p-3"
            >
              <h3 className="font-serif text-sm font-bold text-navy">
                {board.name}
              </h3>
              <p className="mt-1 text-xs text-ink-muted">{board.note}</p>
              <p className="mt-1 text-xs text-ink-faint">
                Need: {board.needs}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <a
                  href={`/result/boards/${board.slug}`}
                  className="text-xs font-semibold text-navy underline decoration-navy/30 underline-offset-2 hover:decoration-navy"
                >
                  How to check
                </a>
                <a
                  href={board.portalUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="gov-btn text-xs"
                >
                  Check result on {board.portalHost} ↗
                </a>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-ink-faint">
        We never collect roll numbers or marks. Every button above opens the
        board&apos;s own website in a new tab.
      </p>
    </PageContainer>
  );
}

/**
 * Class result hub routes are /result/10th and /result/12th, but the `cls`
 * prop is the board class code "10" / "12". Emitting the raw code produced a
 * canonical pointing at /result/10, which does not exist — so the page
 * canonicalised itself to a 404. Found by npm run audit:404.
 */
const CLASS_ROUTE_SLUG: Record<string, string> = {
  "10": "10th",
  "12": "12th",
};

export function classHubMetadata(cls: "10" | "12") {
  const slug = CLASS_ROUTE_SLUG[cls] ?? cls;
  return {
    title: {
      absolute: `Class ${cls} Result 2026: Check Result on Official Board Websites`,
    },
    description: `Class ${cls} result 2026 for CBSE, BSEB, UP Board, MP, Rajasthan, Maharashtra, West Bengal, Karnataka, Tamil Nadu and more boards — verified official result portals, checking steps and re-evaluation info.`,
    alternates: { canonical: `/result/${slug}` },
    robots: { index: true, follow: true },
  };
}