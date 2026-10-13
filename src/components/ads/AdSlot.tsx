/**
 * Ad slots (Phase 5 — AdSense-ready layout).
 *
 * Rules this component enforces so the layout passes an AdSense policy review
 * and keeps Core Web Vitals intact:
 *
 *  1. **Reserved space.** The wrapper always occupies its height (min-height)
 *     so inserting or removing an ad never shifts the content around it — no
 *     CLS, and an Apply button never jumps.
 *  2. **Clearly labelled.** "Advertisement" is visible so users are not
 *     misled into thinking an ad is an official notice.
 *  3. **Never inside content.** Ads are only placed at the boundaries this
 *     site uses: after the summary/above-the-fold block and after the job
 *     table on listings — never between a job title and its Apply button, and
 *     never inside the FAQ or important-links panels.
 *  4. **Off unless configured.** We run Monetag, not AdSense, so this slot is
 *     inert by default and renders NOTHING at all — no empty box and no
 *     wasted vertical space on content pages. If an AdSense account is ever
 *     added, set NEXT_PUBLIC_ADSENSE_CLIENT and the slots appear.
 *  5. **No ad on policy pages** — the About, Contact, Privacy, Terms,
 *     Disclaimer and Editorial Policy pages render no ad slots at all.
 *
 * Monetag note: Monetag units (popunder, push, vignette) are loaded through
 * the scripts in the root layout with lazyOnload, not through this component.
 */

const AD_SENSE_ENABLED = !!process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

export type AdSlotVariant = "in-content" | "after-list";

export function AdSlot({
  slot,
  variant = "in-content",
}: {
  slot: string;
  variant?: AdSlotVariant;
}) {
  // Not configured (our normal state) -> render nothing, so pages keep their
  // full height instead of showing an empty reserved gap.
  if (!AD_SENSE_ENABLED) return null;

  const minHeight = variant === "in-content" ? "min-h-[90px]" : "min-h-[90px]";

  return (
    <aside
      aria-label="Advertisement"
      className={`my-5 w-full ${minHeight}`}
    >
      <p className="mb-1 text-center text-[0.625rem] uppercase tracking-wide text-ink-faint">
        Advertisement
      </p>
      <div className="flex justify-center">
        <ins
          className="adsbygoogle block"
          style={{ display: "block" }}
          data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </aside>
  );
}

/** True when ad slots should be rendered on this route (Phase 5 policy). */
export function adsAllowedOnPath(pathname: string): boolean {
  const noAds = [
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/disclaimer",
    "/editorial-policy",
    "/login",
    "/profile",
  ];
  return !noAds.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}