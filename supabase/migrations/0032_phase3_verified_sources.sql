-- Phase 3 verified source registrations. All rows were fetched and their
-- extracted values cross-checked against official PDFs before activation.
with candidate(name, base_url, domains, grp, parser) as (
  values
    ('CSIR Careers', 'https://www.csir.res.in/', array['csir.res.in'], 'central', 'csirCareers'),
    ('RRB CEN Notifications', 'https://www.rrbapply.gov.in/', array['rrbapply.gov.in', 'recruitmentrrb.in', 'indianrailways.gov.in'], 'central', 'rrbCen'),
    ('DSSSB Recruitment', 'https://dsssb.delhi.gov.in/', array['dsssb.delhi.gov.in'], 'ut', 'dsssb')
)
insert into public.scrape_sources
  (name, base_url, target_type, parser, allowed_domains, source_group, is_active, auto_publish, last_scraped_at, last_successful_fetch_at, last_successful_extraction_at)
select c.name, c.base_url, 'job', c.parser, c.domains, c.grp, true, true, now(), now(), now()
from candidate c
on conflict (base_url) do update set
  name = excluded.name,
  parser = excluded.parser,
  allowed_domains = excluded.allowed_domains,
  source_group = excluded.source_group,
  is_active = true,
  auto_publish = true,
  last_scraped_at = now(),
  last_successful_fetch_at = now(),
  last_successful_extraction_at = now();
