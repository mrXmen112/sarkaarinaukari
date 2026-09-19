-- ============================================================================
-- Seed data — Phase 14: syllabus entries for the 42 exams added in 0010.
--
-- The 0010 migration added 42 exams with syb_slug: null (no syllabus link).
-- This migration creates syllabus entries and links them to each exam.
--
-- Run:  supabase db push
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Syllabus entries (Stage 1: SSC, IBPS, Banking, RBI)
-- ---------------------------------------------------------------------------
insert into public.syllabus (slug, exam_name, stage, subjects) values
  ('ssc-chsl-tier-1', 'SSC CHSL Tier 1', 'tier-1',
   '[{"subject":"General Intelligence & Reasoning","topics":["Analogies","Series","Coding-Decoding","Directions","Puzzles"]},{"subject":"General Awareness","topics":["Current Affairs","History","Geography","Polity","Science"]},{"subject":"Quantitative Aptitude","topics":["Simplification","Percentage","Ratio","Algebra","Geometry"]},{"subject":"English Language","topics":["Reading Comprehension","Fill in the Blanks","Error Spotting","Vocabulary","Grammar"]}]'::jsonb),
  ('ssc-mts', 'SSC MTS', 'cbt',
   '[{"subject":"Numerical & Mathematical Ability","topics":["Number System","Percentage","Ratio","Time & Distance"]},{"subject":"Reasoning Ability & Problem Solving","topics":["Analogies","Classification","Directions"]},{"subject":"General Awareness","topics":["Current Affairs","History","Science"]},{"subject":"English / Hindi Language","topics":["Grammar","Vocabulary","Comprehension"]}]'::jsonb),
  ('ssc-cpo', 'SSC CPO', 'tier-1',
   '[{"subject":"General Intelligence & Reasoning","topics":["Puzzles","Syllogism","Coding-Decoding","Inequalities"]},{"subject":"General Knowledge & Awareness","topics":["Current Affairs","Polity","History","Science"]},{"subject":"Quantitative Aptitude","topics":["Arithmetic","Algebra","Geometry","Data Interpretation"]},{"subject":"English Comprehension","topics":["Reading Comprehension","Vocabulary","Grammar"]}]'::jsonb),
  ('ssc-je', 'SSC JE', 'paper-1',
   '[{"subject":"General Intelligence & Reasoning","topics":["Analogies","Directions","Blood Relations"]},{"subject":"General Awareness","topics":["Current Affairs","Science & Technology"]},{"subject":"Technical Subject","topics":["Civil/Electrical/Mechanical Engineering Core Subjects"]}]'::jsonb),
  ('ssc-stenographer', 'SSC Stenographer Grade C & D', 'cbt',
   '[{"subject":"General Intelligence & Reasoning","topics":["Analogies","Directions","Coding-Decoding"]},{"subject":"General Awareness","topics":["Current Affairs","History","Science"]},{"subject":"English Language & Comprehension","topics":["Grammar","Vocabulary","Reading Comprehension"]}]'::jsonb),
  ('ibps-clerk', 'IBPS Clerk', 'prelims',
   '[{"subject":"English Language","topics":["Reading Comprehension","Cloze Test","Error Spotting"]},{"subject":"Quantitative Aptitude","topics":["Simplification","Data Interpretation","Number Series"]},{"subject":"Reasoning Ability","topics":["Puzzles & Seating","Syllogism","Coding-Decoding"]}]'::jsonb),
  ('ibps-rrb', 'IBPS RRB', 'prelims',
   '[{"subject":"Reasoning","topics":["Puzzles","Syllogism","Coding-Decoding"]},{"subject":"Numerical Ability","topics":["Simplification","DI","Number Series"]},{"subject":"English / Hindi","topics":["Reading Comprehension","Vocabulary"]}]'::jsonb),
  ('sbi-po', 'SBI PO', 'prelims',
   '[{"subject":"English Language","topics":["Reading Comprehension","Cloze Test","Error Spotting"]},{"subject":"Quantitative Aptitude","topics":["Simplification","Data Interpretation","Number Series"]},{"subject":"Reasoning Ability","topics":["Puzzles & Seating","Syllogism","Coding-Decoding"]}]'::jsonb),
  ('sbi-clerk', 'SBI Clerk', 'prelims',
   '[{"subject":"English Language","topics":["Reading Comprehension","Cloze Test"]},{"subject":"Quantitative Aptitude","topics":["Simplification","DI","Number Series"]},{"subject":"Reasoning Ability","topics":["Puzzles","Syllogism","Coding-Decoding"]}]'::jsonb),
  ('rbi-grade-b', 'RBI Grade B', 'phase-1',
   '[{"subject":"General Awareness","topics":["Current Affairs","Economy","Banking Awareness"]},{"subject":"English Language","topics":["Reading Comprehension","Vocabulary","Grammar"]},{"subject":"Quantitative Aptitude","topics":["Simplification","Data Interpretation","Number Series"]},{"subject":"Reasoning","topics":["Puzzles","Syllogism","Coding-Decoding"]}]'::jsonb),
  ('rbi-assistant', 'RBI Assistant', 'prelims',
   '[{"subject":"English Language","topics":["Reading Comprehension","Vocabulary"]},{"subject":"Numeric Ability","topics":["Simplification","Data Interpretation"]},{"subject":"Reasoning Ability","topics":["Puzzles","Coding-Decoding"]},{"subject":"General Awareness","topics":["Banking Awareness","Current Affairs"]},{"subject":"Computer Knowledge","topics":["Basic Computer Operations","MS Office","Internet"]}]'::jsonb),
  ('nabard-grade-a', 'NABARD Grade A', 'phase-1',
   '[{"subject":"Reasoning Ability","topics":["Puzzles","Syllogism","Coding-Decoding"]},{"subject":"English Language","topics":["Reading Comprehension","Vocabulary"]},{"subject":"Quantitative Aptitude","topics":["Simplification","Data Interpretation","Number Series"]}]'::jsonb),
  ('sebi-grade-a', 'SEBI Grade A', 'phase-1',
   '[{"subject":"Quantitative Aptitude","topics":["Statistics","Probability","Data Interpretation"]},{"subject":"Reasoning Ability","topics":["Logical Reasoning","Analytical Reasoning"]},{"subject":"English Language","topics":["Reading Comprehension","Vocabulary"]},{"subject":"General Awareness","topics":["Capital Markets","Securities Laws"]}]'::jsonb),
  ('rrb-ntpc', 'RRB NTPC', 'cbt-1',
   '[{"subject":"General Awareness","topics":["Current Affairs","History","Science"]},{"subject":"Mathematics","topics":["Number System","Percentage","Ratio"]},{"subject":"General Intelligence & Reasoning","topics":["Analogies","Directions"]}]'::jsonb),
  ('rrb-alp', 'RRB ALP', 'cbt-1',
   '[{"subject":"Mathematics","topics":["Arithmetic","Algebra"]},{"subject":"General Intelligence & Reasoning","topics":["Analogies","Directions"]},{"subject":"General Science","topics":["Physics","Chemistry"]},{"subject":"General Awareness","topics":["Current Affairs","Railway Knowledge"]}]'::jsonb),
   ('rrb-je', 'RRB JE', 'cbt-1',
    '[{"subject":"Mathematics","topics":["Arithmetic","Algebra"]},{"subject":"General Intelligence & Reasoning","topics":["Analogies","Directions"]},{"subject":"General Science","topics":["Physics","Chemistry"]},{"subject":"General Awareness","topics":["Current Affairs","Science"]}]'::jsonb),

