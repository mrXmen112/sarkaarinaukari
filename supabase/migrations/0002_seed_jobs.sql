-- ============================================================================
-- Seed data — Phase 2 sample content (18 jobs, mix of central + Bihar)
--
-- Dates are relative to project creation (Sep 2026) so the listing has a
-- realistic spread of active / upcoming / closed jobs and the countdown
-- badge shows every urgency state.
--
-- Run:  supabase db execute --file supabase/seed.sql
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Job categories
-- ---------------------------------------------------------------------------
insert into public.job_categories (slug, name, parent_category, sort_order) values
  ('central',    'Central Government', null, 10),
  ('state',      'State Government',   null, 20),
  ('psu',        'PSU / Public Sector', null, 30),
  ('judiciary',  'Judiciary & Legal',  null, 40),
  ('teaching',   'Teaching',           null, 50),
  ('healthcare', 'Healthcare',         null, 60),
  ('local-body', 'Local Bodies',       null, 70),
  ('defence',    'Defence & Police',   null, 80)
on conflict (slug) do update
  set name = excluded.name, parent_category = excluded.parent_category, sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- Syllabus entries referenced by a few jobs (full exam content arrives Phase 5)
-- ---------------------------------------------------------------------------
insert into public.syllabus (slug, exam_name, stage, subjects) values
  ('ssc-cgl-tier-1', 'SSC CGL Tier 1', 'prelims',
   '[{"subject":"General Intelligence & Reasoning","topics":["Analogies","Classification","Series"]},
     {"subject":"General Awareness","topics":["Current Affairs","History","Geography","Polity","Economy"]},
     {"subject":"Quantitative Aptitude","topics":["Number System","Percentages","Time & Work","Mensuration"]},
     {"subject":"English Comprehension","topics":["Spotting Errors","Cloze Test","Fill in the Blanks"]}]'::jsonb),
  ('bpsc-70th-prelims', 'BPSC 70th Prelims', 'prelims',
   '[{"subject":"General Studies","topics":["History of India","Indian Polity","Economy","Geography","Current Affairs"]},
     {"subject":"Maths & Reasoning","topics":["Arithmetic","Logical Reasoning","Analytical Ability"]}]'::jsonb)
on conflict (slug) do update
  set exam_name = excluded.exam_name, stage = excluded.stage, subjects = excluded.subjects;

-- Temporary relation columns for FK lookups below
create temporary table seed_jobs (
  job_slug    text primary key,
  title       text not null,
  cat_slug    text,
  state       text,
  department  text,
  short_desc  text,
  edu         text,
  age_min     int,
  age_max     int,
  relaxation  jsonb,
  vacancies   int,
  breakdown   jsonb,
  fee         jsonb,
  process     text[],
  pay         text,
  apply_steps text[],
  notif_pdf   text,
  notif_date  date,
  apply_from  date,
  apply_end   date,
  exam_date   date,
  official    text,
  source      text,
  syb_slug    text,
  status      text
);

insert into seed_jobs (job_slug, title, cat_slug, state, department, short_desc, edu, age_min, age_max, relaxation, vacancies, breakdown, fee, process, pay, apply_steps, notif_pdf, notif_date, apply_from, apply_end, exam_date, official, source, syb_slug, status) values
-- ---------------------- CENTRAL -------------------------------------------
('ssc-cgl-2026', 'SSC Combined Graduate Level (CGL) 2026', 'central', null, 'Staff Selection Commission (SSC)',
 'Combined Graduate Level examination for recruitment to Group B and Group C posts across ministries, departments and constitutional bodies.',
 'Graduate (any stream) from a recognised university',
 18, 32, '{"sc_st":5,"obc":3,"ews":0,"pwd":10}', 18000, '{"general":7200,"obc":4860,"sc":2700,"st":1350,"ews":1800,"pwd":90}',
 '{"general":100,"sc_st":0,"female":100,"pwd":0}',
 array['Tier 1 (CBT)','Tier 2 (CBT)','Tier 3 (Descriptive)','Document Verification','Medical / DME'],
 'Level 4 to 8 pay matrix (Rs 25,500 to Rs 81,100)',
 array['Read the official notification on the SSC website','Register on the SSC portal and fill the online application','Upload photo, signature and required documents','Pay the application fee online','Submit and take a printout of the application form'],
 'https://ssc.gov.in/Advt/SSC-CGL-2026.pdf', '2026-08-30',
 '2026-09-01', '2026-11-10', '2027-02-14',
 'https://ssc.gov.in/', 'https://ssc.gov.in/',
 'ssc-cgl-tier-1', 'active'),

