-- ===========================================================================
-- 0021_job_freshness.sql
--
-- W5.1 + W5.2: a trustworthy "this page actually changed" signal.
--
-- Why a new column instead of updated_at
-- --------------------------------------
-- updated_at looks like a freshness signal but is not one. Measured read-only
-- on the live project (124 published jobs):
--
--   count(*)                                         = 124
--   count(*) where updated_at > created_at           = 124   (all of them)
--   distinct updated_at values                       = 2
--     39 rows  @ 2026-10-13 01:09-02:46   <- the automated link checker
--     85 rows  @ 2026-10-16 16:46:17       <- ONE instant: the 0017 backfill
--
-- So updated_at is a machine stamp: a link check or a bulk migration writes it
-- on every row at once. Emitting that as <lastmod>, or drawing an "Updated"
-- badge from it, tells every crawler and every reader that all 124 postings
-- changed on the same second. It did not.
--
-- The same is true on the other content tables (admit_cards, results,
-- answer_keys, exams, yojana): they all carry a `jobs_set_updated_at`-style
-- BEFORE UPDATE trigger, so only a distinct-value count below the row count is
-- possible. exams: 48 rows / 7 distinct stamps. Not a per-page signal either.
--
-- What this migration adds
-- -------------------------
--   1. jobs.published_at        - when the row first went public. Real signal:
--                                 seeded rows are backfilled from created_at,
--                                 which IS when they first appeared.
--   2. jobs.content_changed_at  - when a human-equivalent EDIT changed
--                                 page-visible content. NULL everywhere on
--                                 backfill: there is no historical edit record,
--                                 and inventing one (today's date) is exactly the
--                                 bulk-date lie we are removing.
--   3. a trigger that maintains both, and that deliberately ignores machine
--      writes (link checks, verification, publish toggles).
--
-- After this file:
--   UPDATED badge  <- content_changed_at within 48h   (nothing, until a real edit)
--   NEW badge      <- published_at within 48h          (nothing: seeds are from Sept)
--   sitemap lastmod <- content_changed_at, omitted when NULL
--
-- Idempotent. The only DML is the published_at backfill in section 3.
-- Touches nothing in the auth or storage schemas.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Columns
-- ---------------------------------------------------------------------------
alter table public.jobs
  add column if not exists published_at       timestamptz,
  add column if not exists content_changed_at timestamptz;

comment on column public.jobs.published_at is
  'When the job first went public. Backfilled from created_at; set by trigger on first publish. Drives the NEW badge (48h).';

comment on column public.jobs.content_changed_at is
  'When a human-equivalent edit last changed page-visible content. NULL = never edited since this column existed. Drives the UPDATED badge (48h) and the sitemap lastmod. Never written by link checks, verification or bulk operations.';

-- The two badge queries ("changed in the last 48h") and the sitemap ordering.
create index if not exists jobs_published_at_idx
  on public.jobs (published_at desc nulls last);

create index if not exists jobs_content_changed_at_idx
  on public.jobs (content_changed_at desc nulls last);

-- ---------------------------------------------------------------------------
-- 2. Backfill
--
-- published_at: created_at is the honest answer -- it is genuinely when the row
-- came into existence and became listable. All 124 rows were created
-- 2026-09-10/11, so this correctly produces NO "New" badge today: those
-- postings are a month old, and the badge is supposed to be rare.
--
-- content_changed_at: deliberately LEFT NULL. There is no per-row record of a
-- content edit anywhere in this database, so any value we wrote would be a
-- fabrication. NULL means the UPDATED badge shows for nothing and the sitemap
-- omits lastmod for every job until a real edit happens -- which is the honest
-- state of the data, and exactly what W5 asked for ("does NOT mark every job as
-- changed today; use the best real signal available, ELSE NULL").
--
-- Only published rows get a published_at; a draft has not been published and
-- must not claim a date.
-- ---------------------------------------------------------------------------
update public.jobs
   set published_at = created_at
 where published_at is null
   and is_published = true;

-- ---------------------------------------------------------------------------
-- 3. The freshness trigger
--
-- BEFORE INSERT OR UPDATE so it can adjust NEW before the row is written (and
-- so it composes with the existing jobs_set_updated_at trigger, which we leave
-- completely alone -- updated_at keeps working as a plain machine stamp).
--
-- The content column list below is the whole point. A write that touches ONLY
-- these columns does NOT stamp content_changed_at:
--
--   updated_at, is_published, link_last_checked_at, link_http_status,
--   link_flagged, verification_status, verified_at, verified_by,
--   verification_note, created_at, published_at, content_changed_at
--
-- That list covers every automated writer we have: the link checker (link_*),
-- mark_job_verified / bulk_set_job_verification (verification_*, verified_*),
-- and the column backfills in migrations 0017/0018/0020.
--
-- `is distinct from` is used rather than `<>` because every one of these
-- columns is nullable and `null <> null` is null, not false: with `<>`, a NULL
-- -> 'something' edit (a very common real edit) would go undetected.
--
-- SECURITY: no SECURITY DEFINER, no dynamic SQL, search_path pinned anyway.
-- This function reads only NEW/OLD, so it cannot be used to reach anything.
-- ---------------------------------------------------------------------------
create or replace function public.jobs_stamp_freshness()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    -- First publish stamps published_at; a draft stays NULL.
    if new.is_published and new.published_at is null then
      new.published_at := now();
    end if;
    -- A brand-new row is "New", not "Updated": leave content_changed_at NULL.
    new.content_changed_at := null;
    return new;
  end if;

  -- UPDATE: first transition to published sets the date once and keeps it.
  if new.is_published and old.published_at is null and new.published_at is null then
    new.published_at := now();
  else
    new.published_at := old.published_at;
  end if;

  if new.title                 is distinct from old.title
     or new.slug               is distinct from old.slug
     or new.short_description   is distinct from old.short_description
     or new.eligibility_education is distinct from old.eligibility_education
     or new.eligibility_age_min is distinct from old.eligibility_age_min
     or new.eligibility_age_max is distinct from old.eligibility_age_max
     or new.age_relaxation      is distinct from old.age_relaxation
     or new.vacancy_total       is distinct from old.vacancy_total
     or new.vacancy_breakdown   is distinct from old.vacancy_breakdown
     or new.application_fee     is distinct from old.application_fee
     or new.selection_process   is distinct from old.selection_process
     or new.pay_scale           is distinct from old.pay_scale
     or new.how_to_apply        is distinct from old.how_to_apply
     or new.notification_pdf_link is distinct from old.notification_pdf_link
     or new.notification_date   is distinct from old.notification_date
     or new.application_start   is distinct from old.application_start
     or new.application_end     is distinct from old.application_end
     or new.exam_date           is distinct from old.exam_date
     or new.official_link       is distinct from old.official_link
     or new.source_url          is distinct from old.source_url
     or new.state               is distinct from old.state
     or new.department          is distinct from old.department
     or new.department_slug     is distinct from old.department_slug
     or new.category_id         is distinct from old.category_id
     or new.status              is distinct from old.status
     or new.exam_slug           is distinct from old.exam_slug
     or new.syllabus_id         is distinct from old.syllabus_id
  then
    new.content_changed_at := now();
  else
    new.content_changed_at := old.content_changed_at;
  end if;

  return new;
end $$;

comment on function public.jobs_stamp_freshness() is
  'Maintains jobs.published_at and jobs.content_changed_at. Stamps content_changed_at ONLY when a page-visible content column actually changed, so link checks, verification and bulk migrations never inflate it.';

-- Idempotent trigger install.
drop trigger if exists jobs_stamp_freshness on public.jobs;
create trigger jobs_stamp_freshness
  before insert or update on public.jobs
  for each row execute function public.jobs_stamp_freshness();

-- ---------------------------------------------------------------------------
-- 4. RLS
--
-- public.jobs keeps its existing policies untouched. The two new columns sit
-- behind the same table-level read policy; they hold no sensitive data (they
-- are public dates), so no policy change is required.
-- ---------------------------------------------------------------------------

-- ===========================================================================
-- ROLLBACK
-- ===========================================================================
-- Dropping the columns discards only freshness metadata; no content is lost.
-- Take the dates with you first if admins have started relying on them:
--
--   copy (
--     select slug,
--            to_char(published_at,       'YYYY-MM-DD HH24:MI:SS') as published_at,
--            to_char(content_changed_at, 'YYYY-MM-DD HH24:MI:SS') as content_changed_at
--       from public.jobs
--   ) to 'jobs_freshness.csv' csv header;
--
--   drop trigger  if exists jobs_stamp_freshness on public.jobs;
--   drop function if exists public.jobs_stamp_freshness();
--   drop index if exists public.jobs_content_changed_at_idx;
--   drop index if exists public.jobs_published_at_idx;
--   alter table public.jobs
--     drop column if exists content_changed_at,
--     drop column if exists published_at;
--
-- Reverting re-opens the W5.1/W5.2 gap: the badges fall back to created_at /
-- updated_at and the sitemap would have to stamp a bulk date again. If you must
-- revert, also revert the TypeScript in src/lib/freshness.ts to stop reading
-- the columns.
-- ===========================================================================
