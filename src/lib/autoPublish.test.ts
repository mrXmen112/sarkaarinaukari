import test from "node:test";
import assert from "node:assert/strict";

import {
  assessAutoPublish,
  crossCheckSourceText,
  duplicateKey,
  isTrustedOfficialUrl,
  validateRequiredFields,
} from "./autoPublish.ts";

const SOURCE = {
  name: "SSC Notifications",
  base_url: "https://ssc.gov.in/",
  allowed_domains: ["ssc.gov.in"],
  auto_publish: true,
};

const NOTICE = `
  Staff Selection Commission Combined Graduate Level Examination 2026 Advt 05/2026.
  Vacancy 1200. Last date for submission of online application 20/12/2026.
  Candidates must have a Bachelor's degree from a recognised university.
  Application fee 100 for General category. Apply at https://ssc.gov.in/.
`;

const DRAFT = {
  title: "SSC CGL 2026 Combined Graduate Level",
  department: "Staff Selection Commission",
  department_slug: "ssc",
  official_link: "https://ssc.gov.in/api/notices/advt-05-2026",
  notice_number: "05/2026",
  vacancy_total: 1200,
  eligibility_education: "Bachelor's degree",
  application_start: "2026-11-20",
  application_end: "2026-12-20",
  type: "job",
};

test("a registered official domain is trusted; an unrelated one is not", () => {
  assert.equal(isTrustedOfficialUrl("https://ssc.gov.in/notice", SOURCE), true);
  assert.equal(isTrustedOfficialUrl("https://ssc.gov.in.evil.test/x", SOURCE), false);
  assert.equal(isTrustedOfficialUrl("https://blogspot.com/post/x", SOURCE), false);
  assert.equal(isTrustedOfficialUrl("https://ssc.gov.in/x", { ...SOURCE, auto_publish: false }), false);
});

test("mandatory fields are enforced", () => {
  const result = validateRequiredFields({ ...DRAFT, vacancy_total: null, title: "" });
  assert.equal(result.ok, false);
  const codes = result.errors.map((e) => e.code);
  assert.ok(codes.includes("missing_title"));
  assert.ok(codes.includes("missing_vacancy_total"));
});

test("a broken application window is rejected", () => {
  const result = validateRequiredFields({ ...DRAFT, application_start: "2026-12-25" });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.code === "invalid_application_window"));
});

test("extracted values are cross-checked against the official text", () => {
  assert.equal(crossCheckSourceText(DRAFT, NOTICE).ok, true);
  const inflated = crossCheckSourceText({ ...DRAFT, vacancy_total: 99999 }, NOTICE);
  assert.equal(inflated.ok, false);
  assert.ok(inflated.errors.some((e) => e.code === "vacancy_not_in_source"));
});

test("advertisement number is the preferred duplicate key", () => {
  assert.equal(duplicateKey(DRAFT), "notice:05/2026");
  assert.equal(duplicateKey({ ...DRAFT, notice_number: null }), "url:https://ssc.gov.in/api/notices/advt-05-2026");
});

test("full assessment passes only a complete, source-backed notice", () => {
  assert.deepEqual(assessAutoPublish(DRAFT, SOURCE, NOTICE), { ok: true, errors: [] });
  const bad = assessAutoPublish({ ...DRAFT, official_link: "https://random.test/x" }, SOURCE, NOTICE);
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.some((e) => e.code === "untrusted_source"));
});
