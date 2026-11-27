import test from "node:test";
import assert from "node:assert/strict";

import { jobPostingSchema, type JobPostingSubject } from "./jobPosting.ts";

const TODAY = "2026-11-27";
const BASE: JobPostingSubject = {
  title: "SSC CGL 2026",
  slug: "ssc-cgl-2026",
  department: "Staff Selection Commission",
  state: null,
  short_description: "Combined Graduate Level recruitment",
  eligibility_education: "Bachelor's degree",
  notice_number: "05/2026",
  vacancy_total: 1200,
  application_end: "2026-12-20",
  official_link: "https://ssc.gov.in/notice",
  official_apply_url: null,
  apply_link_verified: false,
  verification_status: "verified",
  type: "job",
  status: "active",
  published_at: "2026-11-01",
  notification_date: "2026-11-01",
  created_at: "2026-11-01",
};

test("an open, verified job gets JobPosting with official identifiers", () => {
  const schema = jobPostingSchema(BASE, { today: TODAY });
  assert.ok(schema);
  assert.equal(schema["@type"], "JobPosting");
  assert.equal(schema.totalJobOpenings, 1200);
  assert.equal(schema.validThrough, "2026-12-20");
  assert.equal((schema.identifier as { value: string }).value, "05/2026");
  assert.equal("directApply" in schema, false);
});

test("unverified, non-job, upcoming and closed pages never get JobPosting", () => {
  assert.equal(jobPostingSchema({ ...BASE, verification_status: "unverified" }, { today: TODAY }), null);
  assert.equal(jobPostingSchema({ ...BASE, type: "entrance" }, { today: TODAY }), null);
  assert.equal(jobPostingSchema({ ...BASE, status: "upcoming" }, { today: TODAY }), null);
  assert.equal(jobPostingSchema({ ...BASE, application_end: "2026-11-20" }, { today: TODAY }), null);
});

test("figures withheld by the audit must not be advertised to Google", () => {
  assert.equal(jobPostingSchema(BASE, { today: TODAY, withheld: true }), null);
  assert.equal(jobPostingSchema({ ...BASE, vacancy_total: null }, { today: TODAY }), null);
});

test("directApply is emitted only with a verified application URL", () => {
  const schema = jobPostingSchema(
    {
      ...BASE,
      apply_link_verified: true,
      official_apply_url: "https://ssc.gov.in/apply/2026",
    },
    { today: TODAY },
  );
  assert.equal(schema?.directApply, true);
});
