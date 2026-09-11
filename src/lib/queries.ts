import { createStaticClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { isoDatePlusDays } from "@/lib/date";
import { unslugify } from "@/lib/utils";
import type {
  AdmitCard,
  AnswerKey,
  CurrentAffair,
  Exam,
  Job,
  JobCategory,
  JobStatus,
  JobWithCategory,
  Quiz,
  ResultRow,
  Syllabus,
  Yojana,
} from "@/types/database";

/**
 * Shared, server-side data access for public content.
 *
 * Everything here uses the cookie-free anon client so pages stay statically
 * generated and revalidated on an ISR schedule (Section 5). Call sites set
 * their own `export const revalidate`.
 *
 * All functions fail soft: if Supabase isn't configured yet they return empty
 * results instead of throwing, so the site still builds before env vars exist.
 */

const JOB_SELECT =
  "*, job_categories(id, name, slug, parent_category), syllabus(id, slug, exam_name)";

type Result<T> = T[];

async function guard<T>(fn: () => Promise<Result<T>>): Promise<Result<T>> {
  if (!isSupabaseConfigured) return [];
  try {
    return await fn();
  } catch (err) {
    console.error("[queries] Supabase request failed:", err);
    return [];
  }
}

export type JobListFilters = {
  categorySlug?: string;
  state?: string;
  /** Stable recruiting-body key, e.g. "bihar-police" (Bihar Hub chips). */
  department?: string;
  status?: string; // "active" | "upcoming" | "closed" | "all"
  qualification?: string;
  sort?: "newest" | "closing";
  page?: number;
  pageSize?: number;
};

export type JobListResult = {
  jobs: JobWithCategory[];
  total: number;
  page: number;
  totalPages: number;
};

export async function listJobs({
  categorySlug,
  state,
  department,
  status = "active",
  qualification,
  sort = "newest",
  page = 1,
  pageSize = 25,
}: JobListFilters = {}): Promise<JobListResult> {
  const empty: JobListResult = { jobs: [], total: 0, page, totalPages: 0 };
  if (!isSupabaseConfigured) return empty;

  const cats = await listCategories();

  let query = createStaticClient()
    .from("jobs")
    .select(JOB_SELECT, { count: "exact" })
    .eq("is_published", true);

  if (status && status !== "all") {
    query = query.eq("status", status as JobStatus);
  }
  if (categorySlug) {
    const cat = cats.find((c) => c.slug === categorySlug);
    if (!cat) return empty;
    query = query.eq("category_id", cat.id);
  }
  if (state) {
    query = query.eq("state", state);
  }
  if (department) {
    query = query.eq("department_slug", department);
  }
  if (qualification) {
    const kw = qualificationKeywords(qualification);
    if (kw.length) {
      query = query.or(
        kw.map((k) => `eligibility_education.ilike.%${k}%`).join(","),
      );
    }
  }

  if (sort === "closing") {
    query = query
      .gte("application_end", isoDatePlusDays(0))
      .order("application_end", { ascending: true })
      .order("slug", { ascending: true });
  } else {
    query = query
      .order("created_at", { ascending: false })
      .order("slug", { ascending: true });
  }

  query = query.range((page - 1) * pageSize, page * pageSize - 1);

  const { data, count } = await query;
  const jobs = (data ?? []) as JobWithCategory[];
  const total = count ?? jobs.length;
  return {
    jobs,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getJobBySlug(
  slug: string,
): Promise<JobDetail | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await createStaticClient()
    .from("jobs")
    .select(JOB_SELECT)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  return (data as JobDetail | null) ?? null;
}

export async function getRelatedJobs(
  job: Pick<Job, "slug" | "category_id" | "state">,
  limit = 6,
): Promise<JobWithCategory[]> {
  if (!isSupabaseConfigured) return [];

  let query = createStaticClient()
    .from("jobs")
    .select(JOB_SELECT)
    .eq("is_published", true)
    .eq("status", "active")
    .neq("slug", job.slug);

  if (job.category_id) {
    query = query.eq("category_id", job.category_id);
  }
  const { data } = await query.order("created_at", { ascending: false }).limit(limit);

  let related = (data ?? []) as JobWithCategory[];

  // Top up from same-state jobs if the category pool is thin.
  if (related.length < limit && job.state) {
    const seen = new Set(related.map((r) => r.slug).concat(job.slug));
    const { data: stateJobs } = await createStaticClient()
      .from("jobs")
      .select(JOB_SELECT)
      .eq("is_published", true)
      .eq("status", "active")
      .eq("state", job.state)
      .not("slug", "in", `(${[...seen].join(",")})`)
      .order("created_at", { ascending: false })
      .limit(limit - related.length);
    related = related.concat((stateJobs ?? []) as JobWithCategory[]);
  }

  return related.slice(0, limit);
}

/** Newest active jobs — homepage table. */
export async function getLatestJobs(limit = 8): Promise<JobWithCategory[]> {
  return guard(async () => {
    const { data } = await createStaticClient()
      .from("jobs")
      .select(JOB_SELECT)
      .eq("is_published", true)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as JobWithCategory[];
  });
}

/** Closing-soonest active jobs — used by the NoticeBar countdown strip. */
export async function getClosingJobs(limit = 8): Promise<JobWithCategory[]> {
  return guard(async () => {
    const { data } = await createStaticClient()
      .from("jobs")
      .select(JOB_SELECT)
      .eq("is_published", true)
      .eq("status", "active")
      .gte("application_end", isoDatePlusDays(-1))
      .order("application_end", { ascending: true })
      .limit(limit);
    return (data ?? []) as JobWithCategory[];
  });
}

export async function listCategories(): Promise<JobCategory[]> {
  return guard(async () => {
    const { data } = await createStaticClient()
      .from("job_categories")
      .select("*")
      .order("sort_order", { ascending: true });
    return (data ?? []) as JobCategory[];
  });
}

export async function getAllJobSlugs(): Promise<string[]> {
  return guard(async () => {
    const { data } = await createStaticClient()
      .from("jobs")
      .select("slug")
      .eq("is_published", true)
      .order("created_at", { ascending: false });
    return ((data ?? []) as Pick<Job, "slug">[]).map((d) => d.slug);
  });
}

export async function listYojana(limit = 100): Promise<Yojana[]> {
  return guard(async () => {
    const { data } = await createStaticClient()
      .from("yojana")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as Yojana[];
  });
}

export async function getYojanaBySlug(slug: string): Promise<Yojana | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await createStaticClient()
    .from("yojana")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  return (data as Yojana | null) ?? null;
}

export async function listCurrentAffairs(
  limit = 100
): Promise<CurrentAffair[]> {
  return guard(async () => {
    const { data } = await createStaticClient()
      .from("current_affairs")
      .select("*")
      .eq("is_published", true)
      .order("date", { ascending: false })
      .limit(limit);
    return (data ?? []) as CurrentAffair[];
  });
}

export async function getCurrentAffairBySlug(
  slug: string
): Promise<CurrentAffair | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await createStaticClient()
    .from("current_affairs")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  return (data as CurrentAffair | null) ?? null;
}

