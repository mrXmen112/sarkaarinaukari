/**
 * Database types for the SarkaariNaukri Supabase schema.
 *
 * Hand-maintained to match `supabase/migrations/0001_initial_schema.sql`.
 * Once the Supabase project exists you can regenerate with:
 *   npx supabase gen types typescript --project-id <ref> --schema public > src/types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type JobStatus = "active" | "closed" | "upcoming";
export type SocialCategory = "general" | "obc" | "sc" | "st" | "ews";
export type AnswerKeyType = "provisional" | "final";
export type YojanaLevel = "central" | "state";
export type AppliedStatus =
  | "applied"
  | "admit_card_downloaded"
  | "exam_given"
  | "result_awaited";

/* ------------------------------------------------------------------ */
/* Shaped JSONB payloads                                               */
/* ------------------------------------------------------------------ */

/** jobs.age_relaxation — { "sc_st": 5, "obc": 3, "ews": 0 } */
export type AgeRelaxation = Record<string, number>;

/** jobs.vacancy_breakdown — { "general": 120, "obc": 80, ... } */
export type VacancyBreakdown = Record<string, number>;

/** jobs.application_fee — { "general": 100, "sc_st": 0 } */
export type ApplicationFee = Record<string, number>;

/** exams.exam_pattern — one entry per stage */
export type ExamPatternStage = {
  stage: string;
  subjects?: { name: string; questions?: number; marks?: number }[];
  total_questions?: number;
  total_marks?: number;
  duration?: string;
  negative_marking?: string;
  mode?: string;
  notes?: string;
};

/** syllabus.subjects — subject-wise topic breakdown */
export type SyllabusSubject = {
  subject: string;
  stage?: string;
  topics: string[];
};

export type RecommendedBook = {
  title: string;
  author?: string;
  publisher?: string;
  affiliate_link?: string;
};

export type PreviousYearPaper = { year: number; link: string; label?: string };

export type CutoffTrend = {
  year: number;
  stage?: string;
  cutoffs: Record<string, number | string>;
};

export type ResultCutoff = Record<string, number | string>;

export type Faq = { question: string; answer: string };

export type QuizQuestion = {
  question: string;
  options: string[];
  correct_index: number;
  explanation?: string;
};

/* ------------------------------------------------------------------ */
/* Row types                                                           */
/* ------------------------------------------------------------------ */

export type JobCategory = {
  id: string;
  name: string;
  slug: string;
  parent_category: string | null;
  sort_order: number;
  created_at: string;
};

