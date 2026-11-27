import test from "node:test";
import assert from "node:assert/strict";

import { extractDraft } from "./deterministic.mjs";

const NOTICE = `
IBPS CRP XX Recruitment 2026
Advt No. CRP-XX/2026. Vacancies 1200.
Educational qualification: Bachelor's degree in any discipline.
Last date for submission of online application 20/12/2026.
`;

test("only values present in the notice are extracted", () => {
  const draft = extractDraft(
    { title: "IBPS CRP XX Recruitment 2026", url: "https://www.ibps.in/notice.pdf", kind: "advertisement" },
    NOTICE,
  );
  assert.equal(draft.title, "IBPS CRP XX Recruitment 2026");
  assert.equal(draft.official_link, "https://www.ibps.in/notice.pdf");
  assert.equal(draft.vacancy_total, 1200);
  assert.equal(draft.application_end, "2026-12-20");
  assert.match(draft.eligibility_education ?? "", /Bachelor/);
});

test("missing fields stay null instead of being guessed", () => {
  const draft = extractDraft({ title: "Notice", url: "https://www.ibps.in/x" }, "A short notice with no numbers.");
  assert.equal(draft.notice_number, null);
  assert.equal(draft.vacancy_total, null);
  assert.equal(draft.application_end, null);
});
