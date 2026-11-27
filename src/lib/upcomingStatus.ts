/**
 * Status groups for the four distinct discovery sections. Kept dependency-free
 * so the separation can be unit tested.
 */
export const COMING_SOON_STATUSES = [
  "notification_scheduled",
  "application_opening_soon",
];
export const EXPECTED_STATUSES = ["notification_expected"];
export const UPCOMING_EXAM_STATUSES = ["examination_scheduled"];