export async function getAllCurrentAffairsSlugs(): Promise<string[]> {
  return guard(async () => {
    const { data } = await createStaticClient()
      .from("current_affairs")
      .select("slug")
      .eq("is_published", true);
    return (
      (data ?? []) as Pick<CurrentAffair, "slug">[]
    ).flatMap((d) => (d.slug ? [d.slug] : []));
  });
}

export async function listQuizzes(limit = 50): Promise<Quiz[]> {
  return guard(async () => {
    const { data } = await createStaticClient()
      .from("quizzes")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as Quiz[];
  });
}

export async function getQuizBySlug(slug: string): Promise<Quiz | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await createStaticClient()
    .from("quizzes")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  return (data as Quiz | null) ?? null;
}

export async function getAllQuizSlugs(): Promise<string[]> {
  return guard(async () => {
    const { data } = await createStaticClient()
      .from("quizzes")
      .select("slug")
      .eq("is_published", true);
    return ((data ?? []) as Pick<Quiz, "slug">[]).map((d) => d.slug);
  });
}

/* ------------------------------------------------------------------ */
/* Exams & Syllabus                                                    */
/* ------------------------------------------------------------------ */

/** Exam row + its syllabus (PostgREST embed via exams.syllabus_id). */
export type ExamWithSyllabus = Exam & {
  syllabus: Pick<Syllabus, "id" | "slug" | "exam_name" | "stage"> | null;
};

const EXAM_SELECT = "*, syllabus(id, slug, exam_name, stage)";

export async function listExams(limit = 100): Promise<ExamWithSyllabus[]> {
  return guard(async () => {
    const { data } = await createStaticClient()
      .from("exams")
      .select(EXAM_SELECT)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as ExamWithSyllabus[];
  });
}

export async function getAllExamSlugs(): Promise<string[]> {
  return guard(async () => {
    const { data } = await createStaticClient()
      .from("exams")
      .select("slug")
      .eq("is_published", true)
      .order("name", { ascending: true });
    return ((data ?? []) as Pick<Exam, "slug">[]).map((d) => d.slug);
  });
}

export async function getExamBySlug(
  slug: string,
): Promise<ExamWithSyllabus | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await createStaticClient()
    .from("exams")
    .select(EXAM_SELECT)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  return (data as ExamWithSyllabus | null) ?? null;
}