-- ---------------------------------------------------------------------------
-- Syllabus entries (Stage 2: Defence, Teaching, State PSC, Other)
-- ---------------------------------------------------------------------------
  ('rrb-technician', 'RRB Technician', 'cbt-1',
   '[{"subject":"Mathematics","topics":["Arithmetic","Algebra"]},{"subject":"General Intelligence & Reasoning","topics":["Analogies","Directions"]},{"subject":"General Science","topics":["Physics","Chemistry"]},{"subject":"Technical Ability","topics":["Trade-specific topics"]}]'::jsonb),
  ('upsc-nda', 'UPSC NDA & NA', 'written',
   '[{"subject":"Mathematics","topics":["Algebra","Trigonometry","Calculometry","Geometry"]},{"subject":"General Ability","topics":["English","General Knowledge (Science, History, Geography, Current Events)"]}]'::jsonb),
  ('upsc-cds', 'UPSC CDS', 'written',
   '[{"subject":"English","topics":["Grammar","Vocabulary","Comprehension"]},{"subject":"General Knowledge","topics":["History","Geography","Polity","Science","Current Affairs"]},{"subject":"Elementary Mathematics","topics":["Arithmetic","Algebra","Geometry"]}]'::jsonb),
  ('afcat', 'AFCAT', 'written',
   '[{"subject":"General Awareness, Verbal Ability, Numerical Ability, Reasoning & Military Aptitude","topics":["Current Affairs","Military Knowledge","Reasoning","Numerical Ability"]},{"subject":"EKT (Engineering Knowledge Test)","topics":["Engineering Fundamentals"]}]'::jsonb),
  ('agniveer', 'Agniveer', 'cee',
   '[{"subject":"Mathematics","topics":["Arithmetic","Algebra"]},{"subject":"General Knowledge","topics":["Current Affairs","History","Science"]},{"subject":"English / Regional Language","topics":["Grammar","Vocabulary"]}]'::jsonb),
  ('upsc-capf', 'UPSC CAPF', 'paper-1',
   '[{"subject":"General Studies & Mental Ability","topics":["History","Geography","Polity","Economy","Science & Technology"]},{"subject":"English Comprehension & Precis","topics":["Reading Comprehension","Precis Writing"]}]'::jsonb),
  ('ctet', 'CTET', 'paper-i',
   '[{"subject":"Child Development & Pedagogy","topics":["Child Development","Pedagogical Issues"]},{"subject":"Language I","topics":["Language Comprehension","Pedagogy"]},{"subject":"Language II","topics":["Language Comprehension","Pedagogy"]},{"subject":"Mathematics","topics":["Number System","Arithmetic","Geometry"]},{"subject":"Environmental Studies","topics":["EVS Concepts","Pedagogy"]}]'::jsonb),
  ('kvs-recruitment', 'KVS Recruitment', 'cbt',
   '[{"subject":"Subject Concerned","topics":["Subject-specific topics"]},{"subject":"Professional Competency & General Awareness","topics":["Pedagogy","Current Affairs"]}]'::jsonb),
  ('nvs-recruitment', 'NVS Recruitment', 'cbt',
   '[{"subject":"Subject Concerned","topics":["Subject-specific topics"]},{"subject":"Reasoning","topics":["Logical Reasoning"]},{"subject":"General Awareness","topics":["Current Affairs"]},{"subject":"Teaching Aptitude","topics":["Pedagogy"]}]'::jsonb),
  ('ugc-net', 'UGC NET', 'paper-1',
   '[{"subject":"Teaching, Research, Reasoning, Comprehension, DI, ICT, People, Environment, Higher Education","topics":["Pedagogy","Research Methodology","Comprehension","Data Interpretation","ICT","Environmental Issues"]}]'::jsonb),
  ('uppsc-pcs', 'UPPSC PCS', 'prelims',
   '[{"subject":"General Studies","topics":["History","Geography","Polity","Economy","Science & Technology"]},{"subject":"General Aptitude / CSAT","topics":["Comprehension","Interpersonal Skills","Logical Reasoning"]}]'::jsonb),
  ('mppsc-state-services', 'MPPSC State Services', 'prelims',
   '[{"subject":"General Studies","topics":["History","Geography","Polity","Economy","Science"]},{"subject":"General Aptitude","topics":["Logical Reasoning","Comprehension"]}]'::jsonb),
  ('rpsc-ras', 'RPSC RAS', 'prelims',
   '[{"subject":"General Knowledge & General Science","topics":["History","Geography","Polity","Economy","Science"]},{"subject":"Rajasthan State GK","topics":["History","Culture","Geography","Economy"]}]'::jsonb),
  ('wbpcs', 'WBCS', 'prelims',
   '[{"subject":"General Studies","topics":["History","Geography","Polity","Economy","Science"]},{"subject":"General English / Hindi","topics":["Comprehension","Writing"]}]'::jsonb),
  ('jpsc-ccs', 'JPSC Combined Civil Services', 'prelims',
   '[{"subject":"General Studies (Paper I)","topics":["History","Geography","Polity","Economy"]},{"subject":"General Studies (Paper II - CSAT)","topics":["Comprehension","Logical Reasoning"]}]'::jsonb),
  ('hpsc-hcs', 'HPSC HCS', 'prelims',
   '[{"subject":"General Studies + Aptitude","topics":["History","Geography","Polity","Economy","Science"]}]'::jsonb),
  ('appsc-group-1', 'APPSC Group 1 & 2', 'prelims',
   '[{"subject":"Paper I - General Studies","topics":["History","Geography","Polity","Economy"]},{"subject":"Paper II - Aptitude & Mental Ability","topics":["Reasoning","Mathematics"]}]'::jsonb),
  ('tnpsc-group-2', 'TNPSC Group II', 'paper-i',
   '[{"subject":"Tamil (qualifying)","topics":["Tamil Language Proficiency"]},{"subject":"General Studies","topics":["History","Geography","Polity","Economy"]},{"subject":"Aptitude & Mental Ability","topics":["Reasoning","Mathematics"]}]'::jsonb),
  ('kpsc-kas', 'KPSC KAS', 'prelims',
   '[{"subject":"Paper I - General Studies","topics":["History","Geography","Polity","Economy"]},{"subject":"Paper II - General Studies","topics":["Current Affairs","Science"]}]'::jsonb),
  ('gpsc-class-1', 'GPSC Class 1 & 2', 'prelims',
   '[{"subject":"Paper I - General Studies","topics":["History","Geography","Polity","Economy"]},{"subject":"Paper II - General Studies","topics":["Current Affairs","Science"]}]'::jsonb),
  ('esic-recruitment', 'ESIC Recruitment', 'cbt',
   '[{"subject":"Reasoning, Quantitative Aptitude, General Awareness, English, Computer Knowledge","topics":["Aptitude","General Knowledge","English","Computer Basics"]}]'::jsonb),
  ('epfo-recruitment', 'EPFO Recruitment', 'phase-1',
   '[{"subject":"Reasoning","topics":["Logical Reasoning"]},{"subject":"Quantitative Aptitude","topics":["Arithmetic","Data Interpretation"]},{"subject":"English","topics":["Reading Comprehension","Vocabulary"]}]'::jsonb),
  ('gate-2026', 'GATE', 'cbt',
   '[{"subject":"General Aptitude","topics":["Quantitative Aptitude","Verbal Ability"]},{"subject":"Subject Paper","topics":["Core Engineering Subjects"]}]'::jsonb),
  ('ib-security-exam', 'IB Security Exam', 'written',
   '[{"subject":"General Awareness, Reasoning, Numerical Ability, English/Hindi","topics":["Current Affairs","Reasoning","Numerical Ability"]}]'::jsonb),
  ('up-police-si-exam', 'UP Police SI', 'cbt',
   '[{"subject":"General Knowledge & General Hindi","topics":["Current Affairs","Hindi Nibandh"]},{"subject":"Numerical Ability & Reasoning","topics":["Arithmetic","Logical Reasoning"]}]'::jsonb),
  ('up-police-constable-exam', 'UP Police Constable', 'cbt',
   '[{"subject":"General Knowledge, General Hindi, Numerical & Mental Ability, Reasoning","topics":["Current Affairs","Hindi","Arithmetic","Reasoning"]}]'::jsonb)
