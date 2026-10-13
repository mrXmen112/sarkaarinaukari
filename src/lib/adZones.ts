/**
 * Ad zone switches (Phase 7A).
 *
 * We run Monetag. Four zones are loaded site-wide from the root layout. Two of
 * them are aggressive formats that broke trust on the site:
 *
 *   - the popunder opened a new tab on click / on leaving the page,
 *   - the vignette covered the whole screen with a full-page overlay.
 *
 * They are NOT deleted. Each one sits behind its own environment flag so the
 * network can be re-configured (or a zone switched back on) without touching
 * code. To find the exact culprit, deploy a Vercel Preview build and turn the
 * zones off one at a time.
 *
 * Defaults are chosen so that doing nothing gives the safe behaviour:
 *   keep-the-income zones default to enabled, redirect/overlay zones default
 *   to disabled.
 *
 * These are NEXT_PUBLIC_* values, so they are inlined at build time — changing
 * one in Vercel triggers a rebuild, which is exactly what a Preview test needs.
 */

/** Zone 1 — the standard Monetag tag container (banner / native / in-page). */
export const AD_ZONE_1_ENABLED = process.env.NEXT_PUBLIC_AD_ZONE_1_ENABLED !== "false";

/** Zone 2 — POPUNDER. Opens another tab in the background. Off by default. */
export const AD_ZONE_2_ENABLED = process.env.NEXT_PUBLIC_AD_ZONE_2_ENABLED === "true";

/** Zone 3 — push notifications. Does not navigate or hijack clicks. */
export const AD_ZONE_3_ENABLED = process.env.NEXT_PUBLIC_AD_ZONE_3_ENABLED !== "false";

/** Zone 4 — VIGNETTE. Full-screen overlay covering the page. Off by default. */
export const AD_ZONE_4_ENABLED = process.env.NEXT_PUBLIC_AD_ZONE_4_ENABLED === "true";

export type AdZoneId = 1 | 2 | 3 | 4;

export type AdZone = {
  id: AdZoneId;
  label: string;
  format: string;
  /** Whether the format can navigate the page, open a tab, or cover it. */
  intrusive: boolean;
  enabled: boolean;
  note: string;
};

/**
 * Inventory for /admin/seo-health and the Phase 7A report. Kept in one place so
 * the "which zone does what" answer is never guesswork.
 */
export const AD_ZONES: AdZone[] = [
  {
    id: 1,
    label: "Main tag container",
    format: "banner / native / in-page",
    intrusive: false,
    enabled: AD_ZONE_1_ENABLED,
    note: "Standard display container. Kept on — this is the income.",
  },
  {
    id: 2,
    label: "Popunder",
    format: "onclick popunder",
    intrusive: true,
    enabled: AD_ZONE_2_ENABLED,
    note: "Opens a new tab on click/exit. Disabled by default — this was the redirect users hit.",
  },
  {
    id: 3,
    label: "Push notifications",
    format: "push notification",
    intrusive: false,
    enabled: AD_ZONE_3_ENABLED,
    note: "Browser push opt-in. Does not navigate or hijack clicks.",
  },
  {
    id: 4,
    label: "Vignette",
    format: "interstitial vignette",
    intrusive: true,
    enabled: AD_ZONE_4_ENABLED,
    note: "Full-screen overlay that covers the page. Disabled by default.",
  },
];

/**
 * Outbound links may only point off-site from Apply / Official Website /
 * Notification controls, and always with noopener noreferrer nofollow.
 * Every one of them routes through the official government domain — never
 * through an ad network.
 */
export const OFFSITE_LINK_ATTRS = {
  target: "_blank",
  rel: "noopener noreferrer nofollow",
} as const;