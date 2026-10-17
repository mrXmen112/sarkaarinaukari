/**
 * Source adapter registry.
 *
 * Each adapter implements:
 *   { SOURCE_NAME, listingUrl(source), extractItems(html, baseUrl) }
 *
 * UPSC and PIB are intentionally absent: both are bot-blocked (Akamai 403),
 * and RRB Patna's notice data sits behind a WAF-rejected endpoint, so those
 * three are handled as manual sources (pasted via Quick Publish).
 */

import * as csbc from "./csbc.mjs";
import * as employmentnews from "./employmentnews.mjs";
import * as ibps from "./ibps.mjs";

export const adapters = {
  [csbc.SOURCE_NAME]: csbc,
  [employmentnews.SOURCE_NAME]: employmentnews,
  [ibps.SOURCE_NAME]: ibps,
};

export function getAdapter(sourceName) {
  return adapters[sourceName] ?? null;
}
