-- ===========================================================================
-- 0018_audit_hardening.sql
--
-- Findings from the read-only security audit of the whole public schema, run
-- after 0017_phase8a_verification_status on project sarkaarinaukari
-- (ref saalgaxbsxzmejxbzmbw, PostgreSQL 17.6).
--
-- This migration closes four gaps and changes no application behaviour. It
-- contains NO DML and NO DDL that alters data or column types.
--
--   1. public.archived_jobs is a SECURITY DEFINER view (advisor ERROR).
--   2. public.refresh_job_statuses() is SECURITY DEFINER and callable by anon.
--   3. public.handle_new_user() is SECURITY DEFINER and callable by anon.
--   4. public.set_updated_at() has no pinned search_path (advisor WARN).
--   5. public.jobs_backup_20261014 had RLS off and was world-readable.
--
-- `public.is_admin()` is deliberately LEFT executable by `authenticated`:
-- src/lib/admin.ts:21 calls supabase.rpc("is_admin") with the cookie-aware
-- client, so the role at call time is `authenticated`. Only `anon` loses it.
--
-- Idempotent. Touches nothing in auth or storage. Does not move pg_trgm.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. archived_jobs -> security_invoker
--
-- Today this is NOT an extra leak: the view selects only columns that the
-- existing public_read_jobs policy (`using (true)`) already exposes to anon.
-- But a definer view silently BYPASSES RLS, so the moment public_read_jobs is
-- tightened (which is the stated plan once unverified jobs are hidden from the
-- REST API), archived_jobs would keep serving closed jobs through the back
-- door. security_invoker makes the view obey the caller's RLS, which is what
-- the rest of the schema already does.
-- ---------------------------------------------------------------------------
create or replace view public.archived_jobs
with (security_invoker = true)
as
select id, title, slug, category_id, state, department, short_description,
       eligibility_education, eligibility_age_min, eligibility_age_max,
       age_relaxation, vacancy_total, vacancy_breakdown, application_fee,
       selection_process, pay_scale, how_to_apply, notification_pdf_link,
       notification_date, application_start, application_end, exam_date,
       official_link, syllabus_id, status, source_url, is_published,
       created_at, updated_at, department_slug, link_last_checked_at,
       link_http_status, link_flagged
from public.jobs
where status = 'closed'
  and is_published = true
  and application_end < (current_date - interval '90 days');

comment on view public.archived_jobs is
  'Published jobs closed more than 90 days ago. security_invoker so it can never bypass RLS on jobs.';

-- ---------------------------------------------------------------------------
-- 2. refresh_job_statuses() -> service_role only
--
-- The body only does `update jobs set status = ''closed'' where application_end
-- < current_date`, so it is one-directional and idempotent: calling it early
-- cannot damage data. But leaving it open means any anonymous HTTP request to
-- /rest/v1/rpc/refresh_job_statuses can force a write. Its only caller is the
-- maintenance cron (src/app/api/cron/maintenance/route.ts:30), which uses
-- createAdminClient() = service_role, so revoking the public roles is safe.
-- ---------------------------------------------------------------------------
revoke all on function public.refresh_job_statuses()
  from public, anon, authenticated;

grant execute on function public.refresh_job_statuses()
  to service_role;

-- ---------------------------------------------------------------------------
-- 3. handle_new_user() -> service_role only
--
-- A trigger function on auth.users. The advisor flags it because it is
-- SECURITY DEFINER and PUBLIC-executable, but PostgREST refuses to expose
-- trigger functions over RPC, so it is not directly reachable today.
-- PostgreSQL checks EXECUTE on a trigger function at CREATE TRIGGER time, not
-- at fire time, so revoking it here does not stop the trigger from firing on
-- signup. Revoked to silence a real latent risk rather than a live exploit.
-- ---------------------------------------------------------------------------
revoke all on function public.handle_new_user()
  from public, anon, authenticated;

grant execute on function public.handle_new_user()
  to service_role;

-- ---------------------------------------------------------------------------
-- 4. is_admin() -> drop anon only
--
-- `authenticated` MUST keep EXECUTE (src/lib/admin.ts:21 uses the user's
-- session, not the service role). `anon` has no reason to ask whether it is
-- an admin, and the function is SECURITY DEFINER.
-- ---------------------------------------------------------------------------
revoke all on function public.is_admin()
  from public, anon;

grant execute on function public.is_admin()
  to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5. set_updated_at() -> pin search_path
--
-- SECURITY INVOKER, so this is hardening rather than an active exploit, but an
-- unpinned search_path on a trigger that runs on every UPDATE is the pattern
-- Supabase's advisor warns about. Recreating it with a pinned path changes
-- nothing else; the trigger bindings reference it by OID and survive.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. jobs_backup_20261014 -> lock down
--
-- The pre-migration backup was created with a bare
--   create table if not exists jobs_backup_20261014 as select * from jobs;
-- `CREATE TABLE AS` does NOT enable RLS and does NOT set any grants, so in
-- schema public the table inherited the schema's default USAGE and was
-- immediately reachable by anyone holding the public anon key, for both SELECT
-- and INSERT/UPDATE/DELETE. Measured before this fix:
--
--   anon_can_read_backup         = true
--   anon_can_write_backup        = true
--   backup_rls_enabled           = false
--
-- RLS is enabled here and every non-service role is revoked. With RLS on and no
-- policy, the table denies everything, so the revoke is belt-and-braces.
--
-- If you DROP the backup table later, this section becomes a harmless no-op.
-- ---------------------------------------------------------------------------
alter table public.jobs_backup_20261014 enable row level security;

revoke all on public.jobs_backup_20261014 from public, anon, authenticated;
grant select on public.jobs_backup_20261014 to service_role;

-- ===========================================================================
-- ROLLBACK
-- ===========================================================================
-- Every statement above is a grant or a CREATE OR REPLACE, so the reverse is
-- simply "put the privileges back". Run only if the app breaks.
--
--    grant execute on function public.refresh_job_statuses() to anon, authenticated;
--    grant execute on function public.handle_new_user()     to anon, authenticated;
--    grant execute on function public.is_admin()            to anon, authenticated;
--    create or replace view public.archived_jobs as
--      select id, title, slug, category_id, state, department, short_description,
--             eligibility_education, eligibility_age_min, eligibility_age_max,
--             age_relaxation, vacancy_total, vacancy_breakdown, application_fee,
--             selection_process, pay_scale, how_to_apply, notification_pdf_link,
--             notification_date, application_start, application_end, exam_date,
--             official_link, syllabus_id, status, source_url, is_published,
--             created_at, updated_at, department_slug, link_last_checked_at,
--             link_http_status, link_flagged
--      from jobs
--      where status = 'closed' and is_published = true
--        and application_end < (current_date - interval '90 days');
--    create or replace function public.set_updated_at() returns trigger
--      language plpgsql as $$
--      begin new.updated_at = now(); return new; end; $$;
--
-- If set_updated_at() stops stamping updated_at, check that the trigger is
-- still bound: select tgname, tgrelid::regclass from pg_trigger
-- where tgfunc = 'public.set_updated_at'::regproc and not tgisinternal;
-- ===========================================================================