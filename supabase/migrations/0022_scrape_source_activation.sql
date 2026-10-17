-- 0022_scrape_source_activation
--
-- Turn on the two source adapters that were verified against their live
-- listing pages (Employment News vacancy PDFs; IBPS recruitment list).
--
-- UPSC and PIB are bot-blocked (Akamai 403) and RRB Patna's notice data
-- sits behind a WAF-rejected XHR endpoint, so those three stay inactive and
-- are handled as *manual* sources via the admin Quick Publish flow. This
-- migration only flips is_active; auto_publish stays false so every scraped
-- entry still lands in the review queue.

update public.scrape_sources
  set is_active = true
  where name in (
    'Employment News Weekly Digest',
    'IBPS CRP Notifications'
  );

update public.scrape_sources
  set is_active = false
  where name in (
    'UPSC Active Examinations',
    'PIB Press Releases',
    'RRB Patna Notices'
  );
