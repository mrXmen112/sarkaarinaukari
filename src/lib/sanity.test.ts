import test from "node:test";
import assert from "node:assert/strict";

import {
  cleanAgeRelaxation,
  cleanFees,
  cleanVacancyBreakdown,
  duplicateCategoryKeys,
  hasDisplayValue,
  normaliseJobJsonFields,
  parseNumberMap,
  validateJobJsonFields,
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

/* ------------------------------------------------------------------ *
 * W5.4 (save side) — the guard that stops junk being written at all.
 * ------------------------------------------------------------------ */

test("parseNumberMap: empty input is a valid empty map", () => {
  assert.deepEqual(parseNumberMap(""), { ok: true, map: {} });
  assert.deepEqual(parseNumberMap(null), { ok: true, map: {} });
  assert.deepEqual(parseNumberMap("   "), { ok: true, map: {} });
});

test("parseNumberMap coerces numeric strings and drops placeholders", () => {
  assert.deepEqual(parseNumberMap('{"A":"5","B":"Nil","C":-2,"D":0}'), {
    ok: true,
    map: { A: 5, C: -2, D: 0 },
  });
});

test("parseNumberMap rejects malformed / non-numeric input with a named key", () => {
  assert.deepEqual(parseNumberMap("{"), { ok: false, error: "must be valid JSON" });
  assert.deepEqual(parseNumberMap("[]"), {
    ok: false,
    error: "must be a JSON object of category: number",
  });
  assert.deepEqual(parseNumberMap('{"A":"abc"}'), { ok: false, error: '"A" must be a number' });
  assert.deepEqual(parseNumberMap('{"A":{"x":1}}'), { ok: false, error: '"A" must be a number' });
});

test("duplicateCategoryKeys flags alias collisions but not distinct keys", () => {
  const dup = duplicateCategoryKeys('{"All categories":0,"Total":0}');
  assert.equal(dup.ok, true);
  assert.equal(dup.ok && dup.groups.length, 1);
  assert.equal(dup.ok && dup.groups[0].rawKeys.length, 2);

  assert.deepEqual(duplicateCategoryKeys('{"General":0,"OBC":0}'), { ok: true, groups: [] });
  assert.deepEqual(duplicateCategoryKeys(""), { ok: true, groups: [] });
  assert.deepEqual(duplicateCategoryKeys("nope"), { ok: false, error: "must be valid JSON" });
});

test("validateJobJsonFields accepts a clean job draft", () => {
  const fields = {
    vacancy_breakdown: '{"General":100,"OBC":50}',
    vacancy_total: "150",
    application_fee: '{"General":500,"SC/ST":250}',
    age_relaxation: '{"OBC":3}',
  };
  assert.equal(validateJobJsonFields(fields), null);
});

test("validateJobJsonFields rejects a breakdown that contradicts its total", () => {
  const fields = {
    vacancy_breakdown: '{"General":100}',
    vacancy_total: "150",
    application_fee: "",
    age_relaxation: "",
  };
  assert.equal(
    validateJobJsonFields(fields),
    "Vacancy breakdown sums to 100 but total vacancies is 150.",
  );
});

test("validateJobJsonFields skips the sum check when the total is unknown", () => {
  assert.equal(
    validateJobJsonFields({
      vacancy_breakdown: '{"General":100}',
      vacancy_total: "",
      application_fee: "",
      age_relaxation: "",
    }),
    null,
  );
});

test("validateJobJsonFields rejects duplicate fee rows", () => {
  const fields = {
    vacancy_breakdown: "",
    vacancy_total: "",
    application_fee: '{"All categories":0,"Total":0}',
    age_relaxation: "",
  };
  assert.match(validateJobJsonFields(fields) ?? "", /Duplicate fee rows/);
});

test("validateJobJsonFields names the column when a JSON field is malformed", () => {
  const fields = {
    vacancy_breakdown: "not json",
    vacancy_total: "",
    application_fee: "",
    age_relaxation: "",
  };
  assert.equal(validateJobJsonFields(fields), "Vacancy breakdown must be valid JSON.");
});

test("normaliseJobJsonFields drops zero rows and placeholder strings", () => {
  const out = normaliseJobJsonFields({
    vacancy_breakdown: '{"General":100,"Female":0}',
    application_fee: '{"General":"500","SC/ST":"Nil"}',
    age_relaxation: "{}",
    title: "Untouched",
  });
  assert.equal(out.vacancy_breakdown, '{"General":100}');
  assert.equal(out.application_fee, '{"General":500}');
  assert.equal(out.age_relaxation, "");
  assert.equal(out.title, "Untouched");
});

test("normaliseJobJsonFields blanks a fully-zero breakdown and leaves bad JSON alone", () => {
  assert.equal(
    normaliseJobJsonFields({ vacancy_breakdown: '{"Female":0,"EWS":0}' }).vacancy_breakdown,
    "",
  );
  assert.equal(
    normaliseJobJsonFields({ vacancy_breakdown: "oops" }).vacancy_breakdown,
    "oops",
  );
});
