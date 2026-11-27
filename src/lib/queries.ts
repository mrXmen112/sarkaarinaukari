import { createStaticClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { isoDatePlusDays } from "@/lib/date";
import { pageWindow } from "@/lib/pagination";
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
  VerificationStatus,
  Yojana,
  YojanaAvailability,
  YojanaLevel,
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

/**
 * Phase 8A �?" public visibility gate.
 *
 * Only jobs a human has verified against an official notification may appear
 * anywhere public: listings, landing pages, the homepage, related-job blocks,
 * detail pages or the sitemap. This is not an environment toggle any more. A
 * missing env var silently exposed all 97 unverified rows in production, so the
 * rule is now unconditional.
 */
export const VERIFICATION_GATE_ENABLED = true;

/** Narrow a jobs builder to verified rows only. */
function verifiedOnly<T extends { eq: (column: string, value: string) => T }>(
  q: T,
): T {
  return q.eq("verification_status", "verified");
}

/** True when a job is safe to show in public listings and the sitemap. */
export function isPubliclyVisible(job: {
  verification_status?: VerificationStatus | null;
}): boolean {
  return job.verification_status === "verified";
}

/**
 * The PostgREST builder is heavily generic over its select string; a single
 * structural type keeps the "count" and "rows" builders identical without
 * leaking an `any` into the public query layer.
 */
type ListingQuery = {
  eq(column: string, value: string | number | boolean | null): ListingQuery;
  in(column: string, values: string[]): ListingQuery;
  or(filters: string): ListingQuery;
  is(column: string, value: boolean | null): ListingQuery;
  not(column: string, operator: string, value: string | null): ListingQuery;
  gte(column: string, value: string): ListingQuery;
  lt(column: string, value: string): ListingQuery;
  order(column: string, options: { ascending: boolean; nullsFirst?: boolean }): ListingQuery;
  range(from: number, to: number): ListingQuery;
  then: PromiseLike<{
    data: unknown[] | null;
    count: number | null;
    error: { message: string } | null;
  }>["then"];
};

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
  /** Central bodies have state = null; state bodies have a state slug. */
  centralOnly?: boolean;
  stateJobsOnly?: boolean;
  /** Stable recruiting-body key, e.g. "bihar-police" (Bihar Hub chips). */
  department?: string;
  /** "active" | "upcoming" | "closed" | "recently_closed" | "open" | "all" */
  status?: string; // "active" | "upcoming" | "closed" | "recently_closed" | "open" | "all"
  qualification?: string;
  /** Free-text search across post title and department. */
  q?: string;
  /** Landing pages set this so only human-verified jobs render. */
  verifiedOnly?: boolean;
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
  centralOnly,
  stateJobsOnly,
  department,
  status = "active",
  qualification,
  q,
  verifiedOnly: verifiedOnlyFilter,
  sort = "newest",
  page = 1,
  pageSize = 25,
}: JobListFilters = {}): Promise<JobListResult> {
  const empty: JobListResult = { jobs: [], total: 0, page: 1, totalPages: 1 };
  if (!isSupabaseConfigured) return empty;

  const cats = await listCategories();
  if (categorySlug && !cats.some((c) => c.slug === categorySlug)) return empty;

  const effectiveVerifiedOnly = verifiedOnlyFilter ?? VERIFICATION_GATE_ENABLED;
  const today = isoDatePlusDays(0);

  // The count and the rows MUST come from the same filters. Building the query
  // twice from one function is deliberate — a hand-copied count query is how
  // the header and the table drifted apart in the first place.
  const build = (head: boolean) => {
    let query = createStaticClient()
      .from("jobs")
      .select(head ? "id" : JOB_SELECT, { count: "exact", head })
      .eq("is_published", true)
      .eq("type", "job") as unknown as ListingQuery;
    if (effectiveVerifiedOnly) {
      query = query.eq("verification_status", "verified");
    }

    if (status && status !== "all") {
      if (status === "recently_closed") {
        query = query
          .eq("status", "closed")
          .lt("application_end", today)
          .gte("application_end", isoDatePlusDays(-30));
      } else if (status === "open" || status === "active") {
        // A vacancy is actionable only while its application window is open.
        query = query
          .in("status", ["active", "upcoming"])
          .gte("application_end", today);
      } else {
        query = query.eq("status", status as JobStatus);
      }
    }

    if (categorySlug) {
      const cat = cats.find((c) => c.slug === categorySlug);
      if (!cat) return null;
      query = query.eq("category_id", cat.id);
    }
    if (state) query = query.eq("state", state);
    if (centralOnly) query = query.is("state", null);
    if (stateJobsOnly) query = query.not("state", "is", null);
    if (department) query = query.eq("department_slug", department);
    if (qualification) {
      const kw = qualificationKeywords(qualification);
      if (kw.length) {
        query = query.or(
          kw.map((k) => `eligibility_education.ilike.%${k}%`).join(","),
        );
      }
    }
    if (q && q.trim()) {
      // Escape PostgREST or() string syntax; match title and department.
      const term = q.trim().replace(/[%,()]/g, " ").slice(0, 80);
      query = query.or(`title.ilike.%${term}%,department.ilike.%${term}%`);
    }

    if (sort === "closing") {
      query = query
        .gte("application_end", today)
        .order("application_end", { ascending: true })
        .order("slug", { ascending: true });
    } else {
      query = query
        .order("created_at", { ascending: false })
        .order("slug", { ascending: true });
    }
    return query;
  };

  const counted = await build(true);
  if (!counted) return empty;
  const { count, error: countError } = await counted;
  if (countError) {
    console.error("[queries] listJobs count failed:", countError.message);
    return empty;
  }
  const total = count ?? 0;
  const window = pageWindow(page, total, pageSize);
  if (total === 0) return { ...empty, total: 0 };

  const rowsQuery = build(false);
  if (!rowsQuery) return empty;
  const { data, error } = await rowsQuery.range(window.start, window.end);
  if (error) {
    console.error("[queries] listJobs rows failed:", error.message);
    return { jobs: [], total, page: window.page, totalPages: window.totalPages };
  }
  return {
    jobs: (data ?? []) as JobWithCategory[],
    total,
    page: window.page,
    totalPages: window.totalPages,
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
     .eq("type", "job")
     .eq("verification_status", "verified")
     .maybeSingle();
  return (data as JobDetail | null) ?? null;
}

export async function getRelatedJobs(
  job: Pick<Job, "slug" | "category_id" | "state">,
  limit = 6,
): Promise<JobWithCategory[]> {
  if (!isSupabaseConfigured) return [];

  let query = verifiedOnly(
    createStaticClient()
      .from("jobs")
      .select(JOB_SELECT)
      .eq("is_published", true)
       .eq("type", "job")
       .in("status", ["active", "upcoming"])
       .gte("application_end", isoDatePlusDays(0))
       .neq("slug", job.slug),
  );

  if (job.category_id) {
    query = query.eq("category_id", job.category_id);
  }
  const { data } = await query.order("created_at", { ascending: false }).limit(limit);

  let related = (data ?? []) as JobWithCategory[];

  // Top up from same-state jobs if the category pool is thin.
  if (related.length < limit && job.state) {
    const seen = new Set(related.map((r) => r.slug).concat(job.slug));
    const { data: stateJobs } = await verifiedOnly(
      createStaticClient()
        .from("jobs")
        .select(JOB_SELECT)
        .eq("is_published", true)
         .eq("type", "job")
         .in("status", ["active", "upcoming"])
         .gte("application_end", isoDatePlusDays(0))
         .eq("state", job.state)
        .not("slug", "in", `(${[...seen].join(",")})`),
    )
      .order("created_at", { ascending: false })
      .limit(limit - related.length);
    related = related.concat((stateJobs ?? []) as JobWithCategory[]);
  }

  return related.slice(0, limit);
}

/** Newest active (non-expired) jobs — homepage table. */
export async function getLatestJobs(limit = 8): Promise<JobWithCategory[]> {
  return guard(async () => {
    const { data } = await verifiedOnly(
      createStaticClient()
        .from("jobs")
        .select(JOB_SELECT)
        .eq("is_published", true)
        .eq("type", "job")
        .eq("status", "active")
        .gte("application_end", isoDatePlusDays(0)),
    )
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as JobWithCategory[];
  });
}

/** Closing-soonest active (non-expired) jobs — used by the NoticeBar countdown strip. */
export async function getClosingJobs(limit = 8): Promise<JobWithCategory[]> {
  return guard(async () => {
    const { data } = await verifiedOnly(
      createStaticClient()
        .from("jobs")
        .select(JOB_SELECT)
        .eq("is_published", true)
         .eq("type", "job")
         .in("status", ["active", "upcoming"])
         .gte("application_end", isoDatePlusDays(0)),
    )
      .order("application_end", { ascending: true })
      .limit(limit);
    return (data ?? []) as JobWithCategory[];
  });
}

/** Recently expired jobs — shown in a separate "Recently Closed" section (last 30 days). */
export async function getRecentlyClosedJobs(limit = 8): Promise<JobWithCategory[]> {
  return guard(async () => {
    const { data } = await verifiedOnly(
      createStaticClient()
        .from("jobs")
        .select(JOB_SELECT)
        .eq("is_published", true)
        .eq("type", "job")
        .eq("status", "closed")
        .lt("application_end", isoDatePlusDays(0))
        .gte("application_end", isoDatePlusDays(-30)),
    )
      .order("application_end", { ascending: false })
      .limit(limit);
    return (data ?? []) as JobWithCategory[];
  });
}

/**
 * Archive listing: every closed vacancy older than 30 days. The 30–90 day gap
 * used to leave closed jobs in no public list at all.
 */
export async function listArchivedJobs(limit = 100): Promise<JobWithCategory[]> {
  return guard(async () => {
    const { data } = await verifiedOnly(
      createStaticClient()
        .from("jobs")
        .select(JOB_SELECT)
        .eq("is_published", true)
        .eq("type", "job")
        .eq("status", "closed")
        .lt("application_end", isoDatePlusDays(-30)),
    )
      .order("application_end", { ascending: false })
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

/**
 * How many jobs a landing page slice currently shows, as VERIFIED AND OPEN.
 *
 * Drives the "no landing page with fewer than 3 verified open jobs stays
 * indexable" rule.
 *
 * This delegates to listJobs() rather than writing its own query, on purpose:
 * that is the only way the count can be guaranteed to match what the page
 * actually renders. A hand-rolled count with subtly different filter semantics
 * would be the exact class of bug this whole refactor exists to remove (the
 * sitemap advertising things the page disagrees with).
 *
 * `status: "open"` maps to active + upcoming, and verifiedOnly() applies the
 * Phase 8A gate, so with the gate off this returns the same figure the page
 * shows today.
 */
export async function countVerifiedOpenJobs(
  filters: JobListFilters = {},
): Promise<number> {
  if (!isSupabaseConfigured) return 0;
  try {
    const { total } = await listJobs({
      ...filters,
      verifiedOnly: true,
      status: "open",
      page: 1,
    });
    return total ?? 0;
  } catch (err) {
    // Fail closed: a broken query must never make an empty hub look indexable.
    console.error("[queries] countVerifiedOpenJobs threw:", err);
    return 0;
  }
}

/** Sitemap slugs — unverified jobs must NOT be listed. */
export async function getAllJobSlugs(verifiedOnlyArg = true): Promise<string[]> {
  return guard(async () => {
    let query = createStaticClient()
      .from("jobs")
      .select("slug")
      .eq("is_published", true)
      .eq("type", "job");
    if (verifiedOnlyArg) {
      query = query.eq("verification_status", "verified");
    }
    const { data } = await query.order("created_at", { ascending: false });
    return ((data ?? []) as Pick<Job, "slug">[]).map((d) => d.slug);
  });
}

export type YojanaFilters = {
  level?: string;
  state?: string;
  category?: string;
  availability?: string;
  q?: string;
  page?: number;
  pageSize?: number;
};

export type YojanaListResult = {
  schemes: Yojana[];
  total: number;
  page: number;
  totalPages: number;
};

/** Filterable, paginated Sarkari Yojana directory. */
export async function listYojana(
  filters: YojanaFilters = {},
): Promise<YojanaListResult> {
  const empty: YojanaListResult = { schemes: [], total: 0, page: 1, totalPages: 1 };
  if (!isSupabaseConfigured) return empty;

  const build = (head: boolean) => {
    let q = createStaticClient()
      .from("yojana")
      .select(head ? "id" : "*", { count: "exact", head })
      .eq("is_published", true) as unknown as ListingQuery;
    if (filters.level) q = q.eq("level", filters.level as YojanaLevel);
    if (filters.state) q = q.eq("state", filters.state);
    if (filters.category) q = q.eq("category", filters.category);
    if (filters.availability) {
      q = q.eq("availability_status", filters.availability as YojanaAvailability);
    }
    if (filters.q?.trim()) {
      const term = filters.q.trim().replace(/[%,()]/g, " ").slice(0, 80);
      q = q.or(
        `title.ilike.%${term}%,benefits_summary.ilike.%${term}%,eligibility.ilike.%${term}%`,
      );
    }
    return q.order("last_verified_at", { ascending: false, nullsFirst: false })
      .order("title", { ascending: true });
  };

  const { count, error: countError } = await build(true);
  if (countError) {
    console.error("[queries] listYojana count failed:", countError.message);
    return empty;
  }
  const total = count ?? 0;
  const window = pageWindow(filters.page ?? 1, total, filters.pageSize ?? 25);
  if (total === 0) return empty;
  const { data, error } = await build(false).range(window.start, window.end);
  if (error) {
    console.error("[queries] listYojana rows failed:", error.message);
    return { ...empty, total, page: window.page, totalPages: window.totalPages };
  }
  return {
    schemes: (data ?? []) as Yojana[],
    total,
    page: window.page,
    totalPages: window.totalPages,
  };
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
    const { data } = await verifiedOnly(
      createStaticClient()
        .from("jobs")
        .select(JOB_SELECT)
        .eq("syllabus_id", syllabusId)
         .eq("is_published", true)
         .in("status", ["active", "upcoming"])
         .gte("application_end", isoDatePlusDays(0)),
     )
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

const UPDATE_JOB_SELECT =
  "*, jobs(id, title, slug, verification_status, is_published)";

/**
 * A result / admit card / answer key may point at a job that is no longer
 * public (unverified or unpublished). Never render a link to a page the gate
 * will 404: drop the embed instead.
 */
function publicJobEmbed<T extends { jobs: unknown }>(row: T): T {
  const job = row.jobs as
    | (Pick<Job, "id" | "title" | "slug"> & {
        verification_status?: string;
        is_published?: boolean;
      })
    | null;
  if (
    !job ||
    job.verification_status !== "verified" ||
    job.is_published !== true
  ) {
    return { ...row, jobs: null };
  }
  return {
    ...row,
    jobs: { id: job.id, title: job.title, slug: job.slug },
  };
}

export async function listAdmitCards(limit = 200): Promise<AdmitCardWithJob[]> {
  return guard(async () => {
    const { data } = await createStaticClient()
      .from("admit_cards")
      .select(UPDATE_JOB_SELECT)
      .eq("is_published", true)
      .eq("status", "released")
      .lte("release_date", isoDatePlusDays(0))
      .order("release_date", { ascending: false, nullsFirst: false })
      .limit(limit);
    return ((data ?? []) as AdmitCardWithJob[]).map(publicJobEmbed);
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
    .eq("status", "released")
    .lte("release_date", isoDatePlusDays(0))
    .maybeSingle();
  return data ? publicJobEmbed(data as AdmitCardWithJob) : null;
}

export async function getAllAdmitCardSlugs(): Promise<string[]> {
  return guard(async () => {
    const { data } = await createStaticClient()
      .from("admit_cards")
      .select("slug")
      .eq("is_published", true)
      .eq("status", "released")
      .lte("release_date", isoDatePlusDays(0))
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
      .eq("status", "released")
      .lte("result_date", isoDatePlusDays(0))
      .order("result_date", { ascending: false, nullsFirst: false })
      .limit(limit);
    return ((data ?? []) as ResultWithJob[]).map(publicJobEmbed);
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
    .eq("status", "released")
    .lte("result_date", isoDatePlusDays(0))
    .maybeSingle();
  return data ? publicJobEmbed(data as ResultWithJob) : null;
}

export async function getAllResultSlugs(): Promise<string[]> {
  return guard(async () => {
    const { data } = await createStaticClient()
      .from("results")
      .select("slug")
      .eq("is_published", true)
      .eq("status", "released")
      .lte("result_date", isoDatePlusDays(0))
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
      .eq("status", "released")
      .lte("release_date", isoDatePlusDays(0))
      .order("release_date", { ascending: false, nullsFirst: false })
      .limit(limit);
    return ((data ?? []) as AnswerKeyWithJob[]).map(publicJobEmbed);
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
    .eq("status", "released")
    .lte("release_date", isoDatePlusDays(0))
    .maybeSingle();
  return data ? publicJobEmbed(data as AnswerKeyWithJob) : null;
}

export async function getAllAnswerKeySlugs(): Promise<string[]> {
  return guard(async () => {
    const { data } = await createStaticClient()
      .from("answer_keys")
      .select("slug")
      .eq("is_published", true)
      .eq("status", "released")
      .lte("release_date", isoDatePlusDays(0))
      .order("release_date", { ascending: false, nullsFirst: false });
    return ((data ?? []) as Pick<AnswerKey, "slug">[]).map((d) => d.slug);
  });
}

/* ------------------------------------------------------------------ */
/* Recruitment timeline (Phase 1)                                       */
/* ------------------------------------------------------------------ */

/** Published admit cards / results / answer keys linked to one job. */
export type JobTimeline = {
  admitCards: Pick<AdmitCard, "title" | "slug" | "release_date" | "exam_date">[];
  results: Pick<ResultRow, "title" | "slug" | "result_date">[];
  answerKeys: Pick<AnswerKey, "title" | "slug" | "release_date">[];
};

export async function getJobTimeline(jobId: string): Promise<JobTimeline> {
  const empty: JobTimeline = { admitCards: [], results: [], answerKeys: [] };
  if (!isSupabaseConfigured) return empty;
  try {
    const [admits, results, keys] = await Promise.all([
      createStaticClient()
        .from("admit_cards")
        .select("title, slug, release_date, exam_date")
        .eq("job_id", jobId)
        .eq("is_published", true)
        .eq("status", "released")
        .lte("release_date", isoDatePlusDays(0))
        .order("release_date", { ascending: false }),
      createStaticClient()
        .from("results")
        .select("title, slug, result_date")
        .eq("job_id", jobId)
        .eq("is_published", true)
        .eq("status", "released")
        .lte("result_date", isoDatePlusDays(0))
        .order("result_date", { ascending: false, nullsFirst: false }),
      createStaticClient()
        .from("answer_keys")
        .select("title, slug, release_date")
        .eq("job_id", jobId)
        .eq("is_published", true)
        .eq("status", "released")
        .lte("release_date", isoDatePlusDays(0))
        .order("release_date", { ascending: false, nullsFirst: false }),
    ]);
    return {
      admitCards: (admits.data ?? []) as JobTimeline["admitCards"],
      results: (results.data ?? []) as JobTimeline["results"],
      answerKeys: (keys.data ?? []) as JobTimeline["answerKeys"],
    };
  } catch (err) {
    console.error("[queries] job timeline failed:", err);
    return empty;
  }
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
