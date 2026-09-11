-- ============================================================================
-- More Bihar exam updates so the Bihar Hub "Recent Updates" area has useful
-- content. Release dates are forward-dated to match the exam schedule of the
-- corresponding job (demo data for the Phase 4 hub).
-- ============================================================================

insert into public.admit_cards
  (job_id, title, slug, description, release_date, exam_date, download_link, official_link, is_published)
select j.id, a.title, a.ad_slug, a.description, a.release_date::date, a.exam_date::date, a.download_link, a.official_link, true
from (values
  ('bpsc-70th-ccae', 'BPSC 70th Prelims Admit Card',
   'bpsc-70th-prelims-admit-card',
   'Hall ticket for the BPSC 70th Combined Competitive Preliminary Examination. Download from the BPSC portal, check the centre printed on the card, and carry a photo ID on the exam day.',
   '2026-11-25', '2027-01-10',
   'https://bpsc.bih.nic.in/admit-card/70th-prelims', 'https://bpsc.bih.nic.in/'),
  ('bihar-tre-4', 'Bihar TRE 4.0 Admit Card',
   'bihar-tre-4-admit-card',
   'Admit card of the Bihar Teacher Recruitment Examination 4.0 (Paper 1 / Paper 2). Download it from the BSSC TRE portal well before the exam date.',
   '2026-11-05', '2026-12-13',
   'https://bssc.bih.nic.in/admit-card/tre-4', 'https://bssc.bih.nic.in/'),
  ('bssc-inter-level-2026', 'BSSC Inter Level 2026 Admit Card',
   'bssc-inter-level-2026-admit-card',
   'Call letter for the BSSC Inter Level (12th Pass) Combined Competitive Examination. Carry the printed admit card along with a valid government photo ID.',
   '2026-12-15', '2027-01-24',
   'https://bssc.bih.nic.in/admit-card/inter-level-2026', 'https://bssc.bih.nic.in/')
) as a(slug, title, ad_slug, description, release_date, exam_date, download_link, official_link)
join public.jobs j on j.slug = a.slug
on conflict (slug) do nothing;