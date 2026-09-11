import { cn } from "@/lib/utils";

/**
 * Standard page shell: centred max-width column with consistent gutters.
 *
 * `aside` renders a right-hand rail on desktop (used for ad slots and
 * "related" panels) and stacks below the main content on mobile.
 */
export function PageContainer({
  children,
  aside,
  className,
  width = "default",
}: {
  children: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
  /** `narrow` for long-form reading pages (legal, articles). */
  width?: "default" | "narrow";
}) {
  const max = width === "narrow" ? "max-w-3xl" : "max-w-6xl";

  if (!aside) {
    return (
      <main className={cn("mx-auto w-full px-3 py-4 md:py-6", max, className)}>
        {children}
      </main>
    );
  }

  return (
    <div className={cn("mx-auto w-full px-3 py-4 md:py-6", max, className)}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <main className="min-w-0 flex-1">{children}</main>
        <aside className="w-full shrink-0 lg:w-[300px]">{aside}</aside>
      </div>
    </div>
  );
}

/**
 * Page title block. `h1` is always rendered here so every page has exactly
 * one, and heading levels below never skip (Section 5, semantic HTML).
 */
export function PageHeader({
  title,
  subtitle,
  meta,
  actions,
}: {
  title: string;
  subtitle?: string;
  /** Small line beneath the title, e.g. "Showing 1–25 of 340". */
  meta?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-4 border-b-2 border-navy pb-2.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1>{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      {meta ? <div className="mt-1.5 text-xs text-ink-faint">{meta}</div> : null}
    </div>
  );
}

/**
 * Bordered content panel with a navy caption bar — the workhorse layout unit
 * for job detail sections and homepage blocks.
 */
export function Panel({
  title,
  children,
  action,
  id,
  className,
}: {
  title: string;
  children: React.ReactNode;
  /** Optional link rendered on the right of the caption bar. */
  action?: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <section id={id} className={cn("gov-panel", className)}>
      <div className="gov-panel-title flex items-center justify-between gap-3">
        <h2 className="font-serif text-base font-bold text-white">{title}</h2>
        {action ? <div className="shrink-0 text-xs">{action}</div> : null}
      </div>
      <div className="p-3">{children}</div>
    </section>
  );
}
