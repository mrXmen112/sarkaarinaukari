import test from "node:test";
import assert from "node:assert/strict";

import {
  buildJobPosting,
  GOOGLE_CREDENTIAL_CATEGORIES,
  mapCredentialCategory,
  parseSalaryRange,
  shouldEmitJobPosting,
  type JobPostingInput,
} from "./jobPosting.ts";

/**
 * Part C — JobPosting structured data.
 *
 * Run with:  npm test
 * (Node 24 strips the types natively; no test framework dependency.)
 */

const VERIFIED_OPEN: JobPostingInput = {
  title: "SSC GD Constable 2026",
  short_description: "Constable (General Duty) in CAPF forces.",
  department: "Staff Selection Commission",
  application_end: "2026-11-30",
  notification_date: "2026-10-01",
  created_at: "2026-09-01T00:00:00Z",
  state: "central",
  vacancy_total: 12000,
  eligibility_education: "Graduation Degree",
  pay_scale: "Level 3, Rs 18,400 - 56,100",
  status: "active",
  verification_status: "verified",
  official_link: "https://ssc.gov.in/notice",
  link_http_status: 200,
};

/* ------------------------------------------------------------------ */
/* credentialCategory must be one of Google's five values, or omitted */
/* ------------------------------------------------------------------ */

test("maps Indian eligibility text onto Google's enum", () => {
  const cases: [string, string | null][] = [
    ["10th Pass", "high school"],
    ["Class 12 / Higher Secondary", "high school"],
    ["Intermediate (12th)", "high school"],
    ["ITI / Diploma in Electronics", "associate degree"],
    ["Diploma in Nursing", "associate degree"],
    ["Graduation Degree", "bachelor degree"],
    ["Bachelor of Technology", "bachelor degree"],
    ["B.Ed / D.El.Ed", "bachelor degree"],
    ["BCA", "bachelor degree"],
    ["Post Graduate Degree", "postgraduate degree"],
    ["Master of Science", "postgraduate degree"],
    ["MBA", "postgraduate degree"],
    ["Professional Certificate Course", "professional certificate"],
  ];
  for (const [input, expected] of cases) {
    assert.equal(
      mapCredentialCategory(input),
      expected,
      `"${input}" should map to "${expected}"`,
    );
  }
});

test("returns null for text that cannot be mapped cleanly", () => {
  // Guessing here is what produced the Search Console warnings, so anything
  // unrecognised must return null and cause the block to be omitted.
  assert.equal(mapCredentialCategory("As per official notification"), null);
  assert.equal(mapCredentialCategory(""), null);
  assert.equal(mapCredentialCategory(null), null);
  assert.equal(mapCredentialCategory(undefined), null);
});

test("postgraduate never falls through to bachelor", () => {
  // "post graduate" contains "graduat", so ordering is load-bearing.
  assert.equal(mapCredentialCategory("Post Graduate"), "postgraduate degree");
});

test("every mapped value is a real Google enum value", () => {
  const allowed = new Set<string>(GOOGLE_CREDENTIAL_CATEGORIES);
  for (const input of [
    "10th Pass",
    "ITI",
    "Graduation",
    "MBA",
    "Bachelor of Technology",
  ]) {
    const mapped = mapCredentialCategory(input);
    if (mapped !== null) assert.ok(allowed.has(mapped));
  }
});

/* ------------------------------------------------------------------ */
/* emit gate                                                          */
/* ------------------------------------------------------------------ */

test("emits only for verified, open jobs with an official link", () => {
  assert.equal(shouldEmitJobPosting(VERIFIED_OPEN), true);

  assert.equal(
    shouldEmitJobPosting({ ...VERIFIED_OPEN, verification_status: "unverified" }),
    false,
    "unverified must not emit",
  );
  assert.equal(
    shouldEmitJobPosting({ ...VERIFIED_OPEN, verification_status: "needs_review" }),
    false,
    "needs_review must not emit",
  );
  assert.equal(
    shouldEmitJobPosting({ ...VERIFIED_OPEN, verification_status: null }),
    false,
    "unknown status must not emit",
  );
  assert.equal(
    shouldEmitJobPosting({ ...VERIFIED_OPEN, status: "closed" }),
    false,
    "closed must not emit",
  );
  assert.equal(
    shouldEmitJobPosting({ ...VERIFIED_OPEN, official_link: null }),
    false,
    "no official link must not emit",
  );
});

