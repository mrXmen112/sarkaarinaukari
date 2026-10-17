import test from "node:test";
import assert from "node:assert/strict";

import { classifyApplyLink, isHomepageUrl } from "./applyLink.ts";

/**
 * W5.5 — where the "Apply" button points.
 *
 * Run with:  npm test
 *
 * Hard rule enforced here: we only ever earn the word "Apply" when there is a
 * real, unflagged, non-homepage official URL and the job has not closed. Every
 * other case degrades to "Official Website", our own detail page, or "Closed" —
 * never a dead or misleading link.
 */

const NOW = Date.parse("2026-10-17T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

test("isHomepageUrl: roots and default documents count, deep links do not", () => {
  assert.equal(isHomepageUrl("https://ssc.gov.in/"), true);
  assert.equal(isHomepageUrl("https://ssc.gov.in"), true);
  assert.equal(isHomepageUrl("https://ssc.gov.in/index.php"), true);
  assert.equal(isHomepageUrl("https://ssc.gov.in/Default.aspx"), true);
  assert.equal(isHomepageUrl("https://ssc.gov.in/?p=1"), true);
  assert.equal(isHomepageUrl("https://ssc.gov.in/apply/12345"), false);
  assert.equal(isHomepageUrl("https://ibps.in/careers/notice.pdf"), false);
  assert.equal(isHomepageUrl("not a url"), false);
});

test("a real, unflagged, non-homepage URL earns an Apply button", () => {
  const r = classifyApplyLink(
    {
      slug: "ssc-gd-2026",
      official_link: "https://ssc.gov.in/apply/gd-2026",
      link_flagged: false,
      status: "active",
      application_end: new Date(NOW + 10 * DAY).toISOString(),
    },
    NOW,
  );
  assert.deepEqual(r, {
    kind: "apply",
    href: "https://ssc.gov.in/apply/gd-2026",
    external: true,
  });
});

test("a homepage official link becomes Official Website, not Apply", () => {
  const r = classifyApplyLink(
    {
      slug: "bpsc-2026",
      official_link: "https://bpsc.bihar.gov.in/",
      link_flagged: false,
      status: "active",
      application_end: new Date(NOW + 10 * DAY).toISOString(),
    },
    NOW,
  );
  assert.equal(r.kind, "website");
  assert.equal(r.href, "https://bpsc.bihar.gov.in/");
  assert.equal(r.external, true);
});

test("a flagged link falls back to our own detail page", () => {
  const r = classifyApplyLink(
    {
      slug: "up-police-2026",
      official_link: "https://uppbpb.gov.in/apply",
      link_flagged: true,
      status: "active",
      application_end: new Date(NOW + 10 * DAY).toISOString(),
    },
    NOW,
  );
  assert.deepEqual(r, {
    kind: "details",
    href: "/jobs/up-police-2026",
    external: false,
  });
});

test("a missing official link falls back to our own detail page", () => {
  const r = classifyApplyLink(
    {
      slug: "rrb-ntpc-2026",
      official_link: null,
      status: "active",
      application_end: new Date(NOW + 10 * DAY).toISOString(),
    },
    NOW,
  );
  assert.equal(r.kind, "details");
  assert.equal(r.href, "/jobs/rrb-ntpc-2026");
});

test("a closed job is Closed even when the link is good", () => {
  const r = classifyApplyLink(
    {
      slug: "old-2025",
      official_link: "https://ssc.gov.in/apply/old",
      link_flagged: false,
      status: "closed",
      application_end: new Date(NOW - 5 * DAY).toISOString(),
    },
    NOW,
  );
  assert.deepEqual(r, {
    kind: "closed",
    href: "/jobs/old-2025",
    external: false,
  });
});

test("a job closing today is still open today", () => {
  const r = classifyApplyLink(
    {
      slug: "closes-today",
      official_link: "https://ssc.gov.in/apply/x",
      link_flagged: false,
      status: "active",
      application_end: new Date(NOW - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
    },
    NOW,
  );
  assert.equal(r.kind, "apply");
});

test("an end date in the past flags Closed even without status", () => {
  const r = classifyApplyLink(
    {
      slug: "yesterday",
      official_link: "https://ssc.gov.in/apply/y",
      status: "active",
      application_end: new Date(NOW - 3 * DAY).toISOString(),
    },
    NOW,
  );
  assert.equal(r.kind, "closed");
});
