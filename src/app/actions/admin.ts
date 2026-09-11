"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/admin";
import { slugify } from "@/lib/utils";
import type { QuizQuestion } from "@/types/database";

export type AdminResult =
  | { ok: true; error?: never }
  | { ok: false; error: string };

function err(message: string): AdminResult {
  return { ok: false, error: message };
}

function parseQuestions(raw: string): QuizQuestion[] | null {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const valid = parsed.every(
      (q) =>
        q &&
        typeof q.question === "string" &&
        Array.isArray(q.options) &&
        q.options.length >= 2 &&
        typeof q.correct_index === "number" &&
        q.correct_index >= 0 &&
        q.correct_index < q.options.length,
    );
    return valid ? (parsed as QuizQuestion[]) : null;
  } catch {
    return null;
  }
}

export async function createCurrentAffair(input: {
  date: string;
  title: string;
  content: string;
  is_published: boolean;
}): Promise<AdminResult> {
  const { supabase } = await requireAdmin();
  const slug = slugify(input.title);
  const { error } = await supabase.from("current_affairs").insert({
    date: input.date,
    title: input.title,
    slug,
    content: input.content,
    is_published: input.is_published,
  });
  if (error) return err(error.message);
  revalidatePath("/admin/current-affairs");
  revalidatePath("/current-affairs", "layout");
  return { ok: true };
}

export async function updateCurrentAffair(
  id: string,
  input: {
    date: string;
    title: string;
    content: string;
    is_published: boolean;
  },
): Promise<AdminResult> {
  const { supabase } = await requireAdmin();
  const slug = slugify(input.title);
  const { error } = await supabase
    .from("current_affairs")
    .update({
      date: input.date,
      title: input.title,
      slug,
      content: input.content,
      is_published: input.is_published,
    })
    .eq("id", id);
  if (error) return err(error.message);
  revalidatePath("/admin/current-affairs");
  revalidatePath("/current-affairs", "layout");
  return { ok: true };
}

export async function deleteCurrentAffair(
  id: string,
): Promise<AdminResult> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("current_affairs")
    .delete()
    .eq("id", id);
  if (error) return err(error.message);
  revalidatePath("/admin/current-affairs");
  revalidatePath("/current-affairs", "layout");
  return { ok: true };
}

export async function createQuiz(input: {
  title: string;
  subject: string;
  description: string;
  questionsRaw: string;
  is_published: boolean;
}): Promise<AdminResult> {
  const { supabase } = await requireAdmin();
  const questions = parseQuestions(input.questionsRaw);
  if (!questions) {
    return err(
      "Invalid questions JSON. Use an array of { question, options[], correct_index, explanation? }.",
    );
  }
  const { error } = await supabase.from("quizzes").insert({
    title: input.title,
    slug: slugify(input.title),
    subject: input.subject || null,
    description: input.description || null,
    questions,
    is_published: input.is_published,
  });
  if (error) return err(error.message);
  revalidatePath("/admin/quizzes");
  revalidatePath("/quiz", "layout");
  return { ok: true };
}

export async function updateQuiz(
  id: string,
  input: {
    title: string;
    subject: string;
    description: string;
    questionsRaw: string;
    is_published: boolean;
  },
): Promise<AdminResult> {
  const { supabase } = await requireAdmin();
  const questions = parseQuestions(input.questionsRaw);
  if (!questions) {
    return err(
      "Invalid questions JSON. Use an array of { question, options[], correct_index, explanation? }.",
    );
  }
  const { error } = await supabase
    .from("quizzes")
    .update({
      title: input.title,
      slug: slugify(input.title),
      subject: input.subject || null,
      description: input.description || null,
      questions,
      is_published: input.is_published,
    })
    .eq("id", id);
  if (error) return err(error.message);
  revalidatePath("/admin/quizzes");
  revalidatePath("/quiz", "layout");
  return { ok: true };
}

export async function deleteQuiz(id: string): Promise<AdminResult> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("quizzes").delete().eq("id", id);
  if (error) return err(error.message);
  revalidatePath("/admin/quizzes");
  revalidatePath("/quiz", "layout");
  return { ok: true };
}

export async function adminSignOut(): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.auth.signOut();
  redirect("/");
}

/* ------------------------- job_categories ------------------------- */

