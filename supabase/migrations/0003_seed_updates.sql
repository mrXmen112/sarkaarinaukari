-- ============================================================================
-- Seed data — Phase 3 sample content: admit cards, results, answer keys.
--
-- Each update is tied to a seeded job where one exists (realism + cross-links);
-- a few historical items (BPSC 69th, TRE 3.0) have no seeded parent job and
-- keep job_id NULL — the UI handles both.
--
-- Run:  supabase db push
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ADMIT CARDS
-- ---------------------------------------------------------------------------
insert into public.admit_cards
  (job_id, title, slug, description, release_date, exam_date, download_link, official_link, is_published)
select j.id, a.title, a.ad_slug, a.description, a.release_date::date, a.exam_date::date, a.download_link, a.official_link, true
from (values
  ('ssc-gd-2026', 'SSC GD Constable 2026 Admit Card',
   'ssc-gd-2026-admit-card',
   'Computer Based Test (CBT) admit card for SSC GD Constable 2026. Carry a valid photo ID (Aadhaar, driving licence or PAN) along with the printout; biometrics will be captured at the exam centre.',
   '2026-10-10', '2026-11-15',
   'https://ssc.gov.in/admit-card/ssc-gd-2026', 'https://ssc.gov.in/'),
  ('ibps-po-17', 'IBPS PO 2026 Prelims Admit Card',
   'ibps-po-17-admit-card',
   'Call letter for the online preliminary examination of IBPS PO CRP-17. Download it from the IBPS portal and check the exam-day instructions inside.',
   '2026-11-05', '2026-11-28',
   'https://www.ibps.in/admit-card/ibps-po-17', 'https://www.ibps.in/'),
  ('bihar-police-constable-2026', 'Bihar Police Constable 2026 Admit Card',
   'bihar-police-constable-2026-admit-card',
   'Hall ticket for the centralised written examination conducted by the Central Selection Board, Bihar Police. Download before visiting the exam centre.',
   '2026-10-01', '2026-11-29',
   'https://csb.bihar.gov.in/admit-card/constable-2026', 'https://csb.bihar.gov.in/'),
  ('up-police-constable-2026', 'UP Police Constable 2026 Admit Card',
   'up-police-constable-2026-admit-card',
   'Admit card for the UP Police constable computer-based test. Ensure the photograph and signature printed on the card match your records.',
   '2026-10-15', '2026-11-22',
   'https://uppbpb.gov.in/admit-card/constable-2026', 'https://uppbpb.gov.in/'),
  ('rrb-group-d-2026', 'RRB Group D Level-1 CBT Admit Card',
   'rrb-group-d-2026-admit-card',
   'Railway Recruitment Board Group D computer-based test call letter. Report 45 minutes before the scheduled time with the printed admit card and a photo ID.',
   '2026-12-20', '2027-02-20',
   'https://railways.gov.in/admit-card/rrb-group-d-2026', 'https://railways.gov.in/')
) as a(slug, title, ad_slug, description, release_date, exam_date, download_link, official_link)
join public.jobs j on j.slug = a.slug
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- RESULTS
-- ---------------------------------------------------------------------------
insert into public.results
  (job_id, title, slug, description, result_date, cutoff_data, merit_list_link, official_link, is_published)
select j.id, r.title, r.r_slug, r.description, r.result_date::date, r.cutoff_data::jsonb, r.merit_list_link, r.official_link, true
from (values
  ('ssc-chsl-2025', 'SSC CHSL 2025 Final Result',
   'ssc-chsl-2025-final-result',
   'Final result of the Combined Higher Secondary Level (CHSL) examination 2025, including the merit list of selected candidates for Data Entry Operator, LDC and Court Clerk posts.',
   '2026-02-10',
   '{"general":58.75,"obc":54.50,"sc":47.25,"st":43.00,"ews":57.00,"pwd":35.50}',
   'https://ssc.gov.in/result/chsl-2025-final', 'https://ssc.gov.in/'),
  ('ssc-chsl-2025', 'SSC CHSL 2025 Tier 1 Result (Category-wise Cutoff)',
   'ssc-chsl-2025-tier1-result',
   'Tier 1 examination result with category-wise cutoff marks for the CHSL 2025 cycle. Aspirants who qualified moved on to Tier 2.',
   '2025-12-30',
   '{"general":65.25,"obc":60.50,"sc":52.00,"st":48.75,"ews":63.50,"pwd":38.00}',
   'https://ssc.gov.in/result/chsl-2025-tier1', 'https://ssc.gov.in/'),
  (NULL, 'BPSC 69th Mains Result 2025',
   'bpsc-69th-mains-result',
   'Mains written examination result for the BPSC 69th Combined Competitive Examination. Selected candidates proceed to the interview stage.',
   '2026-06-25',
   '{"general":111.00,"obc":104.50,"sc":96.00,"st":92.00,"female":99.50}',
   'https://bpsc.bih.nic.in/result/69th-mains', 'https://bpsc.bih.nic.in/'),
  (NULL, 'Bihar TRE 3.0 Final Result',
   'bihar-tre-3-final-result',
   'Final result of the Bihar Teacher Recruitment Examination (TRE) 3.0 for government school posts.'
   || chr(10) || chr(10)
   || 'Note: this relates to the previous TRE cycle. The current recruitment round is Bihar TRE 4.0 (see the jobs listing).',
   '2026-04-05',
   '{"general":78.00,"obc":72.50,"sc":64.00,"st":60.00,"ews":75.50,"pwd":40.00}',
   'https://bssc.bih.nic.in/result/tre-3-final', 'https://bssc.bih.nic.in/')
) as r(slug, title, r_slug, description, result_date, cutoff_data, merit_list_link, official_link)
left join public.jobs j on (r.slug is not null and j.slug = r.slug)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- ANSWER KEYS
-- ---------------------------------------------------------------------------
insert into public.answer_keys
  (job_id, title, slug, description, type, release_date, objection_last_date, download_link, official_link, is_published)
select j.id, a.title, a.a_slug, a.description, a.type, a.release_date::date, a.objection_last_date::date, a.download_link, a.official_link, true
from (values
  ('ssc-chsl-2025', 'SSC CHSL 2025 Tier 1 Final Answer Key',
   'ssc-chsl-2025-tier1-final-answer-key',
   'Final answer key for the CHSL 2025 Tier 1 computer-based test after review of candidates'' objections.',
   'final', '2026-01-05', NULL,
   'https://ssc.gov.in/answer-key/chsl-2025-tier1-final', 'https://ssc.gov.in/'),
  ('ssc-chsl-2025', 'SSC CHSL 2025 Tier 1 Provisional Answer Key',
   'ssc-chsl-2025-tier1-provisional-answer-key',
   'Provisional answer key of the CHSL 2025 Tier 1 examination. Candidates could raise objections within the window listed below by paying a nominal fee per question.',
   'provisional', '2025-12-12', '2025-12-16',
   'https://ssc.gov.in/answer-key/chsl-2025-tier1-provisional', 'https://ssc.gov.in/'),
  (NULL, 'BPSC 69th Prelims Final Answer Key',
   'bpsc-69th-prelims-final-answer-key',
   'Final answer key of the BPSC 69th prelims examination after objections were reviewed.',
   'final', '2026-01-10', NULL,
   'https://bpsc.bih.nic.in/answer-key/69th-prelims-final', 'https://bpsc.bih.nic.in/')
) as a(slug, title, a_slug, description, type, release_date, objection_last_date, download_link, official_link)
left join public.jobs j on (a.slug is not null and j.slug = a.slug)
on conflict (slug) do nothing;