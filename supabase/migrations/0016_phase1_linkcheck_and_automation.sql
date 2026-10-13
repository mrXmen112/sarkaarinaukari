-- ============================================================================
-- Phase 1 hardening: link validation, trusted-source toggles, site settings,
-- and the auto-expiry scheduler hooks.
--
-- Additive only: new columns default safely, new tables are admin-only, and
-- refresh_job_statuses() (0001) is the same function now intended to be run
-- on a schedule. Nothing existing is dropped or altered destructively.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. jobs — link-validation bookkeeping.
--    link_http_status: 0 = unreachable/timeout; null = not yet checked.
--    link_flagged: true when the last daily check found a dead apply/PDF link.
-- ---------------------------------------------------------------------------
alter table public.jobs
  add column if not exists link_last_checked_at timestamptz,
  add column if not exists link_http_status      smallint,
  add column if not exists link_flagged          boolean not null default false;

create index if not exists jobs_link_flagged_idx on public.jobs (link_flagged);

-- ---------------------------------------------------------------------------
-- 2. scrape_sources — per-source "trusted, auto-publish" toggle (used later)
--    plus a free-text parser note for ops.
-- ---------------------------------------------------------------------------
alter table public.scrape_sources
  add column if not exists auto_publish boolean not null default false,
  add column if not exists parser      text;

-- ---------------------------------------------------------------------------
-- 3. site_settings — small key/value table for admin toggles
--    (e.g. telegram_auto_post). Admin-only RLS, same pattern as 0013.
-- ---------------------------------------------------------------------------
create table if not exists public.site_settings (
  key        text primary key,
  value      jsonb not null default 'null'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

drop policy if exists "admin_all_site_settings" on public.site_settings;
create policy "admin_all_site_settings" on public.site_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Default: Telegram auto-post OFF until the owner flips it after adding tokens.
insert into public.site_settings (key, value)
values ('telegram_auto_post', 'false'::jsonb)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- 4. Scheduler hooks.
--
--    (a) Vercel Cron: vercel.json calls /api/cron/pipeline and
--        /api/cron/maintenance once a day (Hobby limit). Those routes call
--        select public.refresh_job_statuses() via the service role.
--
--    (b) Supabase pg_cron (30-60 min scraping): enable with
--          create extension if not exists pg_cron;
--        then, with pg_net, one of:
--          select cron.schedule('sarkaari-pipeline', '17,47 * * * *',
--            $$select net.http_post(
--               url := 'https://www.sarkaarinaukri.online/api/cron/pipeline',
--               headers := jsonb_build_object(
--                 'Authorization', 'Bearer ' || current_setting('app.cron_secret', true)),
--               body := '{}'::jsonb)$$);
--        (create extension if not exists pg_net; run only if pg_cron is
--        available on your plan; set app.cron_secret via:
--          alter database postgres set app.cron_secret = '<same as CRON_SECRET>';)
--
--    Both paths only touch staging tables + link-check columns; publishing
--    stays a human decision in /admin/review-queue.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 5. Archive helper: published jobs closed for more than N days. A VIEW keeps
--    the /jobs/archive listing honest without duplicating rows.
-- ---------------------------------------------------------------------------
create or replace view public.archived_jobs as
  select j.*
    from public.jobs j
   where j.status = 'closed'
     and j.is_published = true
     and j.application_end < (current_date - interval '90 days');
