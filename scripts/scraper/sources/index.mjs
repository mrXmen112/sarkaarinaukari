/**
 * Source adapter registry.
 *
 * Each adapter implements:
 *   { SOURCE_NAME, listingUrl(source), extractItems(html, baseUrl) }
 *
 * Sources whose `parser` is 'generic' use the conservative generic adapter.
 * A few sensitive government portals (UPSC, PIB, RRB Patna) remain bot-blocked
 * and must be supplied through Quick Publish until a permitted feed exists.
 */

import * as csbc from "./csbc.mjs";
import * as employmentnews from "./employmentnews.mjs";
import * as ibps from "./ibps.mjs";
import * as generic from "./generic.mjs";

export const adapters = {
  [csbc.SOURCE_NAME]: csbc,
  [employmentnews.SOURCE_NAME]: employmentnews,
  [ibps.SOURCE_NAME]: ibps,
};

/** @param {string} sourceName @param {string | null} parser */
export function getAdapter(sourceName, parser = null) {
  return adapters[sourceName] ?? (parser === "generic" ? generic : null);
}