/** The parent exam of a syllabus (syllabus.id -> exams.syllabus_id). */
export async function getExamBySyllabus(
  syllabusId: string,
): Promise<ExamWithSyllabus | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await createStaticClient()
    .from("exams")
    .select(EXAM_SELECT)
    .eq("syllabus_id", syllabusId)
    .eq("is_published", true)
    .maybeSingle();
  return (data as ExamWithSyllabus | null) ?? null;
}

export async function getSyllabusBySlug(slug: string): Promise<Syllabus | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await createStaticClient()
    .from("syllabus")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return (data as Syllabus | null) ?? null;
}

export async function getAllSyllabusSlugs(): Promise<string[]> {
  return guard(async () => {
    const { data } = await createStaticClient()
      .from("syllabus")
      .select("slug")
      .order("exam_name", { ascending: true });
    return ((data ?? []) as Pick<Syllabus, "slug">[]).map((d) => d.slug);
  });
}

/** Active vacancies linked to a syllabus (jobs.syllabus_id) — exam pages. */
export async function listJobsBySyllabus(
  syllabusId: string,
  limit = 6,
): Promise<JobWithCategory[]> {
  return guard(async () => {
    const { data } = await createStaticClient()
      .from("jobs")
      .select(JOB_SELECT)
      .eq("syllabus_id", syllabusId)
      .eq("is_published", true)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as JobWithCategory[];
  });
}

/* ------------------------------------------------------------------ */
/* Admit cards                                                         */
/* ------------------------------------------------------------------ */

/** Admit card row + its parent job (PostgREST embed) for cross-links. */
export type AdmitCardWithJob = AdmitCard & {
  jobs: Pick<Job, "id" | "title" | "slug"> | null;
};

const UPDATE_JOB_SELECT = "*, jobs(id, title, slug)";

export async function listAdmitCards(limit = 200): Promise<AdmitCardWithJob[]> {
  return guard(async () => {
    const { data } = await createStaticClient()
      .from("admit_cards")
      .select(UPDATE_JOB_SELECT)
      .eq("is_published", true)
      .order("release_date", { ascending: false, nullsFirst: false })
      .limit(limit);
    return (data ?? []) as AdmitCardWithJob[];
  });
}

export async function getAdmitCardBySlug(
  slug: string,
): Promise<AdmitCardWithJob | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await createStaticClient()
    .from("admit_cards")
    .select(UPDATE_JOB_SELECT)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  return (data as AdmitCardWithJob | null) ?? null;
}

export async function getAllAdmitCardSlugs(): Promise<string[]> {
  return guard(async () => {
    const { data } = await createStaticClient()
      .from("admit_cards")
      .select("slug")
      .eq("is_published", true)
      .order("release_date", { ascending: false, nullsFirst: false });
    return (      (data ?? []) as Pick<AdmitCard, "slug">[]).map((d) => d.slug);
  });
}

/* ------------------------------------------------------------------ */
/* Yojana                                                              */
/* ------------------------------------------------------------------ */

/** Slugs of all published & featured schemes for static generation +
 * Crossrefs between unrelated business pages (yojana -> admit card,
 * yojana -> result, etc.) — a slug-only peek kept intentionally small. */
export async function getAllYojanaSlugs(): Promise<string[]> {
  return guard(async () => {
    const { data } = await createStaticClient()
      .from("yojana")
      .select("slug")
      .eq("is_published", true)
      .order("created_at", { ascending: false });
    return ((data ?? []) as Pick<Yojana, "slug">[]).map((d) => d.slug);
  });
}
/* Results                                                             */
/* ------------------------------------------------------------------ */

/** Result row + its parent job (nullable for historical results). */
export type ResultWithJob = ResultRow & {
  jobs: Pick<Job, "id" | "title" | "slug"> | null;
};

export async function listResults(limit = 200): Promise<ResultWithJob[]> {
  return guard(async () => {
    const { data } = await createStaticClient()
      .from("results")
      .select(UPDATE_JOB_SELECT)
      .eq("is_published", true)
      .order("result_date", { ascending: false, nullsFirst: false })
      .limit(limit);
    return (data ?? []) as ResultWithJob[];
  });
}

export async function getResultBySlug(
  slug: string,
): Promise<ResultWithJob | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await createStaticClient()
    .from("results")
    .select(UPDATE_JOB_SELECT)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  return (data as ResultWithJob | null) ?? null;
}

export async function getAllResultSlugs(): Promise<string[]> {
  return guard(async () => {
    const { data } = await createStaticClient()
      .from("results")
      .select("slug")
      .eq("is_published", true)
      .order("result_date", { ascending: false, nullsFirst: false });
    return ((data ?? []) as Pick<ResultRow, "slug">[]).map((d) => d.slug);
  });
}

