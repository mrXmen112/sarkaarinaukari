import test from "node:test";
import assert from "node:assert/strict";

import { auditJob } from "./jobAudit.ts";

const BASE = {
  vacancy_total: 100,
  vacancy_breakdown: { general: 40, obc: 27, sc: 15, st: 8, ews: 10 },
  pay_scale: "Level 4, Rs 25,500 - 81,100",
  source_verified: true,
  official_link: "https://example.gov.in/notice",
  last_verified_at: new Date().toISOString(),
  published_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-02T00:00:00Z",
  application_start: "2026-10-01",
  application_end: "2026-10-31",
};

test("a clean, sourced job passes the audit", () => {
  const r = auditJob(BASE);
  assert.equal(r.failsAudit, false);
  assert.deepEqual(r.blocking, []);
  assert.equal(r.vacancyWithheld, false);
  assert.equal(r.salaryWithheld, false);
});

test("a breakdown that contradicts the total is blocking and withholds both figures", () => {
  const r = auditJob({
    ...BASE,
    vacancy_total: 100,
    vacancy_breakdown: { general: 70, obc: 40 },
  });
  assert.equal(r.failsAudit, true);
  assert.ok(r.blocking.includes("vacancy_sum_mismatch"));
  assert.equal(r.vacancyWithheld, true);
  assert.equal(r.salaryWithheld, true);
});

test("an identical split across three or more categories is suspicious", () => {
  const r = auditJob({
    ...BASE,
    vacancy_total: 300,
    vacancy_breakdown: { general: 100, obc: 100, sc: 100 },
  });
  assert.ok(r.blocking.includes("vacancy_breakdown_uniform"));
});

test("a missing official source is blocking", () => {
  const r = auditJob({
    ...BASE,
    official_link: null,
    source_url: null,
    official_notification_url: null,
  });
  assert.ok(r.blocking.includes("missing_official_source"));
});

test("a publish date after the last update is blocking", () => {
  const r = auditJob({
    ...BASE,
    published_at: "2026-10-05T00:00:00Z",
    updated_at: "2026-10-02T00:00:00Z",
  });
  assert.ok(r.blocking.includes("published_after_updated"));
});

test("an application window that ends before it starts is blocking", () => {
  const r = auditJob({
    ...BASE,
    application_start: "2026-11-01",
    application_end: "2026-10-31",
  });
  assert.ok(r.blocking.includes("invalid_application_dates"));
});

test("a verification stamp older than 7 days is blocking", () => {
  const r = auditJob({
    ...BASE,
    last_verified_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  });
  assert.ok(r.blocking.includes("stale_verification"));
});

test("never-verified rows warn but do not withhold figures", () => {
  const r = auditJob({
    ...BASE,
    source_verified: false,
    last_verified_at: null,
  });
  assert.equal(r.failsAudit, false);
  assert.deepEqual(r.warnings.sort(), ["salary_unverified", "vacancy_unverified"]);
  assert.equal(r.vacancyWithheld, false);
});

test("zero placeholder rows are ignored", () => {
  const r = auditJob({
    ...BASE,
    vacancy_total: 100,
    vacancy_breakdown: { general: 100, obc: 0, sc: 0 },
  });
  assert.equal(r.failsAudit, false);
});
