-- ===========================================================================
-- 0020_verification_signals.sql
--
-- B4 requires a page to have "an official source link, a Last Verified date"
-- before it may be indexed. src/lib/indexable.ts implements that rule, but the
-- columns it needs do not exist on the two templates it covers.
--
-- Measured on the live database (read-only):
--
--   exams   columns: conducting_body, cutoff_trends, eligibility, exam_pattern,
--                    faqs, name, overview, preparation_strategy,
--                    previous_year_papers, recommended_books, short_name, slug,
--                    syllabus_id  (+ id/created_at/updated_at/is_published)
--            -> NO official_link, NO last_verified_at
--
--   yojana  has official_link, but NO last_verified_at
--
-- Only `jobs` ever had a verification timestamp, and it is `link_last_checked_at`
-- — written by the automated link checker, which proves a URL resolves. It does
-- not prove a human matched the page against its official notification, which is
-- a different and weaker claim. Reusing it would let an unchecked page pass a
-- check it has not earned.
--
-- So this migration adds the two signals properly, and backfills NOTHING.
-- Both default to NULL, which means every existing exams/yojana row fails the
-- indexability rule and is served `noindex, follow` and kept out of the sitemap
-- until a human fills them in. That is the intended outcome of B4, not a
-- regression: the alternative is ranking 48 thin exam pages and 18 thin yojana
-- pages that Google has already refused to index.
--
-- Idempotent. No DML. Touches nothing in auth or storage.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. exams — official source + human verification stamp
--
-- `official_link` is the conducting body's own portal or notification. It is
-- deliberately NOT auto-filled from a scraped or inferred URL: an unverifiable
-- default would make the column look populated while defeating the whole check.
-- ---------------------------------------------------------------------------
alter table public.exams
  add column if not exists official_link   text,
  add column if not exists last_verified_at timestamptz;

comment on column public.exams.official_link is
  'Conducting body''s official portal or notification URL. NULL until verified.';
comment on column public.exams.last_verified_at is
  'When a human last checked this exam hub against its official source. NULL = unverified.';

-- ---------------------------------------------------------------------------
-- 2. yojana — human verification stamp
--
-- yojana already has official_link and every published row already fills it, so
-- only the timestamp is missing.
-- ---------------------------------------------------------------------------
alter table public.yojana
  add column if not exists last_verified_at timestamptz;

comment on column public.yojana.last_verified_at is
  'When a human last checked this scheme against its official source. NULL = unverified.';

-- ---------------------------------------------------------------------------
-- 3. Indexes
--
-- These support the admin verification queue ("show me what still needs a
-- check"), which is the only query pattern that grows. Not added on jobs: its
-- hot filters are already covered by jobs_verified_status_end_idx from 0017.
-- ---------------------------------------------------------------------------
create index if not exists exams_last_verified_at_idx
  on public.exams (last_verified_at);

create index if not exists yojana_last_verified_at_idx
  on public.yojana (last_verified_at);

-- ---------------------------------------------------------------------------
-- 4. RLS
--
-- Both tables already have RLS enabled with an anon/authenticated read policy
-- and an `is_admin()` write policy, which is correct and unchanged. The two new
-- columns are covered by those same table-level policies.
-- ===========================================================================
-- ROLLBACK
-- ===========================================================================
-- Dropping the columns loses only NULLs today, so this is safe until someone
-- starts filling them in. After that, export first:
--
--    copy (
--      select slug, official_link, last_verified_at from public.exams
--    ) to 'exams_verification.csv' csv header;
--
--    alter table public.exams
--      drop column if exists official_link,
--      drop column if exists last_verified_at;
--    alter table public.yojana drop column if exists last_verified_at;
--
-- Note: reverting re-opens B4, because src/lib/indexable.ts reads these
-- columns and would then error rather than degrade.
-- ===========================================================================