export async function createJobCategory(input: {
  name: string;
  parent_category: string;
  sort_order: number;
}): Promise<AdminResult> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("job_categories").insert({
    name: input.name,
    slug: slugify(input.name),
    parent_category: input.parent_category || null,
    sort_order: input.sort_order,
  });
  if (error) return err(error.message);
  revalidatePath("/admin/job-categories");
  revalidatePath("/jobs", "layout");
  return { ok: true };
}

export async function updateJobCategory(
  id: string,
  input: {
    name: string;
    parent_category: string;
    sort_order: number;
  },
): Promise<AdminResult> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("job_categories")
    .update({
      name: input.name,
      slug: slugify(input.name),
      parent_category: input.parent_category || null,
      sort_order: input.sort_order,
    })
    .eq("id", id);
  if (error) return err(error.message);
  revalidatePath("/admin/job-categories");
  revalidatePath("/jobs", "layout");
  return { ok: true };
}

export async function deleteJobCategory(id: string): Promise<AdminResult> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("job_categories")
    .delete()
    .eq("id", id);
  if (error) return err(error.message);
  revalidatePath("/admin/job-categories");
  revalidatePath("/jobs", "layout");
  return { ok: true };
}

/* ------------------------------ yojana ---------------------------- */

function toNumber(value: FormDataEntryValue | null): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export async function createYojana(input: {
  title: string;
  level: string;
  state: string;
  description: string;
  benefits_summary: string;
  eligibility: string;
  benefits: string;
  how_to_apply: string;
  official_link: string;
  is_published: boolean;
}): Promise<AdminResult> {
  const { supabase } = await requireAdmin();
  const level = input.level === "state" ? "state" : input.level === "central" ? "central" : null;
  const { error } = await supabase.from("yojana").insert({
    title: input.title,
    slug: slugify(input.title),
    level,
    state: input.state || null,
    description: input.description || null,
    benefits_summary: input.benefits_summary || null,
    eligibility: input.eligibility || null,
    benefits: input.benefits || null,
    how_to_apply: input.how_to_apply || null,
    official_link: input.official_link || null,
    is_published: input.is_published,
  });
  if (error) return err(error.message);
  revalidatePath("/admin/yojana");
  revalidatePath("/yojana", "layout");
  return { ok: true };
}

export async function updateYojana(
  id: string,
  input: {
    title: string;
    level: string;
    state: string;
    description: string;
    benefits_summary: string;
    eligibility: string;
    benefits: string;
    how_to_apply: string;
    official_link: string;
    is_published: boolean;
  },
): Promise<AdminResult> {
  const { supabase } = await requireAdmin();
  const level = input.level === "state" ? "state" : input.level === "central" ? "central" : null;
  const { error } = await supabase
    .from("yojana")
    .update({
      title: input.title,
      slug: slugify(input.title),
      level,
      state: input.state || null,
      description: input.description || null,
      benefits_summary: input.benefits_summary || null,
      eligibility: input.eligibility || null,
      benefits: input.benefits || null,
      how_to_apply: input.how_to_apply || null,
      official_link: input.official_link || null,
      is_published: input.is_published,
    })
    .eq("id", id);
  if (error) return err(error.message);
  revalidatePath("/admin/yojana");
  revalidatePath("/yojana", "layout");
  return { ok: true };
}

export async function deleteYojana(id: string): Promise<AdminResult> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("yojana").delete().eq("id", id);
  if (error) return err(error.message);
  revalidatePath("/admin/yojana");
  revalidatePath("/yojana", "layout");
  return { ok: true };
}

/* ------------------------------ exams ----------------------------- */

