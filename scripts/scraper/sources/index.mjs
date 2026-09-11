/**
 * Source adapter registry (Phase B: CSBC only).
 *
 * Phase G adds one adapter per source here (SSC, UPSC, IBPS, RRB zones,
 * BSSC, Employment News, myScheme, PIB...). The generic runner in
 * lib/scrape.mjs works with any adapter implementing:
 *   { SOURCE_NAME, listingUrl(source), extractItems(html, baseUrl) }
 */

import * as csbc from "./csbc.mjs";

export const adapters = {
  [csbc.SOURCE_NAME]: csbc,
};

export function getAdapter(sourceName) {
  return adapters[sourceName] ?? null;
}