('ssc-chsl-2025', 'SSC CHSL (12th Level) 2025', 'central', null, 'Staff Selection Commission (SSC)',
 'Combined Higher Secondary Level examination for Data Entry Operator, LDC, DEO and Court Clerk posts. Now closed — next cycle in 2026.',
 '12th pass (or equivalent)',
 18, 27, '{"sc_st":5,"obc":3,"pwd":10}', 4570, '{"general":1828,"obc":1234,"sc":685,"st":343,"ews":457,"pwd":23}',
 '{"general":100,"sc_st":0,"female":100,"pwd":0}',
 array['Tier 1 (CBT)','Tier 2 (Descriptive)','DV / Typing Test'],
 'Pay level 2 (Rs 19,900 to Rs 63,200)',
 array['Fill online form on ssc.gov.in','Pay fee','Upload documents','Submit'],
 'https://ssc.gov.in/Advt/SSC-CHSL-2025.pdf', '2025-04-01',
 '2025-04-05', '2025-08-20', '2025-12-10',
 'https://ssc.gov.in/', 'https://ssc.gov.in/',
 null, 'closed'),

('ibps-po-17', 'IBPS PO 2026 (CRP 17)', 'central', null, 'Institute of Banking Personnel Selection (IBPS)',
 'Recruitment of Probationary Officers in 11 participating public sector banks.',
 'Graduate (any discipline) from a recognised university',
 20, 30, '{"sc_st":5,"obc":3,"ews":0,"pwd":10}', 6000, '{"general":2400,"obc":1620,"sc":900,"st":450,"ews":600,"pwd":30}',
 '{"general":850,"sc_st":175,"obc":850}',
 array['Prelims (online)','Mains (online)','Interview'],
 'Scale I Officer — approx Rs 8.2 LPA (CTC)',
 array['Register on the IBPS CRP website','Fill application and upload photo/signature','Pay the fee','Submit form — keep the registration number safe'],
 'https://www.ibps.in/wp-content/uploads/IBPS-PO-2026.pdf', '2026-09-01',
 '2026-09-05', '2026-10-25', '2026-11-28',
 'https://www.ibps.in/', 'https://www.ibps.in/',
 null, 'active'),

('rrb-group-d-2026', 'RRB Group D (Level 1) 2026', 'central', null, 'Railway Recruitment Board (RRB)',
 'Recruitment of Track Maintainer, Helper and other Level 1 posts across Indian Railways zones.',
 '10th pass / ITI in relevant trade',
 18, 33, '{"sc_st":5,"obc":3,"ews":0,"pwd":10}', 16000, '{"general":6400,"obc":4320,"sc":2400,"st":1200,"ews":1600,"pwd":80}',
 '{"general":500,"sc_st":250,"obc":500}',
 array['CBT Stage 1','CBT Stage 2','Physical Efficiency Test (PET)','Document Verification','Medical Examination'],
 'Level 1 pay matrix (Rs 18,000 to Rs 56,900) + railway allowances',
 array['Visit the RRB regional website','Register with mobile & email OTP','Fill the application form','Pay fees online','Submit — download the fee receipt'],
 'https://ncr.indianrailways.gov.in/uploads/files/RRB-GroupD-2026.pdf', '2026-09-06',
 '2026-09-08', '2026-12-02', '2027-02-20',
 'https://railways.gov.in/', 'https://ncr.indianrailways.gov.in/',
 null, 'active'),

('ssc-gd-2026', 'SSC GD Constable 2026', 'central', null, 'Staff Selection Commission (SSC)',
 'Recruitment of General Duty Constables in CAPFs, NIA, SSF and Assam Rifles.',
 '10th pass (or equivalent)',
 18, 23, '{"sc_st":5,"obc":3,"ews":0,"pwd":10}', 39000, '{"general":15600,"obc":10530,"sc":5850,"st":2925,"ews":3900,"pwd":195}',
 '{"general":100,"sc_st":0,"female":100,"pwd":0}',
 array['Computer Based Test','Physical Efficiency Test (PET)','Physical Standard Test (PST)','Document Verification','Medical'],
 'Level 3 pay matrix (Rs 21,700 to Rs 69,100)',
 array['Apply online on ssc.gov.in','Upload documents','Pay fee','Submit application'],
 'https://ssc.gov.in/Advt/SSC-GD-2026.pdf', '2026-09-10',
 '2026-09-12', '2026-09-30', '2026-11-15',
 'https://ssc.gov.in/', 'https://ssc.gov.in/',
 null, 'active'),