test("buildJobPosting returns null when the gate fails", () => {
  assert.equal(
    buildJobPosting({ ...VERIFIED_OPEN, verification_status: "unverified" }, { url: "https://x" }),
    null,
  );
});

/* ------------------------------------------------------------------ */
/* location: never invent data                                        */
/* ------------------------------------------------------------------ */

test("emits country and region but never locality, street or postal code", () => {
  const doc = buildJobPosting(VERIFIED_OPEN, {
    url: "https://x/jobs/ssc-gd-2026",
    regionName: "Delhi",
  });
  assert.ok(doc);
  const address = (doc.jobLocation as { address: Record<string, unknown> }).address;

  assert.equal(address.addressCountry, "IN");
  assert.equal(address.addressRegion, "Delhi");
  assert.equal(address.addressLocality, undefined, "never invent a city");
  assert.equal(address.streetAddress, undefined, "never invent a street");
  assert.equal(address.postalCode, undefined, "never invent a postal code");
});

test("omits addressRegion when the state is unknown", () => {
  const doc = buildJobPosting(VERIFIED_OPEN, {
    url: "https://x/jobs/ssc-gd-2026",
    regionName: undefined,
  });
  assert.ok(doc);
  const address = (doc.jobLocation as { address: Record<string, unknown> }).address;
  assert.equal(address.addressCountry, "IN");
  assert.equal(address.addressRegion, undefined);
});

/* ------------------------------------------------------------------ */
/* validThrough                                                       */
/* ------------------------------------------------------------------ */

test("validThrough is the application end date for an open job", () => {
  const doc = buildJobPosting(VERIFIED_OPEN, { url: "https://x" });
  assert.ok(doc);
  assert.equal(doc.validThrough, "2026-11-30");
});

test("a closed job emits nothing at all, so no stale validThrough", () => {
  assert.equal(
    buildJobPosting({ ...VERIFIED_OPEN, status: "closed" }, { url: "https://x" }),
    null,
  );
});

/* ------------------------------------------------------------------ */
/* baseSalary is only ever a real parsed range                        */
/* ------------------------------------------------------------------ */

test("parses an explicit rupee range and ignores separators", () => {
  assert.deepEqual(parseSalaryRange("Level 3, Rs 18,400 - 56,100"), {
    min: 18400,
    max: 56100,
    currency: "INR",
  });
});

test("refuses to guess a salary from vague text", () => {
  assert.equal(parseSalaryRange("Level 10"), null);
  assert.equal(parseSalaryRange("As per notification"), null);
  assert.equal(parseSalaryRange(null), null);
  assert.equal(parseSalaryRange(""), null);
  assert.equal(parseSalaryRange("$45,000 - $60,000"), null, "not INR");
});

test("baseSalary is present only when a range parses", () => {
  const withPay = buildJobPosting(VERIFIED_OPEN, { url: "https://x" });
  assert.ok(withPay);
  assert.ok(withPay.baseSalary, "should emit a parsed baseSalary");

  const withoutPay = buildJobPosting(
    { ...VERIFIED_OPEN, pay_scale: "Level 10" },
    { url: "https://x" },
  );
  assert.ok(withoutPay);
  assert.equal(withoutPay.baseSalary, undefined, "must omit rather than guess");
});

/* ------------------------------------------------------------------ */
/* document shape                                                     */
/* ------------------------------------------------------------------ */

test("no property is serialised as an explicit null", () => {
  const doc = buildJobPosting(
    { ...VERIFIED_OPEN, vacancy_total: null, eligibility_education: null, pay_scale: null },
    { url: "https://x" },
  );
  assert.ok(doc);
  for (const [key, value] of Object.entries(doc)) {
    assert.notEqual(value, null, `${key} must be omitted, not null`);
  }
});

test("emits @type JobPosting and the official url", () => {
  const doc = buildJobPosting(VERIFIED_OPEN, { url: "https://x/jobs/ssc-gd-2026" });
  assert.ok(doc);
  assert.equal(doc["@context"], "https://schema.org");
  assert.equal(doc["@type"], "JobPosting");
  assert.equal(doc.url, "https://x/jobs/ssc-gd-2026");
  assert.equal(doc.employmentType, "FULL_TIME");
  assert.equal(doc.totalJobOpenings, 12000);
});

test("the whole job is round-trippable through JSON", () => {
  const doc = buildJobPosting(VERIFIED_OPEN, { url: "https://x", regionName: "Bihar" });
  assert.ok(doc);
  assert.deepEqual(JSON.parse(JSON.stringify(doc)), doc);
});