function parseJsonArray(raw: string): unknown[] | null {
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function createExam(input: {
  name: string;
  short_name: string;
  conducting_body: string;
  overview: string;
  eligibility: string;
  exam_pattern_raw: string;
  preparation_strategy: string;
  recommended_books_raw: string;
  previous_year_papers_raw: string;
  cutoff_trends_raw: string;
  faqs_raw: string;
  is_published: boolean;
}): Promise<AdminResult> {
  const { supabase } = await requireAdmin();

  const exam_pattern = parseJsonArray(input.exam_pattern_raw);
  const recommended_books = parseJsonArray(input.recommended_books_raw);
  const previous_year_papers = parseJsonArray(input.previous_year_papers_raw);
  const cutoff_trends = parseJsonArray(input.cutoff_trends_raw);
  const faqs = parseJsonArray(input.faqs_raw);
  if (
    exam_pattern === null ||
    recommended_books === null ||
    previous_year_papers === null ||
    cutoff_trends === null ||
    faqs === null
  ) {
    return err("One or more JSON fields has invalid syntax. Make sure each is a valid JSON array.");
  }

  const { error } = await supabase.from("exams").insert({
    name: input.name,
    slug: slugify(input.name),
    short_name: input.short_name || null,
    conducting_body: input.conducting_body || null,
    overview: input.overview || null,
    eligibility: input.eligibility || null,
    exam_pattern: exam_pattern as never,
    preparation_strategy: input.preparation_strategy || null,
    recommended_books: recommended_books as never,
    previous_year_papers: previous_year_papers as never,
    cutoff_trends: cutoff_trends as never,
    faqs: faqs as never,
    is_published: input.is_published,
  });
  if (error) return err(error.message);
  revalidatePath("/admin/exams");
  revalidatePath("/exams", "layout");
  return { ok: true };
}

export async function updateExam(
  id: string,
  input: {
    name: string;
    short_name: string;
    conducting_body: string;
    overview: string;
    eligibility: string;
    exam_pattern_raw: string;
    preparation_strategy: string;
    recommended_books_raw: string;
    previous_year_papers_raw: string;
    cutoff_trends_raw: string;
    faqs_raw: string;
    is_published: boolean;
  },
): Promise<AdminResult> {
  const { supabase } = await requireAdmin();

  const exam_pattern = parseJsonArray(input.exam_pattern_raw);
  const recommended_books = parseJsonArray(input.recommended_books_raw);
  const previous_year_papers = parseJsonArray(input.previous_year_papers_raw);
  const cutoff_trends = parseJsonArray(input.cutoff_trends_raw);
  const faqs = parseJsonArray(input.faqs_raw);
  if (
    exam_pattern === null ||
    recommended_books === null ||
    previous_year_papers === null ||
    cutoff_trends === null ||
    faqs === null
  ) {
    return err("One or more JSON fields has invalid syntax. Make sure each is a valid JSON array.");
  }

  const { error } = await supabase
    .from("exams")
    .update({
      name: input.name,
      slug: slugify(input.name),
      short_name: input.short_name || null,
      conducting_body: input.conducting_body || null,
      overview: input.overview || null,
      eligibility: input.eligibility || null,
      exam_pattern: exam_pattern as never,
      preparation_strategy: input.preparation_strategy || null,
      recommended_books: recommended_books as never,
      previous_year_papers: previous_year_papers as never,
      cutoff_trends: cutoff_trends as never,
      faqs: faqs as never,
      is_published: input.is_published,
    })
    .eq("id", id);
  if (error) return err(error.message);
  revalidatePath("/admin/exams");
  revalidatePath("/exams", "layout");
  return { ok: true };
}

export async function deleteExam(id: string): Promise<AdminResult> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("exams").delete().eq("id", id);
  if (error) return err(error.message);
  revalidatePath("/admin/exams");
  revalidatePath("/exams", "layout");
  return { ok: true };
}

/* ------------------------------ jobs ------------------------------ */

