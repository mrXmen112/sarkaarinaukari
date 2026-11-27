-- Source discovery & monitoring metadata (Phase 3).
alter table public.scrape_sources
  add column if not exists source_type text not null default 'recruitment'
    check (source_type in ('recruitment', 'scheme', 'news', 'aggregator')),
  add column if not exists http_status integer,
  add column if not exists last_successful_fetch_at timestamptz,
  add column if not exists last_successful_extraction_at timestamptz,
  add column if not exists last_imported_at timestamptz,
  add column if not exists last_imported_job_id uuid references public.jobs(id) on delete set null;

-- Operational classification of registry entries.
update public.scrape_sources set source_type = 'scheme' where target_type = 'yojana';
update public.scrape_sources set source_type = 'aggregator'
  where name in ('Employment News', 'National Career Service');
update public.scrape_sources set source_type = 'news' where name = 'Press Information Bureau';
