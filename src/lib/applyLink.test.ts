import test from "node:test";
import assert from "node:assert/strict";

import { classifyApplyLink, isHomepageUrl } from "./applyLink.ts";

/**
 * 2026-10 audit — where the "Apply" button points.
 *
 * Run with:  npm test
 *
 * Hard rule enforced here: we only ever earn the word "Apply" when a dedicated
 * apply URL has been explicitly verified, the link is not flagged, it is a real
 * page (not a homepage or PDF), and the job has not closed. Every other case
 * degrades to "Official Website", our own detail page, or "Closed".
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

test("a verified, unflagged, non-homepage apply URL earns an Apply button", () => {
  const r = classifyApplyLink(
    {
      slug: "ssc-gd-2026",
      official_apply_url: "https://ssc.gov.in/apply/gd-2026",
      official_link: "https://ssc.gov.in/apply/gd-2026",
      apply_link_verified: true,
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

test("an unverified apply URL never earns Apply; it falls back to the site root", () => {
  const r = classifyApplyLink(
    {
      slug: "ssc-gd-2026",
      official_apply_url: "https://ssc.gov.in/apply/gd-2026",
      official_link: "https://ssc.gov.in/apply/gd-2026",
      apply_link_verified: false,
      link_flagged: false,
      status: "active",
      application_end: new Date(NOW + 10 * DAY).toISOString(),
    },
    NOW,
  );
  assert.deepEqual(r, {
    kind: "website",
    href: "https://ssc.gov.in",
    external: true,
  });
});

test("a verified homepage apply URL becomes Official Website, not Apply", () => {
  const r = classifyApplyLink(
    {
      slug: "bpsc-2026",
      official_apply_url: "https://bpsc.bihar.gov.in/",
      official_link: "https://bpsc.bihar.gov.in/",
      apply_link_verified: true,
      link_flagged: false,
      status: "active",
      application_end: new Date(NOW + 10 * DAY).toISOString(),
    },
    NOW,
  );
  assert.equal(r.kind, "website");
  assert.equal(r.href, "https://bpsc.bihar.gov.in");
  assert.equal(r.external, true);
});

test("a verified PDF apply URL is treated as a notification, not an application", () => {
  const r = classifyApplyLink(
    {
      slug: "ibps-po-2026",
      official_apply_url: "https://ibps.in/notice.pdf",
      official_link: "https://ibps.in/notice.pdf",
      apply_link_verified: true,
      link_flagged: false,
      status: "active",
      application_end: new Date(NOW + 10 * DAY).toISOString(),
    },
    NOW,
  );
  assert.equal(r.kind, "website");
  assert.equal(r.href, "https://ibps.in");
});

test("a flagged verified apply link with no separate site falls back to details", () => {
  const r = classifyApplyLink(
    {
      slug: "up-police-2026",
      official_apply_url: "https://uppbpb.gov.in/apply",
      official_link: "https://uppbpb.gov.in/apply",
      apply_link_verified: true,
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

test("a flagged apply link still uses an explicitly verified site URL", () => {
  const r = classifyApplyLink(
    {
      slug: "up-police-2026",
      official_apply_url: "https://uppbpb.gov.in/apply",
      official_site_url: "https://uppbpb.gov.in",
      apply_link_verified: true,
      link_flagged: true,
      status: "active",
      application_end: new Date(NOW + 10 * DAY).toISOString(),
    },
    NOW,
  );
  assert.equal(r.kind, "website");
  assert.equal(r.href, "https://uppbpb.gov.in");
});

test("a missing official link falls back to our own detail page", () => {
  const r = classifyApplyLink(
    {
      slug: "rrb-ntpc-2026",
      official_apply_url: null,
      official_link: null,
      apply_link_verified: false,
      status: "active",
      application_end: new Date(NOW + 10 * DAY).toISOString(),
    },
    NOW,
  );
  assert.equal(r.kind, "details");
  assert.equal(r.href, "/jobs/rrb-ntpc-2026");
});

test("a closed job is Closed even when the apply link is verified", () => {
  const r = classifyApplyLink(
    {
      slug: "old-2025",
      official_apply_url: "https://ssc.gov.in/apply/old",
      official_link: "https://ssc.gov.in/apply/old",
      apply_link_verified: true,
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
      official_apply_url: "https://ssc.gov.in/apply/x",
      official_link: "https://ssc.gov.in/apply/x",
      apply_link_verified: true,
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
      official_apply_url: "https://ssc.gov.in/apply/y",
      official_link: "https://ssc.gov.in/apply/y",
      apply_link_verified: true,
      status: "active",
      application_end: new Date(NOW - 3 * DAY).toISOString(),
    },
    NOW,
  );
  assert.equal(r.kind, "closed");
});
