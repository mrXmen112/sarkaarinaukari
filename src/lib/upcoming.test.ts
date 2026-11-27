import test from "node:test";
import assert from "node:assert/strict";

import {
  COMING_SOON_STATUSES,
  EXPECTED_STATUSES,
  UPCOMING_EXAM_STATUSES,
} from "./upcomingStatus.ts";

test("the four discovery sections never share a status", () => {
  const all = [...COMING_SOON_STATUSES, ...EXPECTED_STATUSES, ...UPCOMING_EXAM_STATUSES];
  assert.equal(new Set(all).size, all.length);
});

test("coming soon is only for confirmed notification schedules", () => {
  assert.deepEqual(COMING_SOON_STATUSES, ["notification_scheduled", "application_opening_soon"]);
  assert.deepEqual(EXPECTED_STATUSES, ["notification_expected"]);
  assert.deepEqual(UPCOMING_EXAM_STATUSES, ["examination_scheduled"]);
});
