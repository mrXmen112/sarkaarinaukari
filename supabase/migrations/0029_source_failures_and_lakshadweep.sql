-- ===========================================================================
-- 0029_source_failures_and_lakshadweep.sql
-- ===========================================================================

-- The UT registry in 0027 omitted Lakshadweep. Add its official administration
-- portal as an inactive, untested generic source (no jobs claimed).
insert into public.scrape_sources
  (name, base_url, target_type, parser, allowed_domains, source_group, is_active, auto_publish)
values
  ('Lakshadweep Recruitment', 'https://www.lakshadweep.gov.in/', 'job', 'generic',
   array['lakshadweep.gov.in'], 'ut', false, false)
on conflict (base_url) do update set
  source_group = 'ut',
  allowed_domains = excluded.allowed_domains;

-- Source-level failure tracking: a failed fetch must be visible, not silently
-- interpreted as "no vacancies in this department".
alter table public.scrape_sources
  add column if not exists consecutive_failures integer not null default 0,
  add column if not exists last_error text;

-- Register the four phase-2 targets. Only those actually verified are active;
-- Employment News is inactive because its portal is unreachable from here.
with candidate(name, base_url, domains, grp, parser, active) as (
  values
    ('CSIR Recruitment', 'https://recruitment.csir.res.in/', array['csir.res.in'], 'central', 'csir', true),
    ('Bihar Vidhan Sabha Recruitment', 'https://vidhansabha.bihar.gov.in/', array['vidhansabha.bihar.gov.in', 'blasrecruit.in'], 'state', 'biharVidhanSabha', true),
    ('Andhra Pradesh High Court', 'https://aphc.gov.in/', array['aphc.gov.in', 'aphc.ap.gov.in'], 'state', 'aphc', true),
    ('Employment News', 'https://employmentnews.gov.in/', array['employmentnews.gov.in'], 'central', 'employmentNews', false)
)
insert into public.scrape_sources
  (name, base_url, target_type, parser, allowed_domains, source_group, is_active, auto_publish, last_scraped_at)
select c.name, c.base_url, 'job', c.parser, c.domains, c.grp, c.active, c.active,
       case when c.active then now() else null end
from candidate c
on conflict (base_url) do update set
  name = excluded.name,
  parser = excluded.parser,
  allowed_domains = excluded.allowed_domains,
  source_group = excluded.source_group,
  is_active = excluded.is_active,
  auto_publish = excluded.auto_publish;
