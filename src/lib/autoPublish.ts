/**
 * Automated publication checks.
 *
 * A notice is published automatically only when all three hold:
 *   1. it came from a registered official source,
 *   2. every mandatory field is present and internally consistent, and
 *   3. the extracted values can be pointed at in the source's own text.
 *
 * Anything else is reported as an automated processing error. There is no
 * "publish anyway" path and no mandatory human approval step for notices that
 * do pass: the verified stamp is written by the pipeline with an explicit
 * `auto:<source>` attribution.
 */
/** Strict YYYY-MM-DD check used before a date is trusted for publication. */
function isIndexableDate(value: string | null | undefined): boolean {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export type AutoPublishDraft = {
  title?: string | null;
  slug?: string | null;
  official_link?: string | null;
  official_apply_url?: string | null;
  notice_number?: string | null;
  department?: string | null;
  department_slug?: string | null;
  state?: string | null;
  type?: string | null;
  vacancy_total?: number | string | null;
  eligibility_education?: string | null;
  application_start?: string | null;
  application_end?: string | null;
  selection_process?: string[] | string | null;
  how_to_apply?: string[] | string | null;
  pay_scale?: string | null;
  [key: string]: unknown;
};

export type RegisteredSource = {
  name: string;
  base_url: string | null;
  allowed_domains?: string[] | null;
  auto_publish?: boolean | null;
};

export type Assessment = {
  ok: boolean;
  errors: { code: string; message: string }[];
};

const FREE_HOSTS = [
  "blogspot.com", "wordpress.com", "github.io", "gmail.com", "youtube.com",
  "facebook.com", "t.me", "medium.com", "quora.com",
];

export function hostnameOf(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  try {
    const parsed = new URL(url.trim());
    if (!/^https?:$/i.test(parsed.protocol)) return null;
    return parsed.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function hostMatches(host: string, domain: string): boolean {
  const d = domain.toLowerCase().trim().replace(/^www\./, "");
  return host === d || host.endsWith(`.${d}`);
}

/**
 * Official-source verification. A source must be registered with auto_publish
 * enabled and the extracted URL must live on that source's own domain (or an
 * explicitly registered alternate domain). Government/academic suffixes are a
 * fallback only for legacy rows without a registered domain.
 */
export function isTrustedOfficialUrl(
  url: string | null | undefined,
  source: RegisteredSource | null | undefined,
): boolean {
  const host = hostnameOf(url);
  if (!host || !source || source.auto_publish !== true) return false;
  if (FREE_HOSTS.some((h) => hostMatches(host, h))) return false;

  const domains = [
    ...(source.allowed_domains ?? []),
    ...(source.base_url ? [source.base_url] : []),
  ];
  if (domains.some((d) => hostMatches(host, d))) return true;

  // No registered domain pattern to match: accept only an unmistakably
  // official Indian public-body suffix.
  return /(^|\.)(gov\.in|nic\.in|ac\.in|gov\.np|gov\.bd|gov\.pk|gov|org\.in)$/.test(host);
}

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

export function normaliseText(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Does the raw notice actually contain this ISO date in any common format? */
export function dateAppearsInText(iso: string | null | undefined, raw: string): boolean {
  if (!iso || !isIndexableDate(iso)) return false;
  const [y, m, d] = iso.slice(0, 10).split("-");
  const text = normaliseText(raw);
  const patterns = [
    `${y}-${m}-${d}`,
    `${d}-${m}-${y}`,
    `${d}/${m}/${y}`,
    `${d}.${m}.${y}`,
    `${d} ${MONTHS[Number(m) - 1]} ${y}`,
    `${MONTHS[Number(m) - 1]} ${d},? ${y}`,
  ];
  return patterns.some((p) => text.includes(p));
}

/** Mandatory fields for publication — no guessed values are ever accepted. */
export function validateRequiredFields(draft: AutoPublishDraft): Assessment {
  const errors: Assessment["errors"] = [];
  const requireText = (field: string, min = 1) => {
    const value = normaliseText(draft[field]);
    if (value.length < min) {
      errors.push({ code: `missing_${field}`, message: `${field} is missing` });
    }
  };

  requireText("title", 8);
  requireText("department", 2);
  requireText("eligibility_education", 3);
  requireText("application_end", 8);
  if (!hostnameOf(draft.official_link ?? null)) {
    errors.push({ code: "invalid_official_link", message: "official_link is not a valid HTTP(S) URL" });
  }
  if (draft.type && draft.type !== "job") {
    errors.push({ code: "not_a_job", message: `type=${draft.type} is not a recruitment vacancy` });
  }
  const total = Number(draft.vacancy_total);
  if (!Number.isFinite(total) || total <= 0) {
    errors.push({ code: "missing_vacancy_total", message: "vacancy_total must be a positive number stated in the notice" });
  }
  const end = String(draft.application_end ?? "").slice(0, 10);
  const start = draft.application_start ? String(draft.application_start).slice(0, 10) : null;
  if (start && isIndexableDate(start) && isIndexableDate(end) && start > end) {
    errors.push({ code: "invalid_application_window", message: "application_start is after application_end" });
  }
  if (!isIndexableDate(end)) {
    errors.push({ code: "invalid_application_end", message: "application_end must be a valid date" });
  }
  return { ok: errors.length === 0, errors };
}

/**
 * Cross-check extracted values against the official notice text. This is what
 * distinguishes "source verified" from "an LLM wrote plausible JSON".
 */
export function crossCheckSourceText(
  draft: AutoPublishDraft,
  rawText: string,
): Assessment {
  const errors: Assessment["errors"] = [];
  const text = normaliseText(rawText);
  if (text.length < 80) {
    return { ok: false, errors: [{ code: "source_text_too_short", message: "official source text is too short to verify" }] };
  }

  const title = normaliseText(draft.title);
  // Long notifications often wrap words; compare a distinctive run of words.
  const titleTokens = title.split(" ").filter((t) => t.length > 3).slice(0, 8);
  const matched = titleTokens.filter((t) => text.includes(t)).length;
  if (titleTokens.length > 0 && matched < Math.min(3, titleTokens.length)) {
    errors.push({ code: "title_not_in_source", message: "title cannot be found in the official notice" });
  }

  if (!dateAppearsInText(draft.application_end as string, rawText)) {
    errors.push({ code: "deadline_not_in_source", message: "application_end cannot be found in the official notice" });
  }

  const notice = normaliseText(draft.notice_number);
  if (notice && !text.includes(notice)) {
    errors.push({ code: "notice_number_not_in_source", message: "advertisement number cannot be found in the official notice" });
  }

  const total = Number(draft.vacancy_total);
  if (Number.isFinite(total) && total > 0 && !text.includes(String(total))) {
    errors.push({ code: "vacancy_not_in_source", message: "vacancy_total cannot be found in the official notice" });
  }

  return { ok: errors.length === 0, errors };
}

/** Stable identity for duplicate detection (advertisement number first). */
export function duplicateKey(draft: AutoPublishDraft): string | null {
  const notice = normaliseText(draft.notice_number);
  if (notice) return `notice:${notice}`;
  const url = hostnameOf(draft.official_link ?? null)
    ? String(draft.official_link).split("?")[0].toLowerCase()
    : null;
  if (url) return `url:${url}`;
  const title = normaliseText(draft.title);
  const dept = normaliseText(draft.department);
  const end = String(draft.application_end ?? "").slice(0, 10);
  return title && dept && end ? `job:${dept}:${title}:${end}` : null;
}

export function assessAutoPublish(
  draft: AutoPublishDraft,
  source: RegisteredSource | null | undefined,
  rawText: string,
): Assessment {
  const errors: Assessment["errors"] = [];
  if (!isTrustedOfficialUrl(draft.official_link, source)) {
    errors.push({
      code: "untrusted_source",
      message: "official_link is not on the registered official source domain",
    });
  }
  errors.push(...validateRequiredFields(draft).errors);
  errors.push(...crossCheckSourceText(draft, rawText).errors);
  return { ok: errors.length === 0, errors };
}