('upsc-cse-2027', 'UPSC Civil Services Preliminary 2027', 'central', null, 'Union Public Service Commission (UPSC)',
 'Civil Services Examination for IAS, IPS, IFS and Group A/B central services.',
 'Graduate (any stream). Final-year students can apply.',
 21, 32, '{"sc_st":5,"obc":3,"ews":0,"pwd":10}', 1100, '{"general":440,"obc":297,"sc":165,"st":82,"ews":110,"pwd":6}',
 '{"general":100,"sc_st":0,"obc":100,"pwd":0}',
 array['Preliminary (CSAT + GS Paper I)','Main Examination (9 descriptive papers)','Personality Test (Interview)'],
 'IAS/IPS — Level 10 to 18 (Rs 56,100 starting, up to Junioir Administrative Grade)',
 array['Register on upsconline.nic.in','Fill the detailed application form','Pay fee','Submit after preview'],
 'https://upsc.gov.in/sites/default/files/CSE-2027-Notification.pdf', '2027-02-01',
 '2027-02-05', '2027-03-05', '2027-06-06',
 'https://upsc.gov.in/', 'https://upsc.gov.in/',
 null, 'upcoming'),

('ntpc-executive-2026', 'NTPC Executive Trainee 2026', 'psu', null, 'NTPC Limited',
 'Engineering graduates and MBAs recruited as Executive Trainees in Indias largest power utility.',
 'B.E/B.Tech (relevant discipline) or MBA/MSc with 60% marks',
 21, 30, '{"sc_st":5,"obc":3,"ews":0,"pwd":10}', 320, '{"general":128,"obc":86,"sc":48,"st":24,"ews":32,"pwd":2}',
 '{"general":300,"sc_st":150,"obc":300}',
 array['Online Test (Technical + Aptitude)','Group Discussion','Personal Interview'],
 'E3 grade — approx Rs 10.9 LPA',
 array['Register on careers.ntpc.co.in','Fill application','Upload documents','Pay application fee','Submit'],
 'https://careers.ntpc.co.in/Advt/NTPC-ET-2026.pdf', '2026-08-20',
 '2026-08-25', '2026-09-16', '2026-10-18',
 'https://careers.ntpc.co.in/', 'https://careers.ntpc.co.in/',
 null, 'active'),

-- ---------------------- BIHAR ---------------------------------------------
('bpsc-70th-ccae', 'BPSC 70th Combined Competitive Examination 2026', 'state', 'bihar', 'Bihar Public Service Commission (BPSC)',
 'Combined (Preliminary) Competitive Examination for recruitment to state civil services, police and allied services in Bihar.',
 'Graduate (any stream) from a recognised university',
 20, 37, '{"sc_st":5,"obc":3,"ews":0,"backward_men":3,"female":5}', 1500, '{"general":600,"obc":405,"sc":225,"st":112,"ews":150,"pwd":8}',
 '{"general":100,"sc_st":0,"obc":100,"female":0}',
 array['Preliminary Examination (Objective)','Main Written Examination (Descriptive)','Interview'],
 'Bihar Govt — Level 9 pay matrix with allowances; genuinely one of the largest Bihar govt recruitment drives',
 array['Open the BPSC notification on bpsc.bih.nic.in','Register on the BPSC portal','Fill the application and submit the photo','Print the fee challan / pay online','Submit the form and keep the registration number'],
 'https://bpsc.bih.nic.in/PDF/Advt-70th-CCE-2026.pdf', '2026-08-15',
 '2026-08-25', '2026-10-28', '2027-01-10',
 'https://bpsc.bih.nic.in/', 'https://bpsc.bih.nic.in/',
 'bpsc-70th-prelims', 'active'),

