-- ===========================================================================
-- 0028_tested_recruitment_sources.sql
--
-- Registers the source-specific adapters that were actually fetched and
-- cross-checked against live official pages/PDFs. Generic/untested registry
-- rows remain inactive. No jobs are inserted by this migration.
-- ===========================================================================

with tested(name, base_url, domains, grp, parser) as (
  values
    ('ISRO Recruitment', 'https://www.isro.gov.in/', array['isro.gov.in'], 'central', 'isro'),
    ('BARC Recruitment', 'https://www.barc.gov.in/', array['barc.gov.in'], 'central', 'barc'),
    ('BTSC Recruitment', 'https://btsc.bihar.gov.in/', array['btsc.bihar.gov.in'], 'state', 'btsc'),
    ('TGPSC Recruitment', 'https://websitenew.tgpsc.gov.in/', array['tgpsc.gov.in', 'tspsc.gov.in'], 'state', 'tgpsc'),
    ('UPPSC Recruitment', 'https://uppsc.up.nic.in/', array['uppsc.up.nic.in'], 'state', 'uppsc'),
    ('Kerala PSC Recruitment', 'https://www.keralapsc.gov.in/', array['keralapsc.gov.in'], 'state', 'keralapsc')
)
insert into public.scrape_sources
  (name, base_url, target_type, parser, allowed_domains, source_group, is_active, auto_publish, last_scraped_at)
select
  t.name, t.base_url, 'job', t.parser, t.domains, t.grp, true, true, now()
from tested t
on conflict (base_url) do update set
  name = excluded.name,
  parser = excluded.parser,
  allowed_domains = excluded.allowed_domains,
  source_group = excluded.source_group,
  is_active = true,
  auto_publish = true,
  last_scraped_at = now();
