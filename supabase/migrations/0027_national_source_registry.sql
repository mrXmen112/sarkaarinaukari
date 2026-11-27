-- ===========================================================================
-- 0027_national_source_registry.sql
--
-- A maintainable registry of official recruitment / scheme portals:
-- central bodies, all 28 states and all 8 Union Territories, plus myScheme.
--
-- EVERY new row is is_active = false and auto_publish = false. Activation is
-- deliberate: a source is switched on only after its listing page has been
-- fetched and its parser verified. Existing active sources are untouched.
-- ===========================================================================

with candidate(name, base_url, source_group, target_type) as (
  values
  -- Central government ------------------------------------------------------
  ('UPSC Active Examinations', 'https://www.upsc.gov.in/', 'central', 'job'),
  ('SSC Notifications', 'https://ssc.gov.in/', 'central', 'job'),
  ('National Career Service', 'https://www.ncs.gov.in/', 'central', 'job'),
  ('Employment News', 'https://employmentnews.gov.in/', 'central', 'job'),
  ('IBPS Recruitment', 'https://www.ibps.in/', 'central', 'job'),
  ('SBI Careers', 'https://sbi.co.in/web/careers/', 'central', 'job'),
  ('Indian Army Recruiting', 'https://www.joinindianarmy.nic.in/', 'central', 'job'),
  ('Indian Navy Recruitment', 'https://www.indiannavy.nic.in/', 'central', 'job'),
  ('Indian Air Force Recruitment', 'https://www.indianairforce.nic.in/', 'central', 'job'),
  ('Ministry of Defence', 'https://www.mod.gov.in/', 'central', 'job'),
  ('Ministry of Railways', 'https://www.indianrailways.gov.in/', 'central', 'job'),
  ('Supreme Court of India', 'https://www.sci.gov.in/', 'central', 'job'),
  ('AIIMS Recruitment', 'https://www.aiims.edu/', 'central', 'job'),
  ('Delhi University Recruitment', 'https://www.du.ac.in/', 'central', 'job'),
  ('Jawaharlal Nehru University Recruitment', 'https://www.jnu.ac.in/', 'central', 'job'),
  ('NTPC Careers', 'https://www.ntpc.co.in/', 'central', 'job'),
  ('NHPC Careers', 'https://www.nhpcindia.com/', 'central', 'job'),
  ('Press Information Bureau', 'https://pib.gov.in/', 'central', 'job'),
  -- States (28) -------------------------------------------------------------
  ('Andhra Pradesh Recruitment', 'https://ap.gov.in/', 'state', 'job'),
  ('Arunachal Pradesh Recruitment', 'https://arunachal.gov.in/', 'state', 'job'),
  ('Assam Recruitment', 'https://assam.gov.in/', 'state', 'job'),
  ('Bihar Recruitment', 'https://www.bihar.gov.in/', 'state', 'job'),
  ('Chhattisgarh Recruitment', 'https://chhattisgarh.gov.in/', 'state', 'job'),
  ('Goa Recruitment', 'https://goa.gov.in/', 'state', 'job'),
  ('Gujarat Recruitment', 'https://www.gujarat.gov.in/', 'state', 'job'),
  ('Haryana Recruitment', 'https://haryana.gov.in/', 'state', 'job'),
  ('Himachal Pradesh Recruitment', 'https://www.hp.gov.in/', 'state', 'job'),
  ('Jharkhand Recruitment', 'https://jharkhand.gov.in/', 'state', 'job'),
  ('Karnataka Recruitment', 'https://www.karnataka.gov.in/', 'state', 'job'),
  ('Kerala Recruitment', 'https://www.kerala.gov.in/', 'state', 'job'),
  ('Madhya Pradesh Recruitment', 'https://www.mp.gov.in/', 'state', 'job'),
  ('Maharashtra Recruitment', 'https://www.maharashtra.gov.in/', 'state', 'job'),
  ('Manipur Recruitment', 'https://manipur.gov.in/', 'state', 'job'),
  ('Meghalaya Recruitment', 'https://www.meghalaya.gov.in/', 'state', 'job'),
  ('Mizoram Recruitment', 'https://mizoram.gov.in/', 'state', 'job'),
  ('Nagaland Recruitment', 'https://nagaland.gov.in/', 'state', 'job'),
  ('Odisha Recruitment', 'https://www.odisha.gov.in/', 'state', 'job'),
  ('Punjab Recruitment', 'https://www.punjab.gov.in/', 'state', 'job'),
  ('Rajasthan Recruitment', 'https://www.rajasthan.gov.in/', 'state', 'job'),
  ('Sikkim Recruitment', 'https://www.sikkim.gov.in/', 'state', 'job'),
  ('Tamil Nadu Recruitment', 'https://www.tn.gov.in/', 'state', 'job'),
  ('Telangana Recruitment', 'https://www.telangana.gov.in/', 'state', 'job'),
  ('Tripura Recruitment', 'https://www.tripura.gov.in/', 'state', 'job'),
  ('Uttar Pradesh Recruitment', 'https://www.up.gov.in/', 'state', 'job'),
  ('Uttarakhand Recruitment', 'https://www.uk.gov.in/', 'state', 'job'),
  ('West Bengal Recruitment', 'https://www.wb.gov.in/', 'state', 'job'),
  -- Union Territories (8) ---------------------------------------------------
  ('Andaman & Nicobar Recruitment', 'https://www.andaman.gov.in/', 'ut', 'job'),
  ('Chandigarh Recruitment', 'https://chandigarh.gov.in/', 'ut', 'job'),
  ('Dadra & Nagar Haveli and Daman & Diu Recruitment', 'https://dnh.gov.in/', 'ut', 'job'),
  ('Delhi Recruitment', 'https://www.delhi.gov.in/', 'ut', 'job'),
  ('Jammu & Kashmir Recruitment', 'https://www.jk.gov.in/', 'ut', 'job'),
  ('Ladakh Recruitment', 'https://www.ladakh.gov.in/', 'ut', 'job'),
  ('Puducherry Recruitment', 'https://py.gov.in/', 'ut', 'job'),
  -- India has 7 UTs after the 2019 Dadra & Nagar Haveli / Daman & Diu merger.
  -- Scheme discovery --------------------------------------------------------
  ('myScheme Portal', 'https://www.myscheme.gov.in/', 'central', 'yojana')
)
insert into public.scrape_sources
  (name, base_url, source_group, target_type, parser, allowed_domains, is_active, auto_publish)
select
  c.name,
  c.base_url,
  c.source_group,
  c.target_type,
  'generic',
  array[regexp_replace(c.base_url, '^https?://(www\.)?([^/]+).*$', '\2')],
  false,
  false
from (select distinct on (base_url) * from candidate) c
on conflict (base_url) do update set
  source_group = coalesce(public.scrape_sources.source_group, excluded.source_group),
  allowed_domains = case
    when cardinality(public.scrape_sources.allowed_domains) = 0
    then excluded.allowed_domains
    else public.scrape_sources.allowed_domains
  end;

-- One source is integrated and tested end to end: IBPS's own server-rendered
-- recruitment list. Enable automated publishing only for that source; all
-- other registry rows stay inactive until their listing page is verified.
update public.scrape_sources
   set auto_publish = true,
       allowed_domains = array['ibps.in'],
       source_group = 'central'
 where name = 'IBPS CRP Notifications';
