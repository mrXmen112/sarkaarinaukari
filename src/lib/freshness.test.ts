import test from "node:test";
import assert from "node:assert/strict";

import { freshnessOf } from "./freshness.ts";

/**
 * W5.1 — freshness badges (NEW / UPDATED).
 *
 * Run with:  npm test
 *
 * The bug these guard against: `updated_at` was stamped on every row by the link
 * checker and by bulk migrations, so a badge derived from it labelled the entire
 * catalogue "Updated" on the same day. freshnessOf must read only the two
 * content columns, and must say nothing when they say nothing.
 */

const NOW = Date.parse("2026-10-17T12:00:00Z");
const H = 60 * 60 * 1000;

test("nothing is fresh when both content columns are null", () => {
  assert.equal(freshnessOf({}, NOW), null);
  assert.equal(freshnessOf({ published_at: null, content_changed_at: null }, NOW), null);
});

test("a job published inside 48h is NEW", () => {
  assert.equal(
    freshnessOf({ published_at: new Date(NOW - 2 * H).toISOString() }, NOW),
    "new",
  );
});

test("a job published more than 48h ago is not NEW", () => {
  assert.equal(
    freshnessOf({ published_at: new Date(NOW - 49 * H).toISOString() }, NOW),
    null,
  );
});

test("a job with fresh content_changed_at is UPDATED", () => {
  assert.equal(
    freshnessOf(
      {
        published_at: new Date(NOW - 30 * 24 * H).toISOString(),
        content_changed_at: new Date(NOW - 3 * H).toISOString(),
      },
      NOW,
    ),
    "updated",
  );
});

test("UPDATED wins over NEW when both are inside their window", () => {
  assert.equal(
    freshnessOf(
      {
        published_at: new Date(NOW - 1 * H).toISOString(),
        content_changed_at: new Date(NOW - 2 * H).toISOString(),
      },
      NOW,
    ),
    "updated",
  );
});

test("an edit older than 48h falls back to NEW if publish is still fresh", () => {
  assert.equal(
    freshnessOf(
      {
        published_at: new Date(NOW - 1 * H).toISOString(),
        content_changed_at: new Date(NOW - 72 * H).toISOString(),
      },
      NOW,
    ),
    "new",
  );
});

test("48h boundary is inclusive", () => {
  assert.equal(
    freshnessOf({ published_at: new Date(NOW - 48 * H).toISOString() }, NOW),
    "new",
  );
  assert.equal(
    freshnessOf({ published_at: new Date(NOW - 48 * H - 1).toISOString() }, NOW),
    null,
  );
});

test("a future timestamp is treated as just now, not as an error", () => {
  assert.equal(
    freshnessOf({ published_at: new Date(NOW + 5 * H).toISOString() }, NOW),
    "new",
  );
});

test("an unparseable timestamp yields no badge", () => {
  assert.equal(freshnessOf({ published_at: "not-a-date" }, NOW), null);
});
