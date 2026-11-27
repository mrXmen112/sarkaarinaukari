import test from "node:test";
import assert from "node:assert/strict";

import {
  canApply,
  deriveJobStatus,
  STATUS_LABELS,
} from "./jobStatus.ts";

const NOW = "2026-11-27T12:00:00Z"; // 18:00 IST on 27 Nov 2026

test("an unexpired active job is open", () => {
  assert.equal(
    deriveJobStatus({ status: "active", application_end: "2026-12-20" }, NOW),
    "open",
  );
});

test("active rows whose last date has passed are closed", () => {
  assert.equal(
    deriveJobStatus({ status: "active", application_end: "2026-11-26" }, NOW),
    "closed",
  );
});

test("a deadline within seven days is closing soon", () => {
  assert.equal(
    deriveJobStatus({ status: "active", application_end: "2026-12-02" }, NOW),
    "closing_soon",
  );
});

test("a future start date is upcoming even when status says active", () => {
  assert.equal(
    deriveJobStatus(
      { status: "active", application_start: "2026-12-01", application_end: "2026-12-20" },
      NOW,
    ),
    "upcoming",
  );
});

test("cancelled and result declared override date maths", () => {
  assert.equal(
    deriveJobStatus({ status: "cancelled", application_end: "2026-12-20" }, NOW),
    "cancelled",
  );
  assert.equal(
    deriveJobStatus({ status: "result_declared", application_end: "2026-12-20" }, NOW),
    "result_declared",
  );
});

test("only open and closing-soon jobs can be applied to", () => {
  assert.equal(canApply("open"), true);
  assert.equal(canApply("closing_soon"), true);
  assert.equal(canApply("closed"), false);
  assert.equal(canApply("upcoming"), false);
  assert.equal(canApply("cancelled"), false);
  assert.equal(canApply("result_declared"), false);
  assert.equal(STATUS_LABELS.closing_soon, "Closing Soon");
});