export type Job = {
  id: string;
  title: string;
  slug: string;
  category_id: string | null;
  state: string | null;
  department: string | null;
  /** Stable filter key for a recruiting body (bpcs, bihar-police, ssc …). */
  department_slug: string | null;
  short_description: string | null;
  eligibility_education: string | null;
  eligibility_age_min: number | null;
  eligibility_age_max: number | null;
  age_relaxation: AgeRelaxation | null;
  vacancy_total: number | null;
  vacancy_breakdown: VacancyBreakdown | null;
  application_fee: ApplicationFee | null;
  selection_process: string[] | null;
  pay_scale: string | null;
  how_to_apply: string[] | null;
  notification_pdf_link: string | null;
  notification_date: string | null;
  application_start: string | null;
  application_end: string;
  exam_date: string | null;
  official_link: string;
  syllabus_id: string | null;
  status: JobStatus;
  source_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

/** A job row joined with its category — the shape listings actually use. */
export type JobWithCategory = Job & {
  job_categories: Pick<JobCategory, "id" | "name" | "slug" | "parent_category"> | null;
};

export type AdmitCard = {
  id: string;
  job_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  release_date: string | null;
  exam_date: string | null;
  download_link: string | null;
  official_link: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type ResultRow = {
  id: string;
  job_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  result_date: string | null;
  cutoff_data: ResultCutoff | null;
  merit_list_link: string | null;
  official_link: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type AnswerKey = {
  id: string;
  job_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  type: AnswerKeyType | null;
  release_date: string | null;
  objection_last_date: string | null;
  download_link: string | null;
  official_link: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type Yojana = {
  id: string;
  title: string;
  slug: string;
  level: YojanaLevel | null;
  state: string | null;
  description: string | null;
  benefits_summary: string | null;
  eligibility: string | null;
  benefits: string | null;
  how_to_apply: string | null;
  official_link: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type Syllabus = {
  id: string;
  exam_name: string;
  slug: string;
  subjects: SyllabusSubject[] | null;
  stage: string | null;
  created_at: string;
  updated_at: string;
};

export type Exam = {
  id: string;
  name: string;
  slug: string;
  short_name: string | null;
  conducting_body: string | null;
  overview: string | null;
  eligibility: string | null;
  exam_pattern: ExamPatternStage[] | null;
  syllabus_id: string | null;
  preparation_strategy: string | null;
  recommended_books: RecommendedBook[] | null;
  previous_year_papers: PreviousYearPaper[] | null;
  cutoff_trends: CutoffTrend[] | null;
  faqs: Faq[] | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type CurrentAffair = {
  id: string;
  date: string;
  title: string | null;
  slug: string | null;
  content: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type Quiz = {
  id: string;
  title: string;
  slug: string;
  subject: string | null;
  description: string | null;
  questions: QuizQuestion[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type UserProfile = {
  id: string;
  full_name: string | null;
  age: number | null;
  education: string | null;
  category: SocialCategory | null;
  state: string | null;
  created_at: string;
  updated_at: string;
};

export type AppliedJob = {
  id: string;
  user_id: string;
  job_id: string;
  applied_on: string;
  status: AppliedStatus;
  created_at: string;
  updated_at: string;
};

export type SavedJob = {
  id: string;
  user_id: string;
  job_id: string;
  created_at: string;
};

export type QuizAttempt = {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  total: number;
  attempted_at: string;
};

/* ------------------------------------------------------------------ */
/* Automated pipeline staging tables (migration 0013, Phase A)         */
/* Staging only — the scraper never writes to live tables.             */
/* ------------------------------------------------------------------ */

export type ScrapeTargetType =
  | "job"
  | "admit_card"
  | "result"
  | "answer_key"
  | "yojana";

export type ReviewStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "needs_edit";

export type ScrapeSource = {
  id: string;
  name: string;
  base_url: string;
  target_type: ScrapeTargetType;
  scrape_frequency_hours: number;
  is_active: boolean;
  robots_txt_checked_at: string | null;
  last_scraped_at: string | null;
  created_at: string;
};

export type RawScrape = {
  id: string;
  source_id: string | null;
  source_url: string;
  raw_content: string;
  content_hash: string;
  scraped_at: string;
  processed: boolean;
};

export type PendingEntry = {
  id: string;
  raw_scrape_id: string | null;
  target_type: ScrapeTargetType;
  structured_data: Json;
  confidence_flags: Json;
  duplicate_of_id: string | null;
  status: ReviewStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type ScrapeLog = {
  id: string;
  source_id: string | null;
  run_at: string;
  status: "success" | "partial" | "failed" | null;
  items_found: number;
  items_new: number;
  error_message: string | null;
};

/* ------------------------------------------------------------------ */
/* Supabase `Database` generic                                         */
/* ------------------------------------------------------------------ */

type Relationship = {
  foreignKeyName: string;
  columns: string[]; // source FK columns on this table
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

type Table<
  TRow,
  TRelationships extends readonly Relationship[],
  TInsert = Partial<TRow>,
  TUpdate = Partial<TRow>,
> = {
  Row: TRow;
  Insert: TInsert;
  Update: TUpdate;
  Relationships: TRelationships;
};

/**
 * Relationships let supabase-js type select() embeds (e.g. the
 * `job_categories(...)` and `syllabus(...)` joins used by job queries).
 * Mirrors what `supabase gen types typescript` emits.
 */

export type Database = {
  public: {
    Tables: {
      job_categories: Table<JobCategory, []>;
      jobs: Table<
        Job,
        [
          {
            foreignKeyName: "jobs_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "job_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "jobs_syllabus_id_fkey";
            columns: ["syllabus_id"];
            referencedRelation: "syllabus";
            referencedColumns: ["id"];
          },
        ]
      >;
      admit_cards: Table<
        AdmitCard,
        [
          {
            foreignKeyName: "admit_cards_job_id_fkey";
            columns: ["job_id"];
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ]
      >;
      results: Table<
        ResultRow,
        [
          {
            foreignKeyName: "results_job_id_fkey";
            columns: ["job_id"];
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ]
      >;
      answer_keys: Table<
        AnswerKey,
        [
          {
            foreignKeyName: "answer_keys_job_id_fkey";
            columns: ["job_id"];
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ]
      >;
      yojana: Table<Yojana, []>;
      exams: Table<
        Exam,
        [
          {
            foreignKeyName: "exams_syllabus_id_fkey";
            columns: ["syllabus_id"];
            referencedRelation: "syllabus";
            referencedColumns: ["id"];
          },
        ]
      >;
      syllabus: Table<Syllabus, []>;
      current_affairs: Table<CurrentAffair, []>;
      quizzes: Table<Quiz, []>;
      user_profiles: Table<UserProfile, []>;
      applied_jobs: Table<
        AppliedJob,
        [
          {
            foreignKeyName: "applied_jobs_job_id_fkey";
            columns: ["job_id"];
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ]
      >;
      saved_jobs: Table<
        SavedJob,
        [
          {
            foreignKeyName: "saved_jobs_job_id_fkey";
            columns: ["job_id"];
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ]
      >;
      quiz_attempts: Table<
        QuizAttempt,
        [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey";
            columns: ["quiz_id"];
            referencedRelation: "quizzes";
            referencedColumns: ["id"];
          },
        ]
      >;
      admin_users: Table<{ user_id: string; created_at: string }, []>;
      scrape_sources: Table<ScrapeSource, []>;
      raw_scrapes: Table<RawScrape, []>;
      pending_entries: Table<PendingEntry, []>;
      scrape_logs: Table<ScrapeLog, []>;
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      refresh_job_statuses: { Args: Record<string, never>; Returns: undefined };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
