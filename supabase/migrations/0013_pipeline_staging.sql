-- ============================================================================
-- Automated Data Pipeline — Phase A: staging infrastructure ONLY.
--
-- ZERO RISK to the live site: this migration creates FOUR BRAND NEW tables.
-- It does NOT alter jobs, admit_cards, results, answer_keys, yojana, or any
-- other existing table in any way. No scraper runs yet (Phase F), no cron,
-- no writes to live tables. The scraper skeleton lives in scripts/scraper/
-- and is completely decoupled from the Next.js runtime.
--
-- Flow (later phases):
--   official sources -> raw_scrapes -> (LLM) -> pending_entries
--   -> human Approve in /admin/review-queue -> live tables
-- ============================================================================

-- pg_trgm is needed in Phase E for title-similarity duplicate detection.
-- Enabling an extension is additive and affects nothing existing.
create extension if not exists "pg_trgm";

-- ---------------------------------------------------------------------------
-- 1. scrape_sources — one row per official source site
-- ---------------------------------------------------------------------------
create table if not exists public.scrape_sources (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null,
  base_url               text not null unique,
  target_type            text not null
    check (target_type in ('job','admit_card','result','answer_key','yojana')),
  scrape_frequency_hours int not null default 12,
  is_active              boolean not null default true,
  robots_txt_checked_at  timestamptz,
  last_scraped_at        timestamptz,
  created_at             timestamptz not null default now()
);

create index if not exists scrape_sources_active_idx on public.scrape_sources (is_active);
create index if not exists scrape_sources_target_idx on public.scrape_sources (target_type);

-- ---------------------------------------------------------------------------
-- 2. raw_scrapes — untouched source text, before any LLM processing
-- ---------------------------------------------------------------------------
create table if not exists public.raw_scrapes (
  id          uuid primary key default gen_random_uuid(),
  source_id   uuid references public.scrape_sources(id) on delete set null,
  source_url  text not null,
  raw_content text not null,
  content_hash text not null unique,
  scraped_at  timestamptz not null default now(),
  processed   boolean not null default false
);

create index if not exists raw_scrapes_source_idx    on public.raw_scrapes (source_id);
create index if not exists raw_scrapes_processed_idx on public.raw_scrapes (processed);
create index if not exists raw_scrapes_scraped_idx   on public.raw_scrapes (scraped_at desc);

-- ---------------------------------------------------------------------------
-- 3. pending_entries — LLM-structured output awaiting human review
-- ---------------------------------------------------------------------------
create table if not exists public.pending_entries (
  id               uuid primary key default gen_random_uuid(),
  raw_scrape_id    uuid references public.raw_scrapes(id) on delete set null,
  target_type      text not null
    check (target_type in ('job','admit_card','result','answer_key','yojana')),
  structured_data  jsonb not null default '{}'::jsonb,
  confidence_flags jsonb not null default '{}'::jsonb,
  duplicate_of_id  uuid,
  status           text not null default 'pending_review'
    check (status in ('pending_review','approved','rejected','needs_edit')),
  reviewed_by      uuid,
  reviewed_at      timestamptz,
  created_at       timestamptz not null default now()
);

create index if not exists pending_entries_status_idx on public.pending_entries (status);
create index if not exists pending_entries_target_idx on public.pending_entries (target_type);
create index if not exists pending_entries_created_idx on public.pending_entries (created_at desc);

-- ---------------------------------------------------------------------------
-- 4. scrape_logs — one row per scraper run per source
-- ---------------------------------------------------------------------------
create table if not exists public.scrape_logs (
  id            uuid primary key default gen_random_uuid(),
  source_id     uuid references public.scrape_sources(id) on delete set null,
  run_at        timestamptz not null default now(),
  status        text check (status in ('success','partial','failed')),
  items_found   int not null default 0,
  items_new     int not null default 0,
  error_message text
);

create index if not exists scrape_logs_source_idx on public.scrape_logs (source_id);
create index if not exists scrape_logs_run_idx    on public.scrape_logs (run_at desc);

-- ---------------------------------------------------------------------------
-- 5. RLS — staging tables are ADMIN-ONLY. No anon/authenticated public read.
--    (The scraper uses the service-role key, which bypasses RLS entirely.)
-- ---------------------------------------------------------------------------
alter table public.scrape_sources enable row level security;
alter table public.raw_scrapes    enable row level security;
alter table public.pending_entries enable row level security;
alter table public.scrape_logs    enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'scrape_sources','raw_scrapes','pending_entries','scrape_logs'
  ]
  loop
    execute format(
      'drop policy if exists "admin_all_%1$s" on public.%1$I;', t);
    execute format(
      'create policy "admin_all_%1$s" on public.%1$I for all to authenticated using (public.is_admin()) with check (public.is_admin());', t);
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- 6. Seed sources (Section 3 of the pipeline doc).
--
-- Rollout discipline (Phase G): ONLY BPSC starts active, because Phase B/C
-- test exactly one source first. Every other source stays is_active = false
-- until it has passed isolated testing, then gets flipped on one at a time.
-- Nothing runs on any schedule until Phase F, so these rows are inert data.
-- ---------------------------------------------------------------------------
insert into public.scrape_sources
  (name, base_url, target_type, scrape_frequency_hours, is_active)
values
  ('BPSC Notifications',            'https://www.bpsc.bih.nic.in/',        'job',    12,  true),
  ('SSC Notifications',             'https://ssc.gov.in/',                 'job',    12,  false),
  ('UPSC Active Examinations',      'https://upsc.gov.in/examinations/active-exams', 'job', 12, false),
  ('IBPS CRP Notifications',        'https://www.ibps.in/',                'job',    12,  false),
  ('RRB Patna Notices',             'http://www.rrbpatna.gov.in/',         'job',    12,  false),
  ('RRB Kolkata Notices',           'https://rrbkolkata.gov.in/',          'job',    12,  false),
  ('RRB Mumbai Notices',            'https://rrbmumbai.gov.in/',           'job',    12,  false),
  ('BSSC Notices',                  'https://bssc.bih.nic.in/',            'job',    12,  false),
  ('CSBC Bihar Police Recruitment', 'https://csbc.bihar.gov.in/',          'job',    12,  false),
  ('National Career Service',       'https://www.ncs.gov.in/',             'job',    24,  false),
  ('Employment News Weekly Digest', 'https://employmentnews.gov.in/',      'job',    168, false),
  ('myScheme Portal',               'https://www.myscheme.gov.in/',        'yojana', 168, false),
  ('PIB Press Releases',            'https://pib.gov.in/',                 'yojana', 168, false)
on conflict (base_url) do nothing;