function linesToArray(raw: string): string[] {
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseJsonObject(
  raw: string,
): Record<string, number> | null {
  if (!raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Record<string, number>;
  } catch {
    return null;
  }
}

function numberOrNull(raw: string): number | null {
  if (raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function dateOrNull(raw: string): string | null {
  return raw.trim() === "" ? null : raw;
}

export type JobInput = {
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

function buildJobPayload(input: JobInput): AdminResult & {
  payload?: Record<string, unknown>;
} {
  const age_relaxation = parseJsonObject(input.age_relaxation);
  const vacancy_breakdown = parseJsonObject(input.vacancy_breakdown);
  const application_fee = parseJsonObject(input.application_fee);
  if (
    age_relaxation === null ||
    vacancy_breakdown === null ||
    application_fee === null
  ) {
    return err(
      "age_relaxation, vacancy_breakdown and application_fee must each be valid JSON objects (e.g. { \"general\": 100 }).",
    );
  }
  if (!input.title.trim()) return err("Title is required.");
  if (!input.official_link.trim()) return err("Official link is required.");
  if (!input.application_end.trim()) return err("Application end date is required.");

  const payload: Record<string, unknown> = {
    title: input.title.trim(),
    slug: slugify(input.title),
    category_id: input.category_id || null,
    state: input.state || null,
    department: input.department || null,
    department_slug: input.department_slug || null,
    short_description: input.short_description || null,
    eligibility_education: input.eligibility_education || null,
    eligibility_age_min: numberOrNull(input.eligibility_age_min),
    eligibility_age_max: numberOrNull(input.eligibility_age_max),
    age_relaxation: age_relaxation as never,
    vacancy_total: numberOrNull(input.vacancy_total),
    vacancy_breakdown: vacancy_breakdown as never,
    application_fee: application_fee as never,
    selection_process: linesToArray(input.selection_process) as never,
    pay_scale: input.pay_scale || null,
    how_to_apply: linesToArray(input.how_to_apply) as never,
    notification_pdf_link: input.notification_pdf_link || null,
    notification_date: dateOrNull(input.notification_date),
    application_start: dateOrNull(input.application_start),
    application_end: input.application_end,
    exam_date: dateOrNull(input.exam_date),
    official_link: input.official_link.trim(),
    syllabus_id: input.syllabus_id || null,
    status: input.status === "closed" || input.status === "upcoming"
      ? input.status
      : "active",
    source_url: input.source_url || null,
    is_published: input.is_published,
  };
  return { ok: true, payload };
}

export async function createJob(input: JobInput): Promise<AdminResult> {
  const { supabase } = await requireAdmin();
  const built = buildJobPayload(input);
  if (!built.ok) return built;
  const { error } = await supabase.from("jobs").insert(built.payload as never);
  if (error) return err(error.message);
  revalidatePath("/admin/jobs");
  revalidatePath("/jobs", "layout");
  return { ok: true };
}

export async function updateJob(
  id: string,
  input: JobInput,
): Promise<AdminResult> {
  const { supabase } = await requireAdmin();
  const built = buildJobPayload(input);
  if (!built.ok) return built;
  const { error } = await supabase
    .from("jobs")
    .update(built.payload as never)
    .eq("id", id);
  if (error) return err(error.message);
  revalidatePath("/admin/jobs");
  revalidatePath("/jobs", "layout");
  return { ok: true };
}

export async function deleteJob(id: string): Promise<AdminResult> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("jobs").delete().eq("id", id);
  if (error) return err(error.message);
  revalidatePath("/admin/jobs");
  revalidatePath("/jobs", "layout");
  return { ok: true };
}

/* ------------------- admit_cards / results / answer_keys ---------- */

type JobLinkedInput = {
  job_id: string;
  title: string;
  description: string;
  is_published: boolean;
};

function jobLinkedRaw(input: JobLinkedInput) {
  return {
    job_id: input.job_id || null,
    title: input.title.trim(),
    slug: slugify(input.title),
    description: input.description || null,
  };
}

export async function createAdmitCard(input: JobLinkedInput & {
  release_date: string;
  exam_date: string;
  download_link: string;
  official_link: string;
}): Promise<AdminResult> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("admit_cards").insert({
    ...jobLinkedRaw(input),
    release_date: dateOrNull(input.release_date),
    exam_date: dateOrNull(input.exam_date),
    download_link: input.download_link || null,
    official_link: input.official_link || null,
    is_published: input.is_published,
  });
  if (error) return err(error.message);
  revalidatePath("/admin/admit-cards");
  revalidatePath("/admit-card", "layout");
  return { ok: true };
}

export async function updateAdmitCard(
  id: string,
  input: JobLinkedInput & {
    release_date: string;
    exam_date: string;
    download_link: string;
    official_link: string;
  },
): Promise<AdminResult> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("admit_cards")
    .update({
      ...jobLinkedRaw(input),
      release_date: dateOrNull(input.release_date),
      exam_date: dateOrNull(input.exam_date),
      download_link: input.download_link || null,
      official_link: input.official_link || null,
      is_published: input.is_published,
    })
    .eq("id", id);
  if (error) return err(error.message);
  revalidatePath("/admin/admit-cards");
  revalidatePath("/admit-card", "layout");
  return { ok: true };
}

export async function deleteAdmitCard(id: string): Promise<AdminResult> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("admit_cards").delete().eq("id", id);
  if (error) return err(error.message);
  revalidatePath("/admin/admit-cards");
  revalidatePath("/admit-card", "layout");
  return { ok: true };
}

