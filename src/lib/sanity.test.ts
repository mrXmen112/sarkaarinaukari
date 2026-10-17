import test from "node:test";
import assert from "node:assert/strict";

import {
  cleanAgeRelaxation,
  cleanFees,
  cleanVacancyBreakdown,
  hasDisplayValue,
} from "./sanity.ts";

/**
 * W5.4 — sanity for the category-keyed JSON columns.
 *
 * Run with:  npm test
 *
 * The rule under test: hide it rather than print a wrong number. A "Female: 0"
 * placeholder, a breakdown that contradicts its own total, and a duplicated fee
 * row are all worse than an empty cell.
 */

test("cleanVacancyBreakdown drops zero placeholders", () => {
  assert.deepEqual(
    cleanVacancyBreakdown({ General: 100, Female: 0, OBC: 50 }, 150),
    [
      { key: "general", value: 100 },
      { key: "obc", value: 50 },
    ],
  );
});

test("cleanVacancyBreakdown returns null when every row is zero", () => {
  assert.equal(cleanVacancyBreakdown({ Female: 0, EWS: 0 }, null), null);
});

test("cleanVacancyBreakdown withholds a breakdown that does not sum to its total", () => {
  assert.equal(cleanVacancyBreakdown({ General: 100, OBC: 40 }, 200), null);
  // ...but an unknown total (0 / null) cannot contradict anything.
  assert.deepEqual(cleanVacancyBreakdown({ General: 100 }, null), [
    { key: "general", value: 100 },
  ]);
  assert.deepEqual(cleanVacancyBreakdown({ General: 100 }, 0), [
    { key: "general", value: 100 },
  ]);
});

test("cleanVacancyBreakdown merges duplicate keys", () => {
  assert.deepEqual(
    cleanVacancyBreakdown({ "SC/ST": 30, sc_st: 20 }, 50),
    [{ key: "sc_st", value: 50 }],
  );
});

test("cleanVacancyBreakdown coerces numeric strings and drops garbage", () => {
  assert.deepEqual(
    cleanVacancyBreakdown({ General: "12", Nonsense: "abc" }, null),
    [{ key: "general", value: 12 }],
  );
});

test("cleanFees keeps an explicit 0 (exempt) row", () => {
  assert.deepEqual(
    cleanFees({ General: 500, "SC/ST": 0, PwBD: 0 }),
    [
      { key: "general", value: 500 },
      { key: "sc_st", value: 0 },
      { key: "pwbd", value: 0 },
    ],
  );
});

test("cleanFees collapses a uniform set to one All categories row", () => {
  assert.deepEqual(
    cleanFees({ "All Categories": 0, General: 0, OBC: 0 }),
    [{ key: "all", value: 0 }],
  );
});

test("cleanFees merges alias keys before deciding", () => {
  // "All categories" and "Total" are the same key; both 0 -> single all row.
  assert.deepEqual(cleanFees({ "All categories": 0, Total: 0 }), [
    { key: "all", value: 0 },
  ]);
});

test("cleanFees leaves genuinely different fees alone", () => {
  assert.deepEqual(
    cleanFees({ General: 500, "SC/ST": 250 }),
    [
      { key: "general", value: 500 },
      { key: "sc_st", value: 250 },
    ],
  );
});

test("cleanFees and cleanAgeRelaxation return null on empty input", () => {
  assert.equal(cleanFees(null), null);
  assert.equal(cleanFees({}), null);
  assert.equal(cleanAgeRelaxation(undefined), null);
});

test("cleanAgeRelaxation keeps a 0 (no relaxation) row", () => {
  assert.deepEqual(cleanAgeRelaxation({ OBC: 3, General: 0 }), [
    { key: "obc", value: 3 },
    { key: "general", value: 0 },
  ]);
});

test("hasDisplayValue treats placeholders as nothing", () => {
  assert.equal(hasDisplayValue(null), false);
  assert.equal(hasDisplayValue(undefined), false);
  assert.equal(hasDisplayValue(""), false);
  assert.equal(hasDisplayValue("   "), false);
  assert.equal(hasDisplayValue("N/A"), false);
  assert.equal(hasDisplayValue("nil"), false);
  assert.equal(hasDisplayValue("-"), false);
  assert.equal(hasDisplayValue("—"), false);
  assert.equal(hasDisplayValue("Graduate"), true);
  assert.equal(hasDisplayValue(0), true);
  assert.equal(hasDisplayValue(false), true);
});
