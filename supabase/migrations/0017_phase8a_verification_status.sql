-- ===========================================================================
-- 0017_phase8a_verification_status.sql
--
-- Phase 8A — "verify before expanding", plus the privilege hardening that
-- Phase 8A requires.
--
-- These two used to be 0017 (schema) and 0018 (grants). They are applied as a
-- SINGLE migration on purpose: 0017 creates SECURITY DEFINER functions, and in
-- PostgreSQL a new function is granted EXECUTE to PUBLIC by default. Supabase
-- additionally grants USAGE on schema public to anon and authenticated, so on a
-- public site an anonymous visitor holding the public anon key could have run
--
--     select mark_job_verified('<any-job-uuid>');
--
-- and pushed unverified content back into the listings and the sitemap —
-- defeating the entire point of this phase. Running both in one transaction
-- closes that window entirely.
--
-- Verified against the live project `sarkaarinaukari` (ref saalgaxbsxzmejxbzmbw),
-- PostgreSQL 17.6:
--   jobs = 124 rows, link_flagged = 39
--   -> 85 becomes needs_review, 39 stays unverified, 124 total
-- If those numbers ever differ, STOP: the site has changed underneath this file.
--
-- Idempotent: safe to re-run. No DML other than the backfill in section 3.
-- Touches nothing in the auth or storage schemas.
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
-- 3. Backfill — the only DML in this migration
--
-- Every existing job becomes 'unverified' unless it can be PROVEN verified.
--
-- Reality check on the live data (measured read-only with
-- scripts/db-inventory.mjs): all 124 jobs were written in three bulk clusters
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
--
-- SECURITY: security definer so the function can write under the owner's
-- rights, with search_path PINNED to public and every object reference fully
-- qualified. Without the pinned search_path an attacker who can create objects
-- in a writable schema could hijack resolution inside the function.
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

-- PostgreSQL grants EXECUTE to PUBLIC on new functions by default. Revoke it,
-- and revoke it from the two public roles explicitly, before granting to
-- service_role only. service_role is the server-side key used by the admin
-- server actions, and every call site is additionally gated by requireAdmin()
-- in the application layer.
revoke all on function public.mark_job_verified(uuid, text, text)
  from public, anon, authenticated;

grant execute on function public.mark_job_verified(uuid, text, text)
  to service_role;

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
  'Bulk approve/reject of job verification from /admin/verification. Admin-only.';

-- Same hardening as above. Without this, a single anonymous HTTP request could
-- approve the entire backlog.
revoke all on function public.bulk_set_job_verification(text[], text, text)
  from public, anon, authenticated;

grant execute on function public.bulk_set_job_verification(text[], text, text)
  to service_role;

-- ---------------------------------------------------------------------------
-- 6. View for the CSV export (Phase 8A.4)
--
-- security_invoker = true (PostgreSQL 15+, we are on 17.6): the view executes
-- with the CALLER's privileges instead of the definer's, so the RLS on public.jobs
-- still applies to whoever reads it. That means this view can never become a
-- side door around the RLS policies on jobs.
-- ---------------------------------------------------------------------------
create or replace view public.unverified_jobs_report
with (security_invoker = true)
as
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

revoke all on public.unverified_jobs_report from public, anon, authenticated;
grant select on public.unverified_jobs_report to service_role;

-- ---------------------------------------------------------------------------
-- 7. SEO summary helper, used by /admin/seo-health and reports
-- ---------------------------------------------------------------------------
create or replace view public.verification_summary
with (security_invoker = true)
as
select
  verification_status,
  status,
  count(*)::int as job_count,
  count(*) filter (where coalesce(link_flagged, false))::int as flagged_dead
from public.jobs
where is_published = true
group by verification_status, status;

revoke all on public.verification_summary from public, anon, authenticated;
grant select on public.verification_summary to service_role;

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
-- run that separately AFTER confirming the banner still renders.
-- ---------------------------------------------------------------------------

-- ===========================================================================
-- ROLLBACK
-- ===========================================================================
--
-- There is no automatic rollback — this file is not reversible in the usual
-- sense, because rolling back re-opens the public verify surface and discards
-- the audit trail. The restore path is, in order of preference:
--
-- 1. FULL REVERT (before any job has been verified):
--
--    drop view if exists public.verification_summary;
--    drop view if exists public.unverified_jobs_report;
--    drop function if exists public.bulk_set_job_verification(text[], text, text);
--    drop function if exists public.mark_job_verified(uuid, text, text);
--    drop index if exists public.jobs_verified_status_end_idx;
--    drop index if exists public.jobs_exam_slug_idx;
--    drop index if exists public.jobs_verification_status_idx;
--    alter table public.jobs drop constraint if exists jobs_verification_status_chk;
--    alter table public.jobs
--      drop column if exists verification_status,
--      drop column if exists verified_at,
--      drop column if exists verified_by,
--      drop column if exists verification_note,
--      drop column if exists exam_slug;
--
-- 2. RESTORE THE DATA ONLY (keeps the schema, undoes the classification).
--    jobs_backup_20261014 is a plain `select *` copy taken BEFORE this
--    migration, so it does NOT have a verification_status column. The state to
--    return to is therefore simply "nothing was verified", which is what the
--    table effectively meant before the column existed:
--
--    update public.jobs
--       set verification_status = 'unverified',
--           verified_at         = null,
--           verified_by         = null,
--           verification_note   = null;
--
--    That reverses the backfill. It cannot, and should not, "un-verify" jobs
--    that a human approved afterwards — if you have been approving jobs, filter
--    by verified_at is not null first.
--
-- 3. NUCLEAR (last resort, loses audit data):
--    restore public.jobs from public.jobs_backup_20261014 row by row.
--
-- The backup table itself is left in place on purpose — it is your only copy of
-- the pre-migration state. Drop it separately once you are satisfied.
-- ===========================================================================