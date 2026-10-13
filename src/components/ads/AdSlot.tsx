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
 *  4. **Disabled until approved.** Without NEXT_PUBLIC_ADSENSE_CLIENT it
 *     renders an empty reserved slot (no visible box, no layout shift), so we
 *     can ship the layout now and switch ads on at approval time.
 *  5. **No ad on policy pages** — the About, Contact, Privacy, Terms,
 *     Disclaimer and Editorial Policy pages render no ad slots at all.
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
  const minHeight = variant === "in-content" ? "min-h-[90px]" : "min-h-[90px]";

  if (!AD_SENSE_ENABLED) {
    // Keep the space reserved (invisible) so enabling ads later does not move
    // anything, but show no empty box to visitors today.
    return <div aria-hidden="true" className={`w-full ${minHeight}`} />;
  }

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