('bihar-police-constable-2026', 'Bihar Police Constable Recruitment 2026', 'state', 'bihar', 'Central Selection Board (CSB), Bihar Police',
 'Recruitment of constables in Bihar Police (district & armed) and jail warders. Physical + written selection.',
 '10th / 12th pass (varies by post)',
 18, 25, '{"sc_st":5,"obc":3,"ews":0,"female":5}', 24000, '{"general":9600,"obc":6480,"sc":3600,"st":1800,"ews":2400,"pwd":120}',
 '{"general":0,"all":0}',
 array['Physical Efficiency Test (PET)','Physical Measurement Test (PMT)','Written Examination','Medical Examination','Final Merit'],
 'Level 3 pay matrix (Rs 25,000 to Rs 65,000 approx) + allowances',
 array['Apply online on csb.bihar.gov.in','Upload photograph & documents','Take a printout of the application'],
 'https://csb.bihar.gov.in/Advt/Bihar-Police-Constable-2026.pdf', '2026-09-05',
 '2026-09-10', '2026-10-05', '2026-11-29',
 'https://csb.bihar.gov.in/', 'https://csb.bihar.gov.in/',
 null, 'active'),

('bssc-inter-level-2026', 'BSSC Inter Level (12th Pass) Examination 2026', 'state', 'bihar', 'Bihar Staff Selection Commission (BSSC)',
 'Inter Level Combined Competitive Examination for various clerical and miscellaneous posts in Bihar government departments.',
 '12th pass from Bihar School Examination Board or equivalent',
 18, 37, '{"sc_st":5,"obc":3,"ews":0,"backward_men":3,"female":5}', 600, '{"general":240,"obc":162,"sc":90,"st":45,"ews":60,"pwd":3}',
 '{"general":100,"sc_st":0,"obc":100,"female":0}',
 array['Preliminary (Objective)','Main Examination (Objective)','Typing / Skill Test (where applicable)'],
 'Level 4–6 pay matrix (Rs 25,500 to Rs 81,100)',
 array['Visit bssc.bih.nic.in','Register with mobile number','Fill the online form','Pay fee','Submit'],
 'https://bssc.bih.nic.in/Advt/Inter-Level-2026.pdf', '2026-09-01',
 '2026-09-05', '2026-11-20', '2027-01-24',
 'https://bssc.bih.nic.in/', 'https://bssc.bih.nic.in/',
 null, 'active'),

('bihar-tre-4', 'Bihar TRE 4.0 — Teacher Recruitment 2026', 'state', 'bihar', 'Bihar Staff Selection Commission (BSSC)',
 'Teacher Recruitment Examination for Primary, Upper Primary and Secondary posts in government schools of Bihar.',
 'D.El.Ed / B.Ed as per post level; TET/TRE qualified',
 18, 37, '{"sc_st":5,"obc":3,"ews":0,"female":5}', 85000, '{"general":34000,"obc":22950,"sc":12750,"st":6375,"ews":8500,"pwd":425}',
 '{"general":50,"sc_st":0,"obc":50,"female":0}',
 array['Written Examination (Paper 1 / Paper 2)','Document Verification','Counselling'],
 'Pay level 6–9 with Bihar government pay structure',
 array['Apply on the BSSC TRE portal','Fill in AC No. and personal details','Upload marksheets and TET/TRE certificate','Submit application'],
 'https://bssc.bih.nic.in/Advt/TRE-4.0-2026.pdf', '2026-08-28',
 '2026-09-02', '2026-10-15', '2026-12-13',
 'https://bssc.bih.nic.in/', 'https://bssc.bih.nic.in/',
 null, 'active'),

('bihar-staff-nurse-2026', 'Bihar Health Department — Staff Nurse 2026', 'state', 'bihar', 'Bihar Health Department',
 'Recruitment of Staff Nurses for district hospitals and PHCs across Bihar.',
 'B.Sc Nursing / GNM from a recognised institute',
 18, 37, '{"sc_st":5,"obc":3,"ews":0,"female":5}', 3200, '{"general":1280,"obc":864,"sc":480,"st":240,"ews":320,"pwd":16}',
 '{"general":100,"sc_st":0,"obc":100,"female":0}',
 array['Written Examination','Document Verification'],
 'Level 6 pay matrix (Rs 35,400 to Rs 1,12,400)',
 array['Apply online on the Bihar Health portal','Upload GNM/BSc Nursing marksheets','Pay the fee','Submit'],
 'https://statehealthsocietybihar.org/Advt/Nurse-2026.pdf', '2026-09-08',
 '2026-09-10', '2026-09-28', '2026-11-08',
 'https://statehealthsocietybihar.org/', 'https://statehealthsocietybihar.org/',
 null, 'active'),

