-- ===========================================================================
-- 0026_automated_publishing.sql
--
-- Additive foundation for automated, source-verified publishing:
--   * provenance on live rows (which source / raw scrape / staged entry)
--   * an import_errors table for failed imports and validation errors
--   * lifecycle states cancelled / result_declared + IST-aware status refresh
--   * pending_entries states for automated processing (no mandatory human gate)
--   * Yojana directory fields (UT level, category, documents, apply URL, status)
--   * richer scrape logs for the monitoring dashboard
--
-- No existing row is deleted and nothing is mass-verified.
-- ===========================================================================

-- 1. Provenance for automatically published rows -----------------------------
alter table public.jobs
  add column if not exists source_id uuid references public.scrape_sources(id) on delete set null,
  add column if not exists raw_scrape_id uuid references public.raw_scrapes(id) on delete set null,
  add column if not exists pending_entry_id uuid references public.pending_entries(id) on delete set null,
  add column if not exists auto_published boolean not null default false;

create index if not exists jobs_auto_published_idx
  on public.jobs (auto_published) where auto_published = true;
create index if not exists jobs_source_id_idx on public.jobs (source_id);

-- 2. Full recruitment lifecycle ----------------------------------------------
alter table public.jobs drop constraint if exists jobs_status_check;
alter table public.jobs
  add constraint jobs_status_check
  check (status in ('active', 'closed', 'upcoming', 'cancelled', 'result_declared'));

create or replace function public.refresh_job_statuses()
returns void
language sql
security definer
set search_path = public
as $function$
  -- Asia/Kolkata, not the server's UTC date: an IST deadline must not stay
  -- "open" for a further five and a half hours.
  update public.jobs
     set status = 'closed'
   where status in ('active', 'upcoming')
     and application_end < (now() at time zone 'Asia/Kolkata')::date;
$function$;

revoke all on function public.refresh_job_statuses() from public, anon, authenticated;
grant execute on function public.refresh_job_statuses() to service_role;

-- 3. Staging states that do not require mandatory human approval -------------
alter table public.pending_entries drop constraint if exists pending_entries_status_check;
alter table public.pending_entries
  add constraint pending_entries_status_check
  check (status in (
    'auto_pending', 'auto_published', 'automated_error',
    'pending_review', 'approved', 'rejected', 'needs_edit'
  ));
create index if not exists pending_entries_status_idx
  on public.pending_entries (status, created_at);

-- 4. Failed imports / validation errors -------------------------------------
create table if not exists public.import_errors (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.scrape_sources(id) on delete set null,
  pending_entry_id uuid references public.pending_entries(id) on delete set null,
  raw_scrape_id uuid references public.raw_scrapes(id) on delete set null,
  phase text not null check (phase in ('scrape', 'structure', 'validate', 'publish')),
  severity text not null default 'error' check (severity in ('error', 'warning')),
  code text not null,
  message text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists import_errors_created_idx on public.import_errors (created_at desc);
create index if not exists import_errors_source_idx on public.import_errors (source_id, created_at desc);
create index if not exists import_errors_unresolved_idx
  on public.import_errors (created_at desc) where resolved_at is null;

alter table public.import_errors enable row level security;
drop policy if exists "admin reads import errors" on public.import_errors;
create policy "admin reads import errors" on public.import_errors
  for select to authenticated using (public.is_admin());
grant select on public.import_errors to authenticated;

-- 5. Sarkari Yojana directory fields -----------------------------------------
alter table public.yojana
  add column if not exists category text,
  add column if not exists apply_url text,
  add column if not exists required_documents text,
  add column if not exists availability_status text not null default 'active'
    check (availability_status in ('active', 'closed', 'upcoming', 'unknown')),
  add column if not exists source_url text;

alter table public.yojana drop constraint if exists yojana_level_check;
alter table public.yojana
  add constraint yojana_level_check check (level in ('central', 'state', 'ut'));

create index if not exists yojana_category_idx on public.yojana (category);
create index if not exists yojana_level_state_idx on public.yojana (level, state);
create index if not exists yojana_availability_idx on public.yojana (availability_status);

-- 6. Source registry metadata -------------------------------------------------
alter table public.scrape_sources
  add column if not exists allowed_domains text[] not null default '{}',
  add column if not exists source_group text
    check (source_group in ('central', 'state', 'ut'));

-- 7. Scrape log detail for the monitoring dashboard --------------------------
alter table public.scrape_logs
  add column if not exists phase text not null default 'scrape',
  add column if not exists items_updated integer not null default 0,
  add column if not exists items_duplicate integer not null default 0,
  add column if not exists items_failed integer not null default 0;

-- 8. Atomic automated verification stamp -------------------------------------
-- Only the service role may call this. It is the single write path that flips a
-- job to publicly visible from the automated pipeline, so it is auditable.
create or replace function public.mark_auto_verified(
  p_job_id uuid,
  p_source text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $function$
begin
  update public.jobs
     set verification_status = 'verified',
         source_verified = true,
         verified_at = now(),
         verified_by = 'auto:' || p_source,
         verification_note = coalesce(
           p_note,
           'Automatically cross-checked against the registered official source'
         ),
         last_verified_at = now(),
         published_at = coalesce(published_at, now())
   where id = p_job_id;
end;
$function$;

revoke all on function public.mark_auto_verified(uuid, text, text) from public, anon, authenticated;
grant execute on function public.mark_auto_verified(uuid, text, text) to service_role;