export async function createResult(input: JobLinkedInput & {
  result_date: string;
  cutoff_data: string;
  merit_list_link: string;
  official_link: string;
}): Promise<AdminResult> {
  const { supabase } = await requireAdmin();
  const cutoff = parseJsonObject(input.cutoff_data);
  if (cutoff === null) {
    return err("cutoff_data must be a JSON object, e.g. { \"general\": 75 }.");
  }
  const { error } = await supabase.from("results").insert({
    ...jobLinkedRaw(input),
    result_date: dateOrNull(input.result_date),
    cutoff_data: cutoff as never,
    merit_list_link: input.merit_list_link || null,
    official_link: input.official_link || null,
    is_published: input.is_published,
  });
  if (error) return err(error.message);
  revalidatePath("/admin/results");
  revalidatePath("/result", "layout");
  return { ok: true };
}

export async function updateResult(
  id: string,
  input: JobLinkedInput & {
    result_date: string;
    cutoff_data: string;
    merit_list_link: string;
    official_link: string;
  },
): Promise<AdminResult> {
  const { supabase } = await requireAdmin();
  const cutoff = parseJsonObject(input.cutoff_data);
  if (cutoff === null) {
    return err("cutoff_data must be a JSON object, e.g. { \"general\": 75 }.");
  }
  const { error } = await supabase
    .from("results")
    .update({
      ...jobLinkedRaw(input),
      result_date: dateOrNull(input.result_date),
      cutoff_data: cutoff as never,
      merit_list_link: input.merit_list_link || null,
      official_link: input.official_link || null,
      is_published: input.is_published,
    })
    .eq("id", id);
  if (error) return err(error.message);
  revalidatePath("/admin/results");
  revalidatePath("/result", "layout");
  return { ok: true };
}

export async function deleteResult(id: string): Promise<AdminResult> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("results").delete().eq("id", id);
  if (error) return err(error.message);
  revalidatePath("/admin/results");
  revalidatePath("/result", "layout");
  return { ok: true };
}

export async function createAnswerKey(input: JobLinkedInput & {
  type: string;
  release_date: string;
  objection_last_date: string;
  download_link: string;
  official_link: string;
}): Promise<AdminResult> {
  const { supabase } = await requireAdmin();
  const type = input.type === "final" ? "final" : "provisional";
  const { error } = await supabase.from("answer_keys").insert({
    ...jobLinkedRaw(input),
    type,
    release_date: dateOrNull(input.release_date),
    objection_last_date: dateOrNull(input.objection_last_date),
    download_link: input.download_link || null,
    official_link: input.official_link || null,
    is_published: input.is_published,
  });
  if (error) return err(error.message);
  revalidatePath("/admin/answer-keys");
  revalidatePath("/answer-key", "layout");
  return { ok: true };
}

export async function updateAnswerKey(
  id: string,
  input: JobLinkedInput & {
    type: string;
    release_date: string;
    objection_last_date: string;
    download_link: string;
    official_link: string;
  },
): Promise<AdminResult> {
  const { supabase } = await requireAdmin();
  const type = input.type === "final" ? "final" : "provisional";
  const { error } = await supabase
    .from("answer_keys")
    .update({
      ...jobLinkedRaw(input),
      type,
      release_date: dateOrNull(input.release_date),
      objection_last_date: dateOrNull(input.objection_last_date),
      download_link: input.download_link || null,
      official_link: input.official_link || null,
      is_published: input.is_published,
    })
    .eq("id", id);
  if (error) return err(error.message);
  revalidatePath("/admin/answer-keys");
  revalidatePath("/answer-key", "layout");
  return { ok: true };
}

export async function deleteAnswerKey(id: string): Promise<AdminResult> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("answer_keys").delete().eq("id", id);
  if (error) return err(error.message);
  revalidatePath("/admin/answer-keys");
  revalidatePath("/answer-key", "layout");
  return { ok: true };
}