('bihar-gram-kachahari-2026', 'Bihar Gram Kachahari Clerk & Guard 2026', 'state', 'bihar', 'Bihar Panchayati Raj Department',
 'Recruitment of Clerk and Guard for Gram Kachahari (village courts) positions across Bihar panchayats.',
 'Clerk: 12th pass; Guard: 10th pass',
 18, 37, '{"sc_st":5,"obc":3,"ews":0,"female":5}', 5400, '{"general":2160,"obc":1458,"sc":810,"st":405,"ews":540,"pwd":27}',
 '{"general":100,"sc_st":0,"obc":100,"female":0}',
 array['Written Examination','Document Verification'],
 'Pay structure per Bihar Panchayati Raj rules',
 array['Apply through the GRAS portal / e-District Bihar','Fill in personal details','Submit the form'],
 'https://panchayat.bihar.gov.in/Advt/GramKachahari-2026.pdf', '2026-09-12',
 '2026-09-15', '2026-10-20', null,
 'https://panchayat.bihar.gov.in/', 'https://panchayat.bihar.gov.in/',
 null, 'upcoming'),

-- ---------------------- OTHER STATES (filter testing) ----------------------
('up-police-constable-2026', 'UP Police Constable Recruitment 2026', 'state', 'uttar-pradesh', 'UP Police Recruitment & Promotion Board',
 'Recruitment of constables in the Uttar Pradesh Police force.',
 '10th / 12th pass (post dependent)',
 18, 25, '{"sc_st":5,"obc":3,"ews":0,"female":2}', 60244, '{"general":24098,"obc":16266,"sc":9037,"st":4518,"ews":6024,"pwd":301}',
 '{"general":0,"all":0}',
 array['Computer Based Test','PET/PST','Document Verification','Medical'],
 'Level 3 pay matrix (Rs 21,700 to Rs 69,100)',
 array['Apply on uppbpb.gov.in','Upload photo & documents','Take the application printout'],
 'https://uppbpb.gov.in/Advt/UP-Police-2026.pdf', '2026-09-03',
 '2026-09-06', '2026-10-01', '2026-11-22',
 'https://uppbpb.gov.in/', 'https://uppbpb.gov.in/',
 null, 'active'),

('delhi-police-constable-2026', 'Delhi Police Constable (Executive) 2026', 'state', 'delhi', 'Delhi Police',
 'Recruitment of constables (executive) in Delhi Police.',
 '10th pass (or equivalent)',
 18, 25, '{"sc_st":5,"obc":3,"ews":0,"pwd":10}', 7547, '{"general":3019,"obc":2038,"sc":1132,"st":566,"ews":755,"pwd":37}',
 '{"general":100,"sc_st":0,"obc":100,"pwd":0}',
 array['Computer Based Test','PET/PST','Document Verification','Medical'],
 'Level 3 pay matrix (Rs 21,700 to Rs 69,100)',
 array['Apply on the Delhi Police portal','Fill the online form','Submit after preview'],
 'https://csd.delhipolice.gov.in/Advt/Constable-2026.pdf', '2026-08-22',
 '2026-08-28', '2026-09-26', '2026-11-01',
 'https://csd.delhipolice.gov.in/', 'https://csd.delhipolice.gov.in/',
 null, 'active');

-- ---------------------------------------------------------------------------
-- Materialise jobs from the staging table
-- ---------------------------------------------------------------------------
insert into public.jobs (
  slug, title, category_id, state, department, short_description,
  eligibility_education, eligibility_age_min, eligibility_age_max, age_relaxation,
  vacancy_total, vacancy_breakdown, application_fee, selection_process, pay_scale,
  how_to_apply, notification_pdf_link, notification_date, application_start,
  application_end, exam_date, official_link, source_url, syllabus_id, status, is_published
)
select
  s.job_slug, s.title,
  (select id from public.job_categories where slug = s.cat_slug),
  s.state, s.department, s.short_desc,
  s.edu, s.age_min, s.age_max, s.relaxation,
  s.vacancies, s.breakdown, s.fee, s.process, s.pay,
  s.apply_steps, s.notif_pdf, s.notif_date, s.apply_from,
  s.apply_end, s.exam_date, s.official, s.source,
  (select id from public.syllabus where slug = s.syb_slug),
  s.status, true
from seed_jobs s
on conflict (slug) do nothing;