on conflict (slug) do update
  set exam_name = excluded.exam_name, stage = excluded.stage, subjects = excluded.subjects;

-- ---------------------------------------------------------------------------
-- Link exams to their new syllabus entries
-- ---------------------------------------------------------------------------
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'ssc-chsl-tier-1') where slug = 'ssc-chsl';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'ssc-mts') where slug = 'ssc-mts';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'ssc-cpo') where slug = 'ssc-cpo';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'ssc-je') where slug = 'ssc-je';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'ssc-stenographer') where slug = 'ssc-stenographer';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'ibps-clerk') where slug = 'ibps-clerk';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'ibps-rrb') where slug = 'ibps-rrb';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'sbi-po') where slug = 'sbi-po';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'sbi-clerk') where slug = 'sbi-clerk';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'rbi-grade-b') where slug = 'rbi-grade-b';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'rbi-assistant') where slug = 'rbi-assistant';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'nabard-grade-a') where slug = 'nabard-grade-a';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'sebi-grade-a') where slug = 'sebi-grade-a';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'rrb-ntpc') where slug = 'rrb-ntpc';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'rrb-alp') where slug = 'rrb-alp';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'rrb-je') where slug = 'rrb-je';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'rrb-technician') where slug = 'rrb-technician';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'upsc-nda') where slug = 'upsc-nda';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'upsc-cds') where slug = 'upsc-cds';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'afcat') where slug = 'afcat';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'agniveer') where slug = 'agniveer';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'upsc-capf') where slug = 'upsc-capf';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'ctet') where slug = 'ctet';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'kvs-recruitment') where slug = 'kvs-recruitment';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'nvs-recruitment') where slug = 'nvs-recruitment';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'ugc-net') where slug = 'ugc-net';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'uppsc-pcs') where slug = 'uppsc-pcs';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'mppsc-state-services') where slug = 'mppsc-state-services';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'rpsc-ras') where slug = 'rpsc-ras';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'wbpcs') where slug = 'wbpcs';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'jpsc-ccs') where slug = 'jpsc-ccs';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'hpsc-hcs') where slug = 'hpsc-hcs';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'appsc-group-1') where slug = 'appsc-group-1';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'tnpsc-group-2') where slug = 'tnpsc-group-2';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'kpsc-kas') where slug = 'kpsc-kas';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'gpsc-class-1') where slug = 'gpsc-class-1';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'esic-recruitment') where slug = 'esic-recruitment';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'epfo-recruitment') where slug = 'epfo-recruitment';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'gate-2026') where slug = 'gate-2026';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'ib-security-exam') where slug = 'ib-security-exam';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'up-police-si-exam') where slug = 'up-police-si-exam';
update public.exams set syllabus_id = (select id from public.syllabus where slug = 'up-police-constable-exam') where slug = 'up-police-constable-exam';
