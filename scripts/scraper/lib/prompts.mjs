/**
 * LLM extraction prompts (Section 5 of the pipeline doc).
 *
 * One template per target_type, each emitting ONLY raw JSON matching the
 * corresponding live table's column shape. The model must use null for
 * anything not explicitly stated — never guess. Confidence flags are
 * derived afterwards by the orchestrator (one flag per null field).
 */

const BASE_RULES = `Rules:
- Do not fabricate any date, number, or fact not present in the source text.
- If a value is ambiguous or you are not fully confident, still extract your best reading as the value (a human reviews everything), but the orchestrator will flag nulls separately.
- Use null (not "", not 0) for anything not clearly stated.
- Dates must be "YYYY-MM-DD" or null. Convert relative dates using the notice date when the year is obvious; otherwise null.
- Output raw JSON only: no markdown fences, no explanation before or after.`;

const GARBLE_NOTE = `
Note: some PDFs use legacy non-Unicode Hindi fonts, so their extracted text may look like Latin gibberish (e.g. "fcgkj ljdkj"). Such text is UNREADABLE — treat it as missing and use null for every field you cannot verify, except title/department/date/KIND hints given in the META block below, which come from the official listing page and ARE trustworthy.`;

const FIELD_DOCS = {
  job: `{
  "title": string,
  "department": string,
  "short_description": string,
  "eligibility_education": string | null,
  "eligibility_age_min": number | null,
  "eligibility_age_max": number | null,
  "age_relaxation": object | null,
  "vacancy_total": number | null,
  "vacancy_breakdown": object | null,
  "application_fee": object | null,
  "selection_process": array of strings | null,
  "pay_scale": string | null,
  "how_to_apply": array of strings | null,
  "notification_date": "YYYY-MM-DD" | null,
  "application_start": "YYYY-MM-DD" | null,
  "application_end": "YYYY-MM-DD" | null,
  "exam_date": "YYYY-MM-DD" | null,
  "official_link": string | null
}`,
  result: `{
  "title": string,
  "description": string | null,
  "result_date": "YYYY-MM-DD" | null,
  "cutoff_data": object | null,
  "merit_list_link": string | null,
  "official_link": string | null
}`,
  admit_card: `{
  "title": string,
  "description": string | null,
  "release_date": "YYYY-MM-DD" | null,
  "exam_date": "YYYY-MM-DD" | null,
  "download_link": string | null,
  "official_link": string | null
}`,
};

const TASK_LINE = {
  job: "You are extracting structured data from an official Indian government job notification.",
  result:
    "You are extracting structured data from an official Indian government exam result notice.",
  admit_card:
    "You are extracting structured data from an official Indian government admit-card notice.",
};

export function buildPrompt(targetType, meta, sourceText, { garbled = false } = {}) {
  if (!FIELD_DOCS[targetType]) {
    throw new Error(`[prompts] no template for target_type "${targetType}"`);
  }
  const metaBlock = `META (from the official listing page — trustworthy):
- listing title: ${meta.title ?? "unknown"}
- detail URL: ${meta.url ?? "unknown"}
- notice date: ${meta.date ?? "unknown"}
- kind: ${meta.kind ?? "unknown"}`;
  return (
    `${TASK_LINE[targetType]}\n` +
    `Read the text below and output ONLY a JSON object with these exact fields:\n\n` +
    `${FIELD_DOCS[targetType]}\n\n` +
    `${BASE_RULES}\n` +
    (garbled ? GARBLE_NOTE + "\n" : "") +
    `\n${metaBlock}\n\nSOURCE TEXT:\n${sourceText}`
  );
}

/** Fields whose absence raises a confidence flag (missing_<field>: true). */
const FLAGGABLE = {
  job: [
    "eligibility_education", "eligibility_age_min", "eligibility_age_max",
    "vacancy_total", "application_fee", "pay_scale",
    "notification_date", "application_start", "application_end", "exam_date",
  ],
  result: ["result_date", "cutoff_data", "merit_list_link"],
  admit_card: ["release_date", "exam_date", "download_link"],
};

export function flaggableFields(targetType) {
  return FLAGGABLE[targetType] ?? [];
}

/** Fields that must be non-empty or the entry is rejected for manual handling. */
export function requiredFields() {
  return ["title", "official_link"];
}