/* ------------------------------------------------------------------ */
/* Answer keys                                                         */
/* ------------------------------------------------------------------ */

/** Answer key row + its parent job. */
export type AnswerKeyWithJob = AnswerKey & {
  jobs: Pick<Job, "id" | "title" | "slug"> | null;
};

export async function listAnswerKeys(limit = 200): Promise<AnswerKeyWithJob[]> {
  return guard(async () => {
    const { data } = await createStaticClient()
      .from("answer_keys")
      .select(UPDATE_JOB_SELECT)
      .eq("is_published", true)
      .order("release_date", { ascending: false, nullsFirst: false })
      .limit(limit);
    return (data ?? []) as AnswerKeyWithJob[];
  });
}

export async function getAnswerKeyBySlug(
  slug: string,
): Promise<AnswerKeyWithJob | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await createStaticClient()
    .from("answer_keys")
    .select(UPDATE_JOB_SELECT)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  return (data as AnswerKeyWithJob | null) ?? null;
}

export async function getAllAnswerKeySlugs(): Promise<string[]> {
  return guard(async () => {
    const { data } = await createStaticClient()
      .from("answer_keys")
      .select("slug")
      .eq("is_published", true)
      .order("release_date", { ascending: false, nullsFirst: false });
    return ((data ?? []) as Pick<AnswerKey, "slug">[]).map((d) => d.slug);
  });
}

/* ------------------------------------------------------------------ */
/* Combined update feeds                                               */
/* ------------------------------------------------------------------ */

/** Normalised latest-updates item (admit card / result / answer key). */
export type RecentUpdate = {
  kind: "admit-card" | "result" | "answer-key";
  title: string;
  slug: string;
  date: string | null;
  jobSlug: string | null;
  jobTitle: string | null;
};

const RECENT_UPDATE_KIND: Record<string, RecentUpdate["kind"]> = {
  admit_cards: "admit-card",
  results: "result",
  answer_keys: "answer-key",
};

/**
 * Latest published updates across the three exam-update tables, newest first.
 * Used by the Bihar Hub "recent updates" strip and (later) the homepage.
 */
export async function listRecentUpdates(limit = 6): Promise<RecentUpdate[]> {
  return guard(async () => {
    const [admits, results, keys] = await Promise.all([
      listAdmitCards(100),
      listResults(100),
      listAnswerKeys(100),
    ]);

    const items: RecentUpdate[] = [
      ...admits.map((a) => ({
        kind: RECENT_UPDATE_KIND.admit_cards,
        title: a.title,
        slug: a.slug,
        date: a.release_date,
        jobSlug: a.jobs?.slug ?? null,
        jobTitle: a.jobs?.title ?? null,
      })),
      ...results.map((r) => ({
        kind: RECENT_UPDATE_KIND.results,
        title: r.title,
        slug: r.slug,
        date: r.result_date,
        jobSlug: r.jobs?.slug ?? null,
        jobTitle: r.jobs?.title ?? null,
      })),
      ...keys.map((k) => ({
        kind: RECENT_UPDATE_KIND.answer_keys,
        title: k.title,
        slug: k.slug,
        date: k.release_date,
        jobSlug: k.jobs?.slug ?? null,
        jobTitle: k.jobs?.title ?? null,
      })),
    ];

    return items
      .filter((i) => i.date)
      .sort((a, b) => (b.date! < a.date! ? -1 : 1))
      .slice(0, limit);
  });
}

export function qualificationKeywords(value: string): string[] {
  switch (value) {
    case "10th":
      return ["10th", "10+2", "ten plus two"];
    case "12th":
      return ["12th", "higher secondary", "intermediate"];
    case "diploma":
      return ["ITI", "diploma"];
    case "graduate":
      return ["graduate", "graduation", "b.e", "b.tech"];
    case "post-graduate":
      return ["post graduate", "postgraduate", "masters", "m.a", "m.sc"];
    case "bed":
      return ["b.ed", "d.el.ed", "teacher"];
    case "engineering":
      return ["b.e", "b.tech", "engineering"];
    case "medical":
      return ["mbbs", "gnm", "b.sc nursing", "bsc nursing", "nursing"];
    case "law":
      return ["llb", "law"];
    default:
      return [];
  }
}

/** "bihar" -> "Bihar" for display. */
export function stateLabel(value: string | null | undefined): string {
  return unslugify(value ?? "");
}

/** A job detail row = job + embedded category + syllabus (PostgREST embed). */
export type JobDetail = JobWithCategory & {
  syllabus: Pick<Syllabus, "id" | "slug" | "exam_name"> | null;
};