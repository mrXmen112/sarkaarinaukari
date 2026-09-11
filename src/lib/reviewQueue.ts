export type StructuredMap = Record<string, unknown>;
export type FlatFields = Record<string, string>;

export const SUPPORTED_TARGETS = ["job", "result", "admit_card"] as const;
export type SupportedTarget = (typeof SUPPORTED_TARGETS)[number];

export function isSupportedTarget(t: string): t is SupportedTarget {
  return (SUPPORTED_TARGETS as readonly string[]).includes(t);
}

export function flattenValue(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return "";
  }
}

export function flattenStructured(data: StructuredMap): FlatFields {
  return Object.fromEntries(
    Object.entries(data ?? {}).map(([key, value]) => [key, flattenValue(value)]),
  ) as FlatFields;
}

export function linesFromField(raw: string): string {
  const t = (raw ?? "").trim();
  if (!t) return "";
  try {
    const parsed: unknown = JSON.parse(t);
    if (Array.isArray(parsed)) {
      return parsed
        .map((x) => String(x ?? "").trim())
        .filter(Boolean)
        .join("\n");
    }
  } catch {
    return raw;
  }
  return raw;
}

export type ReviewJobInput = {
  title: string;
  category_id: string;
  state: string;
  department: string;
  department_slug: string;
  short_description: string;
  eligibility_education: string;
  eligibility_age_min: string;
  eligibility_age_max: string;
  age_relaxation: string;
  vacancy_total: string;
  vacancy_breakdown: string;
  application_fee: string;
  selection_process: string;
  pay_scale: string;
  how_to_apply: string;
  notification_pdf_link: string;
  notification_date: string;
  application_start: string;
  application_end: string;
  exam_date: string;
  official_link: string;
  syllabus_id: string;
  status: string;
  source_url: string;
  is_published: boolean;
};

export type ReviewJobExtra = {
  category_id: string;
  state: string;
  status: string;
  is_published: boolean;
  source_url: string | null;
};

const str = (f: FlatFields, k: string): string => (f[k] ?? "").trim();

export function buildJobInput(f: FlatFields, extra: ReviewJobExtra): ReviewJobInput {
  return {
    title: str(f, "title"),
    category_id: extra.category_id,
    state: extra.state,
    department: str(f, "department"),
    department_slug: str(f, "department_slug"),
    short_description: str(f, "short_description"),
    eligibility_education: str(f, "eligibility_education"),
    eligibility_age_min: str(f, "eligibility_age_min"),
    eligibility_age_max: str(f, "eligibility_age_max"),
    age_relaxation: str(f, "age_relaxation") || "{}",
    vacancy_total: str(f, "vacancy_total"),
    vacancy_breakdown: str(f, "vacancy_breakdown") || "{}",
    application_fee: str(f, "application_fee") || "{}",
    selection_process: linesFromField(str(f, "selection_process")),
    pay_scale: str(f, "pay_scale"),
    how_to_apply: linesFromField(str(f, "how_to_apply")),
    notification_pdf_link: str(f, "notification_pdf_link"),
    notification_date: str(f, "notification_date"),
    application_start: str(f, "application_start"),
    application_end: str(f, "application_end"),
    exam_date: str(f, "exam_date"),
    official_link: str(f, "official_link"),
    syllabus_id: "",
    status: extra.status,
    source_url: extra.source_url ?? "",
    is_published: extra.is_published,
  };
}

export type ReviewLinkedInput = {
  job_id: string;
  title: string;
  description: string;
  is_published: boolean;
};

function buildLinkedBase(
  f: FlatFields,
  extra: { job_id: string; is_published: boolean },
): ReviewLinkedInput {
  return {
    job_id: extra.job_id,
    title: str(f, "title"),
    description: str(f, "description") || str(f, "short_description"),
    is_published: extra.is_published,
  };
}

export type ReviewResultInput = ReviewLinkedInput & {
  result_date: string;
  cutoff_data: string;
  merit_list_link: string;
  official_link: string;
};

export function buildResultInput(
  f: FlatFields,
  extra: { job_id: string; is_published: boolean },
): ReviewResultInput {
  return {
    ...buildLinkedBase(f, extra),
    result_date: str(f, "result_date"),
    cutoff_data: str(f, "cutoff_data") || "{}",
    merit_list_link: str(f, "merit_list_link"),
    official_link: str(f, "official_link"),
  };
}

export type ReviewAdmitCardInput = ReviewLinkedInput & {
  release_date: string;
  exam_date: string;
  download_link: string;
  official_link: string;
};

export function buildAdmitCardInput(
  f: FlatFields,
  extra: { job_id: string; is_published: boolean },
): ReviewAdmitCardInput {
  return {
    ...buildLinkedBase(f, extra),
    release_date: str(f, "release_date"),
    exam_date: str(f, "exam_date"),
    download_link: str(f, "download_link"),
    official_link: str(f, "official_link"),
  };
}

export type FlagChip = { key: string; tone: "red" | "amber" };

export function flagChips(flags: StructuredMap): FlagChip[] {
  return Object.keys(flags ?? {}).map((key) => ({
    key,
    tone: key.startsWith("missing_") ? ("red" as const) : ("amber" as const),
  }));
}

export function prettyLabel(key: string): string {
  return key.replace(/_/g, " ");
}
