-- ===========================================================================
-- 0017_phase8a_verification_status.sql
--
-- Phase 8A — "verify before expanding".
--
-- Adds an explicit verification state to every job so that bulk-seeded rows can
-- be held back from search engines until a human has matched them to a real
-- official notification. Nothing is deleted; unverified jobs stay in the
-- database and stay reachable by direct URL.
--
-- HOW TO APPLY:  run this in the Supabase SQL editor, or `supabase db push`.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Verification columns
-- ---------------------------------------------------------------------------
alter table public.jobs
  add column if not exists verification_status text not null default 'unverified',
  add column if not exists verified_at      timestamptz,
  add column if not exists verified_by      text,
  add column if not exists verification_note text;

-- Constrain the allowed values. Added as a NOT VALID check first so the table
-- is never locked for a rewrite on a large table, then validated.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'jobs_verification_status_chk'
  ) then
    alter table public.jobs
      add constraint jobs_verification_status_chk
      check (verification_status in ('verified','unverified','needs_review'));
  end if;
end $$;

-- The single hottest filter in Phase 8: "show me verified, open jobs".
create index if not exists jobs_verification_status_idx
  on public.jobs (verification_status);

-- Composite for the homepage blocks and landing pages.
create index if not exists jobs_verified_status_end_idx
  on public.jobs (verification_status, status, application_end desc);

-- ---------------------------------------------------------------------------
-- 2. Evergreen-exam link (Phase 8A.5)
--
-- A `jobs` row is a TIME-BOUND notification. An `exams` row is the EVERGREEN
-- hub (syllabus, pattern, previous papers). This column points a notification
-- at its exam hub so the exam page can show "Latest notification" and the job
-- page can link back to the evergreen content.
--
-- Deliberately a plain text slug rather than a foreign key: an exam may be
-- referenced before its hub page is written.
-- ---------------------------------------------------------------------------
alter table public.jobs
  add column if not exists exam_slug text;

create index if not exists jobs_exam_slug_idx on public.jobs (exam_slug);

-- ---------------------------------------------------------------------------
-- 3. Backfill — the important part
--
-- Every existing job becomes 'unverified' unless it can be PROVEN verified.
--
-- Reality check on the live data (measured with scripts/db-inventory.mjs,
-- read-only): all 124 jobs were written in three bulk clusters
-- (64 rows in one second, 45 in another, 15 in another) and the table has NO
-- provenance column at all — there is no source_id and no approval record.
-- So by the rule "unverified unless matched to an official source", that is
-- every row. Nothing is promoted automatically below.
--
-- `needs_review` is applied to rows that at least have a working official URL
-- (not flagged dead by the link validator), so the admin queue can sort the
-- most-likely-good rows first. These are still NOT verified and still hidden.
-- ---------------------------------------------------------------------------
update public.jobs
set verification_status = 'unverified'
where verification_status is null;

update public.jobs
set verification_status = 'needs_review'
where verification_status = 'unverified'
  and is_published = true
  and coalesce(link_flagged, false) = false
  and coalesce(official_link, '') <> ''
  and coalesce(source_url, '') <> '';

-- ---------------------------------------------------------------------------
-- 4. Approval helper
--
-- Call this from the admin review queue when a human approves a job.
-- It stamps who/when so the audit trail is real rather than implied.
-- ---------------------------------------------------------------------------
create or replace function public.mark_job_verified(
  job_id uuid,
  approver text default null,
  note text default null
) returns void
language sql
security definer
set search_path = public
as $$
  update public.jobs
     set verification_status = 'verified',
         verified_at      = now(),
         verified_by      = coalesce(approver, verified_by),
         verification_note = coalesce(note, verification_note)
   where id = job_id;
$$;

comment on function public.mark_job_verified(uuid, text, text) is
  'Sets a job to verified with an audit stamp. Called by the admin review queue.';

-- ---------------------------------------------------------------------------
-- 5. Bulk approve / reject for the unverified backlog (Phase 8A.4)
-- ---------------------------------------------------------------------------
create or replace function public.bulk_set_job_verification(
  statuses text[],
  new_status text,
  approver text default null
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  if new_status not in ('verified','unverified','needs_review') then
    raise exception 'invalid verification_status: %', new_status;
  end if;

  update public.jobs
     set verification_status = new_status,
         verified_at = case when new_status = 'verified' then now() else null end,
         verified_by = case when new_status = 'verified' then approver else null end
   where verification_status = any (statuses)
     and is_published = true;

  get diagnostics affected = row_count;
  return affected;
end $$;

comment on function public.bulk_set_job_verification(text[], text, text) is
  'Bulk approve/reject of job verification from /admin/review-queue. Admin-only.';

-- ---------------------------------------------------------------------------
-- 6. View for the CSV export (Phase 8A.4)
-- ---------------------------------------------------------------------------
create or replace view public.unverified_jobs_report as
select
  j.slug,
  j.title,
  j.department,
  j.state,
  j.vacancy_total                                        as claimed_vacancy,
  to_char(j.application_end, 'YYYY-MM-DD')                as claimed_last_date,
  j.official_link,
  j.source_url,
  case
    when j.link_flagged                            then 'flagged_dead'
    when j.link_last_checked_at is null            then 'never_checked'
    when j.link_http_status between 200 and 399    then 'ok_' || j.link_http_status::text
    else 'http_' || coalesce(j.link_http_status::text, 'null')
  end                                                   as link_status,
  j.verification_status,
  j.status,
  j.created_at
from public.jobs j
where j.is_published = true
  and j.verification_status <> 'verified'
order by j.verification_status, j.slug;

comment on view public.unverified_jobs_report is
  'Rows needing human verification. Exported to reports/unverified-jobs.csv.';

-- ---------------------------------------------------------------------------
-- 7. SEO summary helper, used by /admin/seo-health (Phase 7B) and reports
-- ---------------------------------------------------------------------------
create or replace view public.verification_summary as
select
  verification_status,
  status,
  count(*)::int as job_count,
  count(*) filter (where coalesce(link_flagged, false))::int as flagged_dead
from public.jobs
where is_published = true
group by verification_status, status;

-- ---------------------------------------------------------------------------
-- 8. RLS
--
-- public.jobs already has RLS enabled with an open `public_read_jobs` policy
-- (`using (true)`), which predates this phase. We deliberately do NOT tighten
-- it here: the job detail page must still be able to read an unverified job
-- to show the "Details being verified" banner on a direct URL visit.
--
-- Visibility is enforced in the query layer (src/lib/queries.ts), which is
-- what the sitemap, the listings and the homepage all read through.
--
-- If you later want unverified rows hidden from the public REST API as well,
-- run this separately AFTER confirming the banner still renders:
--
--   drop policy if exists "public_read_jobs" on public.jobs;
--   create policy "public_read_jobs" on public.jobs
--     for select to anon, authenticated
--     using (is_published = true
--            and (verification_status = 'verified'
--                 or exists (select 1 from public.admin_users a
--                            where a.user_id = auth.uid())));
-- ---------------------------------------------------------------------------
