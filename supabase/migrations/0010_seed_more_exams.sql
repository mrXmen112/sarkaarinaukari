-- ============================================================================
-- Seed data — Phase 10: comprehensive exam coverage (42 major exams).
--
-- Same JSONB payload pattern as 0007_seed_exams.sql. New rows are INSERTed
-- with `on conflict (slug) do nothing` so re-running is safe. Existing rows
-- (ssc-cgl, bpsc-70th, ibps-po, ssc-gd, rrb-group-d, upsc-cse) are left as-is.
--
-- Run:  supabase db push
-- ============================================================================

insert into public.exams (
  name, slug, short_name, conducting_body, overview, eligibility, exam_pattern,
  syllabus_id, preparation_strategy, is_published
)
select
  v.name, v.slug, v.short_name, v.conducting_body, v.overview, v.eligibility,
  v.exam_pattern, (select id from public.syllabus where slug = v.syb_slug),
  v.preparation_strategy, true
from jsonb_to_recordset(
-- JSONBEGIN
'[
  {
    "name": "SSC CHSL (10+2) 2026", "slug": "ssc-chsl", "short_name": "SSC CHSL",
    "conducting_body": "Staff Selection Commission (SSC)",
    "overview": "Combined Higher Secondary Level examination for recruitment to Lower Division Clerk, Data Entry Operator, Postal Assistant, Sorting Assistant, Court Clerk and DEO positions across central government offices and departments.",
    "eligibility": "12th pass from a recognised board. Age 18-27 years with category-wise age relaxation.",
    "exam_pattern": [
      {"stage":"Tier 1 (CBT)","mode":"Computer Based","subjects":[{"name":"General Intelligence & Reasoning","questions":25,"marks":50},{"name":"General Awareness","questions":25,"marks":50},{"name":"Quantitative Aptitude","questions":25,"marks":50},{"name":"English Language","questions":25,"marks":50}],"total_questions":100,"total_marks":200,"duration":"60 minutes","negative_marking":"0.50 per wrong answer"},
      {"stage":"Tier 2 (Descriptive)","mode":"Pen & Paper","subjects":[{"name":"Essay / Letter / Application","questions":1,"marks":100}],"duration":"60 minutes","negative_marking":"No"}
    ],
    "syb_slug": null,
    "preparation_strategy": "Tier 1 is an English-Hindi option exam except the English Language section. Practise daily mock tests to nail the 60-minute time limit and focus on high-accuracy scoring in General Awareness."
  },
  {
    "name": "SSC MTS (Multi Tasking Staff) 2026", "slug": "ssc-mts", "short_name": "SSC MTS",
    "conducting_body": "Staff Selection Commission (SSC)",
    "overview": "Recruitment of Multi Tasking Staff (non-gazetted, non-ministerial) across central government departments, ministries and offices, plus Havaldar posts in CBIC and CBN.",
    "eligibility": "10th pass from a recognised board. Age 18-25 years (relaxation for reserved categories).",
    "exam_pattern": [
      {"stage":"CBT","mode":"Computer Based","subjects":[{"name":"Numerical & Mathematical Ability","questions":20,"marks":60},{"name":"Reasoning Ability & Problem Solving","questions":20,"marks":60},{"name":"General Awareness","questions":20,"marks":60},{"name":"English / Hindi Language","questions":20,"marks":60}],"total_questions":80,"total_marks":240,"duration":"45 + 45 minutes (two sessions)","negative_marking":"1 mark per wrong answer"},
      {"stage":"Physical Test (Havaldar posts only)","mode":"Physical","negative_marking":"No"}
    ],
    "syb_slug": null,
    "preparation_strategy": "Aided by the new pattern where each subject carries 60 marks with 1-mark negative marking, accuracy matters more than speed. Practise section-wise to keep errors near zero."
  },
  {
    "name": "SSC CPO (Sub Inspector) 2026", "slug": "ssc-cpo", "short_name": "SSC CPO",
    "conducting_body": "Staff Selection Commission (SSC)",
    "overview": "Recruitment of Sub-Inspectors in Delhi Police and Central Armed Police Forces (CAPF) such as CISF, CRPF, BSF, SSB, ITBP and Assam Rifles.",
    "eligibility": "Graduate in any discipline from a recognised university. Age 20-25 years (relaxation applicable).",
    "exam_pattern": [
      {"stage":"Tier 1 (CBT)","mode":"Computer Based","subjects":[{"name":"General Intelligence & Reasoning","questions":50,"marks":50},{"name":"General Knowledge & Awareness","questions":50,"marks":50},{"name":"Quantitative Aptitude","questions":50,"marks":50},{"name":"English Comprehension","questions":50,"marks":50}],"total_questions":200,"total_marks":200,"duration":"2 hours","negative_marking":"0.25 per wrong answer"},
      {"stage":"Tier 2 (Descriptive)","mode":"Pen & Paper","subjects":[{"name":"English Writing Skill (Essay, Precis, Letter)","questions":3,"marks":200}],"duration":"90 minutes","negative_marking":"No"},
      {"stage":"Physical Standard / Efficiency Test","mode":"Physical","negative_marking":"No"}
    ],
    "syb_slug": null,
    "preparation_strategy": "General Knowledge is the highest-scoring section — cover static GK plus current affairs weekly. The physical test is compulsory for CAPF SIs, so prepare the running and race standards alongside written prep."
  },
  {
    "name": "SSC JE (Junior Engineer) 2026", "slug": "ssc-je", "short_name": "SSC JE",
    "conducting_body": "Staff Selection Commission (SSC)",
    "overview": "Recruitment of Junior Engineers (Civil / Electrical / Mechanical) for CPSUs, central government organisations and the Border Roads Organisation.",
    "eligibility": "Diploma or degree in Civil / Electrical / Mechanical Engineering. Age 18-32 years.",
    "exam_pattern": [
      {"stage":"Paper I (CBT)","mode":"Computer Based","subjects":[{"name":"General Intelligence & Reasoning","questions":50,"marks":50},{"name":"General Awareness","questions":50,"marks":50},{"name":"Technical Subject (Civil/Electrical/Mechanical)","questions":100,"marks":200}],"total_questions":200,"total_marks":300,"duration":"2 hours","negative_marking":"0.25 per wrong answer"},
      {"stage":"Paper II (CBT)","mode":"Computer Based","subjects":[{"name":"Technical Subject","questions":100,"marks":300}],"duration":"2 hours","negative_marking":"0.25 per wrong answer"}
    ],
    "syb_slug": null,
    "preparation_strategy": "Technical sections carry 2/3rd of the total weight. Revise core engineering subjects from your diploma/degree syllabus and solve previous years'' papers for the pattern."
  },
  {
    "name": "SSC Stenographer Grade C & D 2026", "slug": "ssc-stenographer", "short_name": "SSC Steno",
    "conducting_body": "Staff Selection Commission (SSC)",
    "overview": "Recruitment of Stenographers Grade C & D in ministries, departments and statutory bodies of the central government.",
    "eligibility": "10th / 12th pass as per post (Grade C: 12th; Grade D: 10th). Age 18-27 years.",
    "exam_pattern": [
      {"stage":"CBT (Written)","mode":"Computer Based","subjects":[{"name":"General Intelligence & Reasoning","questions":50,"marks":50},{"name":"General Awareness","questions":50,"marks":50},{"name":"English Language & Comprehension","questions":100,"marks":100}],"total_questions":200,"total_marks":200,"duration":"2 hours","negative_marking":"0.25 per wrong answer"},
      {"stage":"Skill Test (Shorthand)","mode":"Skill","notes":"Dictation at 100 wpm (Grade C) / 80 wpm (Grade D) for 10 minutes","negative_marking":"No"}
    ],
    "syb_slug": null,
    "preparation_strategy": "Shorthand is the final differentiator — practise 10-minute dictation daily at the required speed and transcribe within 50 minutes. Focus on English language section in CBT."
  },
  {
    "name": "IBPS Clerk (CRP 17) 2026", "slug": "ibps-clerk", "short_name": "IBPS Clerk",
    "conducting_body": "Institute of Banking Personnel Selection (IBPS)",
    "overview": "Recruitment of Clerical cadre staff in participating public sector banks across India through a two-stage online examination.",
    "eligibility": "Graduate in any discipline from a recognised university. Age 20-28 years.",
    "exam_pattern": [
      {"stage":"Prelims","mode":"Online CBT","subjects":[{"name":"English Language","questions":30,"marks":30},{"name":"Quantitative Aptitude","questions":35,"marks":35},{"name":"Reasoning Ability","questions":35,"marks":35}],"total_questions":100,"total_marks":100,"duration":"60 minutes","negative_marking":"0.25 per wrong answer"},
      {"stage":"Mains","mode":"Online CBT","subjects":[{"name":"English Language","questions":50,"marks":50},{"name":"Quantitative Aptitude","questions":50,"marks":60},{"name":"General / Financial Awareness","questions":50,"marks":50},{"name":"Reasoning Ability & Computer Aptitude","questions":50,"marks":60}],"total_questions":200,"total_marks":220,"duration":"160 minutes","negative_marking":"0.25 per wrong answer"}
    ],
    "syb_slug": null,
    "preparation_strategy": "Faster than the PO exam — practise 100 questions in 60 minutes with a section-wise cutoff mindset. Financial Awareness is scoreable; read a static banking primer plus weekly current affairs."
  },
  {
    "name": "IBPS RRB (PO & Clerk) 2026", "slug": "ibps-rrb", "short_name": "IBPS RRB",
    "conducting_body": "Institute of Banking Personnel Selection (IBPS)",
    "overview": "Recruitment of Officers (Scale I) and Office Assistants (Multipurpose) in Regional Rural Banks through the CRP RRBs examination.",
    "eligibility": "Graduate for Officer posts; 12th pass for Office Assistant. Age for Officer: 18-30 years; Office Assistant: 18-28 years.",
    "exam_pattern": [
      {"stage":"Prelims","mode":"Online CBT","subjects":[{"name":"Reasoning","questions":40,"marks":40},{"name":"Numerical Ability","questions":40,"marks":40},{"name":"English / Hindi (OA only)","questions":40,"marks":40}],"total_questions":120,"total_marks":120,"duration":"45 minutes","negative_marking":"0.25 per wrong answer"},
      {"stage":"Mains","mode":"Online CBT","subjects":[{"name":"Reasoning & Computer Aptitude","marks":50},{"name":"Data Interpretation","marks":50},{"name":"General / Financial Awareness","marks":40},{"name":"English / Hindi (OA only)","marks":40}],"negative_marking":"0.25 per wrong answer"}
    ],
    "syb_slug": null,
    "preparation_strategy": "RRB papers are slightly easier than IBPS PO/Clerk but attract enormous competition. Master calculation speed and the regional banking domain knowledge."
  },
  {
    "name": "SBI PO 2026", "slug": "sbi-po", "short_name": "SBI PO",
    "conducting_body": "State Bank of India (SBI)",
    "overview": "Recruitment of Probationary Officers in SBI, the largest public sector bank in India, through a three-stage Selection Process.",
    "eligibility": "Graduate in any discipline from a recognised university. Age 21-30 years.",
    "exam_pattern": [
      {"stage":"Prelims","mode":"Online CBT","subjects":[{"name":"English Language","questions":30,"marks":30},{"name":"Quantitative Aptitude","questions":35,"marks":35},{"name":"Reasoning Ability","questions":35,"marks":35}],"total_questions":100,"total_marks":100,"duration":"60 minutes","negative_marking":"0.25 per wrong answer"},
      {"stage":"Mains","mode":"Online CBT","subjects":[{"name":"Reasoning & Computer Aptitude","marks":60},{"name":"Data Analysis & Interpretation","marks":60},{"name":"English Language","marks":40},{"name":"General / Economy / Banking Awareness","marks":40},{"name":"Descriptive (Letter & Essay)","marks":50}],"negative_marking":"0.25 per wrong answer for objective"},
      {"stage":"Interview + Group Exercise","mode":"Personal","negative_marking":"No"}
    ],
    "syb_slug": null,
    "preparation_strategy": "Mains data interpretation is the toughest paper of any bank PO exam. Practise high-speed calculation drills and complex DI sets, then prepare the descriptive paper and current banking awareness."
  },
  {
    "name": "SBI Clerk (Junior Associate) 2026", "slug": "sbi-clerk", "short_name": "SBI Clerk",
    "conducting_body": "State Bank of India (SBI)",
    "overview": "Recruitment of Junior Associates (Customer Support & Sales) in SBI branches across India through a two-phase online examination.",
    "eligibility": "Graduate in any discipline. Age 20-28 years (relaxation for reserved categories).",
    "exam_pattern": [
      {"stage":"Prelims","mode":"Online CBT","subjects":[{"name":"English Language","questions":30,"marks":30},{"name":"Quantitative Aptitude","questions":35,"marks":35},{"name":"Reasoning Ability","questions":35,"marks":35}],"total_questions":100,"total_marks":100,"duration":"60 minutes","negative_marking":"0.25 per wrong answer"},
      {"stage":"Mains","mode":"Online CBT","subjects":[{"name":"General / Financial Awareness","questions":50,"marks":50},{"name":"General English","questions":40,"marks":40},{"name":"Quantitative Aptitude","questions":50,"marks":60},{"name":"Reasoning Ability & Computer Aptitude","questions":50,"marks":60}],"total_questions":190,"total_marks":200,"duration":"160 minutes","negative_marking":"0.25 per wrong answer"}
    ],
    "syb_slug": null,
    "preparation_strategy": "The Mains paper carries sectional cutoffs. Lock the high-scoring Financial Awareness and English sections first, then push your quant and reasoning accuracy."
  },
  {
    "name": "RBI Grade B 2026", "slug": "rbi-grade-b", "short_name": "RBI Grade B",
    "conducting_body": "Reserve Bank of India (RBI)",
    "overview": "Recruitment of Officers Grade B (General / DR) for the central bank of India. The exam is known for its descriptive Phase-2 and very low selection ratio.",
    "eligibility": "Graduate in any discipline with at least 60% marks (55% for SC/ST/PwBD). Age 21-30 years (relaxation for reserved categories).",
    "exam_pattern": [
      {"stage":"Phase 1 (Prelims)","mode":"Online CBT","subjects":[{"name":"General Awareness","questions":80,"marks":100},{"name":"English Language","questions":30,"marks":30},{"name":"Quantitative Aptitude","questions":30,"marks":30},{"name":"Reasoning","questions":60,"marks":60}],"total_questions":200,"total_marks":200,"duration":"120 minutes","negative_marking":"0.25 per wrong answer"},
      {"stage":"Phase 2 (Mains)","mode":"Online + Descriptive","subjects":[{"name":"Economics & Social Issues","marks":100},{"name":"English (Writing Skills)","marks":100},{"name":"Finance & Management","marks":100}],"negative_marking":"0.25 per wrong answer in objective"},
      {"stage":"Interview","mode":"Personal","negative_marking":"No"}
    ],
    "syb_slug": null,
    "preparation_strategy": "Phase 2 descriptive writing is the real game — practise structured essays on economics, finance and social issues. Clear everyday newspaper reading for 6 months before attempting this paper."
  },
  {
    "name": "RBI Assistant 2026", "slug": "rbi-assistant", "short_name": "RBI Assistant",
    "conducting_body": "Reserve Bank of India (RBI)",
    "overview": "Recruitment of Assistants for clerical level work in RBI offices across India.",
    "eligibility": "Graduate in any discipline. Age 20-28 years.",
    "exam_pattern": [
      {"stage":"Prelims","mode":"Online CBT","subjects":[{"name":"English Language","questions":30,"marks":30},{"name":"Numeric Ability","questions":35,"marks":35},{"name":"Reasoning Ability","questions":35,"marks":35}],"total_questions":100,"total_marks":100,"duration":"60 minutes","negative_marking":"0.25 per wrong answer"},
      {"stage":"Mains","mode":"Online CBT","subjects":[{"name":"Reasoning Ability","questions":40,"marks":40},{"name":"English Language","questions":40,"marks":40},{"name":"Quantitative Aptitude","questions":40,"marks":40},{"name":"General Awareness","questions":40,"marks":40},{"name":"Computer Knowledge","questions":40,"marks":40}],"total_questions":200,"total_marks":200,"duration":"135 minutes","negative_marking":"0.25 per wrong answer"}
    ],
    "syb_slug": null,
    "preparation_strategy": "A competitive but achievable exam. Balanced accuracy across five Mains sections is key; Computer Knowledge is an easy full-marks section."
  },
  {
    "name": "NABARD Grade A 2026", "slug": "nabard-grade-a", "short_name": "NABARD Grade A",
    "conducting_body": "National Bank for Agriculture and Rural Development (NABARD)",
    "overview": "Recruitment of Assistant Managers in NABARD for the development financial institution supporting rural India and agriculture finance.",
    "eligibility": "Graduate in Agriculture, Engineering, Economics, Finance or related stream with 60% marks. Age 21-30 years.",
    "exam_pattern": [
      {"stage":"Phase 1 (Prelims)","mode":"Online CBT","subjects":[{"name":"Reasoning Ability","questions":40,"marks":40},{"name":"English Language","questions":40,"marks":40},{"name":"Quantitative Aptitude","questions":40,"marks":40}],"total_questions":120,"total_marks":120,"duration":"90 minutes","negative_marking":"0.25 per wrong answer"},
      {"stage":"Phase 2 (Mains)","mode":"Online + Descriptive","subjects":[{"name":"General & Development Awareness","marks":50},{"name":"Agriculture & Rural Development","marks":50},{"name":"Economics / Engineering / Other Specialist","marks":100},{"name":"Descriptive Test","marks":100}],"negative_marking":"0.25 per wrong answer in objective"},
      {"stage":"Interview","mode":"Personal","negative_marking":"No"}
    ],
    "syb_slug": null,
    "preparation_strategy": "Deep knowledge of agriculture, rural development schemes and RBI/NABARD functions is essential. Follow the annual RBI report and NABARD''s publications closely."
  },
  {
    "name": "SEBI Grade A 2026", "slug": "sebi-grade-a", "short_name": "SEBI Grade A",
    "conducting_body": "Securities and Exchange Board of India (SEBI)",
    "overview": "Recruitment of Officers Grade A in the regulatory body for India''s securities and commodity markets.",
    "eligibility": "Graduate or PG in Law, Engineering, Finance, Economics, Commerce or relevant streams. Age 21-30 years.",
    "exam_pattern": [
      {"stage":"Phase 1","mode":"Online CBT","subjects":[{"name":"Quantitative Aptitude","marks":50},{"name":"Reasoning Ability","marks":50},{"name":"English Language","marks":50},{"name":"General Awareness","marks":50}],"negative_marking":"0.25 per wrong answer"},
      {"stage":"Phase 2","mode":"Online + Descriptive","subjects":[{"name":"Multiple Choice on Specialisation","marks":100},{"name":"Descriptive (English)","marks":100}],"negative_marking":"0.25 per wrong answer in objective"},
      {"stage":"Interview","mode":"Personal","negative_marking":"No"}
    ],
    "syb_slug": null,
    "preparation_strategy": "The specialist paper is deciding — master capital markets, securities laws (SEBI regulations) and financial markets. Phase 2 has a high negative marking so precision matters."
  },
  {
    "name": "RRB NTPC (Graduate & Under-Graduate) 2026", "slug": "rrb-ntpc", "short_name": "RRB NTPC",
    "conducting_body": "Railway Recruitment Board (RRB)",
    "overview": "Recruitment of Non-Technical Popular Categories (NTPC) — Station Master, Goods Guard, Traffic Apprentice and various cler occupations across Indian Railways.",
    "eligibility": "Graduate for most posts; 12th pass for under-graduate categories. Age 18-33 years as per post.",
    "exam_pattern": [
      {"stage":"CBT 1 (Screening)","mode":"Computer Based","subjects":[{"name":"General Awareness","questions":40,"marks":40},{"name":"Mathematics","questions":30,"marks":30},{"name":"General Intelligence & Reasoning","questions":30,"marks":30}],"total_questions":100,"total_marks":100,"duration":"90 minutes","negative_marking":"1/3rd per wrong answer"},
      {"stage":"CBT 2 (CEN Level 2/5/6)","mode":"Computer Based","subjects":[{"name":"General Awareness","questions":50,"marks":50},{"name":"Mathematics","questions":35,"marks":35},{"name":"General Intelligence & Reasoning","questions":35,"marks":35},{"name":"General Science","questions":30,"marks":30}],"negative_marking":"1/3rd per wrong answer"},
      {"stage":"Typing / Aptitude Skill Test + DV","mode":"Skill","negative_marking":"No"}
    ],
    "syb_slug": null,
    "preparation_strategy": "CBT 1 is a screening shortlist into CBT 2, so aim for the 4x category cutoff. General Awareness about railways and current affairs is a consistent scorer across both stages."
  },
  {
    "name": "RRB ALP (Assistant Loco Pilot) 2026", "slug": "rrb-alp", "short_name": "RRB ALP",
    "conducting_body": "Railway Recruitment Board (RRB)",
    "overview": "Recruitment of Assistant Loco Pilots and Technicians for the loco and rolling stock departments of Indian Railways.",
    "eligibility": "10th pass + ITI in relevant trade, or diploma. Related apprenticeship experience for ALP candidates. Age 18-30 years.",
    "exam_pattern": [
      {"stage":"CBT 1","mode":"Computer Based","subjects":[{"name":"Mathematics","marks":20},{"name":"General Intelligence & Reasoning","marks":20},{"name":"General Science","marks":20},{"name":"General Awareness & Current Affairs","marks":20}],"total_marks":100,"duration":"60 minutes","negative_marking":"1/3rd per wrong answer"},
      {"stage":"CBT 2 (Part A + B)","mode":"Computer Based","subjects":[{"name":"Knowledge of Pertaining to Trade","marks":175},{"name":"General / Reasoning / Maths / Science / Current Affairs","marks":25}],"negative_marking":"No for Part A - apply 1/3rd only in Part B"},
      {"stage":"Psychometric Aptitude Test + DV","mode":"Skill","negative_marking":"No"}
    ],
    "syb_slug": null,
    "preparation_strategy": "CBT 2 Part A (Trade) dominates — go deep into the loco trade syllabus. Eke out the MBT/railway knowledge and prepare for some unique question styles."
  },
  {
    "name": "RRB JE (Junior Engineer) 2026", "slug": "rrb-je", "short_name": "RRB JE",
    "conducting_body": "Railway Recruitment Board (RRB)",
    "overview": "Recruitment of Junior Engineers, Depot Material Superintendents, Chemical & Metallurgical Assistants in various railway zones and departments.",
    "eligibility": "Diploma/Degree in relevant engineering stream. Age 18-33 years with category relaxation.",
    "exam_pattern": [
      {"stage":"CBT 1","mode":"Computer Based","subjects":[{"name":"Mathematics","questions":30,"marks":30},{"name":"General Intelligence & Reasoning","questions":25,"marks":25},{"name":"General Awareness","questions":25,"marks":25},{"name":"General Science","questions":20,"marks":20}],"negative_marking":"1/3rd per wrong answer"},
      {"stage":"CBT 2","mode":"Computer Based","subjects":[{"name":"General Awareness","questions":25,"marks":25},{"name":"General Intelligence & Reasoning","questions":25,"marks":25},{"name":"General Science","questions":20,"marks":20},{"name":"Technical Ability","questions":100,"marks":100}],"negative_marking":"1/3rd per wrong answer"}
    ],
    "syb_slug": null,
    "preparation_strategy": "Technical Ability owns CBT 2 (100 marks of 170). Revise core engineering subjects and practise railway-specific numericals from previous papers."
  },
  {
    "name": "RRB Technician 2026", "slug": "rrb-technician", "short_name": "RRB Technician",
    "conducting_body": "Railway Recruitment Board (RRB)",
    "overview": "Recruitment of Technicians Grade III in various trades across Indian Railways under the CEN 07 notification.",
    "eligibility": "10th pass + ITI in relevant trade, or diploma in engineering. Age 18-33 years.",
    "exam_pattern": [
      {"stage":"CBT 1","mode":"Computer Based","subjects":[{"name":"Mathematics","questions":30,"marks":30},{"name":"General Intelligence & Reasoning","questions":25,"marks":25},{"name":"General Awareness","questions":25,"marks":25},{"name":"General Science","questions":20,"marks":20}],"negative_marking":"1/3rd per wrong answer"},
      {"stage":"CBT 2","mode":"Computer Based","subjects":[{"name":"General Awareness","questions":20,"marks":20},{"name":"General Intelligence & Reasoning","questions":20,"marks":20},{"name":"General Science","questions":20,"marks":20},{"name":"Technical Ability","questions":125,"marks":125}],"negative_marking":"1/3rd per wrong answer"}
    ],
    "syb_slug": null,
    "preparation_strategy": "Technical Ability carries the same dominant weight as RRB JE. Trade-specific revision and speed in non-technical sections are the winning formula."
  },
  {
    "name": "UPSC NDA & NA Examination", "slug": "upsc-nda", "short_name": "NDA & NA",
    "conducting_body": "Union Public Service Commission (UPSC)",
    "overview": "National Defence Academy and Naval Academy examination for entry into the Army, Navy and Air Force wings after 12th, followed by service training.",
    "eligibility": "12th pass for Army wing; 12th pass with Physics & Maths for Navy/Air Force wings. Age 16.5-19.5 years.",
    "exam_pattern": [
      {"stage":"Written (Mathematics)","mode":"Objective","subjects":[{"name":"Mathematics","questions":120,"marks":300}],"duration":"2.5 hours","negative_marking":"1/3rd per wrong answer"},
      {"stage":"Written (General Ability)","mode":"Objective","subjects":[{"name":"English","questions":50,"marks":200},{"name":"General Knowledge (Science, History, Geography, Current Events)","questions":100,"marks":400}],"duration":"2.5 hours","negative_marking":"1/3rd per wrong answer"},
      {"stage":"SSB Interview","mode":"Personal","total_marks":900,"negative_marking":"No"}
    ],
    "syb_slug": null,
    "preparation_strategy": "The written exam acts as a gate to the SSB, where personality is tested. Keep 12th-level maths sharp, cover General Ability broadly, and start SSB psychology & GTO preparation in advance."
  },
  {
    "name": "UPSC CDS Examination", "slug": "upsc-cds", "short_name": "CDS Exam",
    "conducting_body": "Union Public Service Commission (UPSC)",
    "overview": "Combined Defence Services examination for entry to Indian Military Academy, Naval Academy, Air Force Academy and Officers Training Academy.",
    "eligibility": "Graduate for IMA/AFA/NA; 12th pass for OTA. Age 19-25 years depending on academy.",
    "exam_pattern": [
      {"stage":"Written Exam","mode":"Objective","subjects":[{"name":"English","questions":120,"marks":100},{"name":"General Knowledge","questions":120,"marks":100},{"name":"Elementary Mathematics (NA/IMA/AFA only)","questions":100,"marks":100}],"negative_marking":"1/3rd per wrong answer"},
      {"stage":"SSB Interview","mode":"Personal","negative_marking":"No"}
    ],
    "syb_slug": null,
    "preparation_strategy": "The UPSC-style GK needs current affairs plus general studies depth. Excel English since it carries equal marks, then prepare the SSB stages thoroughly."
  },
  {
    "name": "AFCAT (Air Force Common Admission Test) 2026", "slug": "afcat", "short_name": "AFCAT",
    "conducting_body": "Indian Air Force (Air Force Selection Board)",
    "overview": "Common admission test for Flying Branch and Ground Duty (Technical & Non-Technical) branches of the Indian Air Force.",
    "eligibility": "Graduate degree with 60% marks (flying branch: 12th with PCM + graduate). Age 20-26 years as per branch.",
    "exam_pattern": [
      {"stage":"AFCAT Written","mode":"Online CBT","subjects":[{"name":"General Awareness, Verbal Ability, Numerical Ability, Reasoning & Military Aptitude","questions":100,"marks":300}],"duration":"2 hours","negative_marking":"1 mark per wrong answer"},
      {"stage":"EKT (Engineering Knowledge Test) for Technical","mode":"Online CBT","subjects":[{"name":"Engineering Knowledge","questions":50,"marks":150}],"negative_marking":"1 mark per wrong answer"},
      {"stage":"SSB Interview","mode":"Personal","negative_marking":"No"}
    ],
    "syb_slug": null,
    "preparation_strategy": "The written exam is comparatively easier than other defence exams, so aim for high scores. Prepare military aptitude and current affairs; engineers should also crack the EKT."
  },
  {
    "name": "Agniveer (Army / Navy / Air Force) 2026", "slug": "agniveer", "short_name": "Agniveer",
    "conducting_body": "Ministry of Defence (Indian Defence Forces)",
    "overview": "Agniveer recruitment scheme for four-year SHORT SERVICE commission into the Army, Navy or Air Force, with a retention path at the end of the tenure.",
    "eligibility": "10th / 12th pass as per trade (varies by service and post). Age 17.5-21 years.",
    "exam_pattern": [
      {"stage":"Written Examination (CEE)","mode":"Online","subjects":[{"name":"Mathematics (depending on trade)","marks":100},{"name":"General Knowledge","marks":50},{"name":"English / Regional Language","marks":50}],"negative_marking":"0.25 per wrong answer"},
      {"stage":"Physical Fitness Test (PFT)","mode":"Physical","notes":"1.6 km run, push-ups, sit-ups, chin-ups per service standards","negative_marking":"No"},
      {"stage":"Medical Examination / Admit Board","mode":"Medical","negative_marking":"No"}
    ],
    "syb_slug": null,
    "preparation_strategy": "Physical fitness standards gate every medical stage — train the run and muscle endurance from day one. The CEE is a straightforward 12th-level paper where accuracy pays."
  },
  {
    "name": "UPSC CAPF (Assistant Commandant) 2026", "slug": "upsc-capf", "short_name": "CAPF (AC)",
    "conducting_body": "Union Public Service Commission (UPSC)",
    "overview": "Central Armed Police Forces Examination for recruitment of Assistant Commandants in BSF, CRPF, CISF, ITBP and SSB.",
    "eligibility": "Graduate in any discipline. Age 20-25 years (relaxation for certain categories).",
    "exam_pattern": [
      {"stage":"Paper I (Objective)","mode":"Computer Based","subjects":[{"name":"General Studies & Mental Ability","questions":150,"marks":250}],"duration":"2 hours","negative_marking":"1/3rd per wrong answer"},
      {"stage":"Paper II (Descriptive)","mode":"Pen & Paper","subjects":[{"name":"English Comprehension & Precis","marks":200}],"negative_marking":"No"},
      {"stage":"Physical Standards/Efficiency + Interview","mode":"Personal","negative_marking":"No"}
    ],
    "syb_slug": null,
    "preparation_strategy": "Blend UPSC General Studies breadth with physical preparedness. English précis writing must be drilled since Paper II is descriptive."
  },
  {
    "name": "CTET (Central Teacher Eligibility Test) 2026", "slug": "ctet", "short_name": "CTET",
    "conducting_body": "Central Board of Secondary Education (CBSE)",
    "overview": "Minimum qualification test for teachers of Classes I-VIII in central government schools (KVS, NVS, and many others).",
    "eligibility": "Graduate with 50% + B.Ed/D.El.Ed as per Paper I & II norms. Age: no upper limit.",
    "exam_pattern": [
      {"stage":"Paper I (Classes I-V)","mode":"Online CBT","subjects":[{"name":"Child Development & Pedagogy","questions":30,"marks":30},{"name":"Language I","questions":30,"marks":30},{"name":"Language II","questions":30,"marks":30},{"name":"Mathematics","questions":30,"marks":30},{"name":"Environmental Studies","questions":30,"marks":30}],"total_questions":150,"total_marks":150,"duration":"2.5 hours","negative_marking":"No"},
      {"stage":"Paper II (Classes VI-VIII)","mode":"Online CBT","subjects":[{"name":"Child Development & Pedagogy","questions":30,"marks":30},{"name":"Language I","questions":30,"marks":30},{"name":"Language II","questions":30,"marks":30},{"name":"Mathematics & Science OR Social Studies","questions":60,"marks":60}],"total_questions":150,"total_marks":150,"duration":"2.5 hours","negative_marking":"No"}
    ],
    "syb_slug": null,
    "preparation_strategy": "CTET is a qualifying certificate — no negative marking. Cover Child Development & Pedagogy thoroughly plus all school-level subjects; most candidates clear it with a 90-mark target."
  },
  {
    "name": "KVS PRT / TGT / PGT Recruitment 2026", "slug": "kvs-recruitment", "short_name": "KVS Recruitment",
    "conducting_body": "Kendriya Vidyalaya Sangathan (KVS)",
    "overview": "Recruitment of Post Graduate Teachers, Trained Graduate Teachers and Primary Teachers for Kendriya Vidyalayas across India.",
    "eligibility": "Graduate + B.Ed (TGT), PG + B.Ed (PGT), 2-year D.El.Ed / B.Tech (PRT). Age limits vary by post.",
    "exam_pattern": [
      {"stage":"CBT for PGT / TGT","mode":"Computer Based","subjects":[{"name":"Subject Concerned","marks":120},{"name":"Professional Competency & General awareness","marks":30}],"total_marks":150,"negative_marking":"No"},
      {"stage":"Written (PRT)","mode":"Computer Based","subjects":[{"name":"Language Proficiency, Reasoning, GK, Current Affairs, Computer","marks":100}],"negative_marking":"No"}
    ],
    "syb_slug": null,
    "preparation_strategy": "Subject-depth dominates with zero negative marking. Revise your PG/graduate subject to CBSE level, plus pedagogy and current teaching methodology."
  },
  {
    "name": "NVS TGT / PGT Recruitment 2026", "slug": "nvs-recruitment", "short_name": "NVS Recruitment",
    "conducting_body": "Navodaya Vidyalaya Samiti (NVS)",
    "overview": "Recruitment of Teaching (PGT/TGT) and other staff for Jawahar Navodaya Vidyalayas across India.",
    "eligibility": "Graduate + B.Ed (TGT), PG + B.Ed (PGT) as per subject. Age 18-40 years (relaxation applicable).",
    "exam_pattern": [
      {"stage":"CBT","mode":"Computer Based","subjects":[{"name":"Subject Concerned","marks":100},{"name":"Reasoning","marks":25},{"name":"General Awareness","marks":25},{"name":"Teaching Aptitude","marks":25}],"total_marks":175,"negative_marking":"No"}
    ],
    "syb_slug": null,
    "preparation_strategy": "No negative marking means attempt everything after careful elimination. Build depth in the teaching subject and revise pedagogy."
  },
  {
    "name": "UGC NET (National Eligibility Test) 2026", "slug": "ugc-net", "short_name": "UGC NET",
    "conducting_body": "National Testing Agency (NTA)",
    "overview": "Eligibility test for Assistant Professor and JRF (Junior Research Fellowship) in Indian colleges and universities, with all subjects covered across two shifts.",
    "eligibility": "Master''s degree (PG) with 55% marks for general/EWS; 50% for SC/ST/OBC/PwBD. Age 19+ (varies for JRF).",
    "exam_pattern": [
      {"stage":"Paper 1 (General Aptitude)","mode":"CBT","subjects":[{"name":"Teaching, Research, Reasoning, Comprehension, DI, ICT, People, Environment, Higher Education","questions":50,"marks":100}],"duration":"60 minutes","negative_marking":"No"},
      {"stage":"Paper 2 (Subject)","mode":"CBT","subjects":[{"name":"Subject-specific 100 questions","questions":100,"marks":200}],"duration":"2 hours","negative_marking":"No"}
    ],
    "syb_slug": null,
    "preparation_strategy": "No negative marking — permutation safe but attempt smartly. Paper 1 is high-scoring with a finite syllabus; score 60+ there and protect your subject paper."
  },
  {
    "name": "UPPSC Combined State / PCS Exam 2026", "slug": "uppsc-pcs", "short_name": "UPPSC PCS",
    "conducting_body": "Uttar Pradesh Public Service Commission (UPPSC)",
    "overview": "Combined State Examination for recruitment to State Civil Services, Police and Allied Services of Uttar Pradesh — a flagship PCS exam of UP.",
    "eligibility": "Graduate in any discipline. Age 21-40 years (relaxation for reserved categories).",
    "exam_pattern": [
      {"stage":"Prelims","mode":"Objective","subjects":[{"name":"General Studies","questions":150,"marks":150},{"name":"General Aptitude / CSAT (Qualifying)","questions":100,"marks":100}],"negative_marking":"1/3rd per wrong answer in GS"},
      {"stage":"Mains","mode":"Descriptive","subjects":[{"name":"General Hindi, Essay, GS I-IV, Optional","marks":"varies"}],"negative_marking":"No"},
      {"stage":"Interview","mode":"Personal","negative_marking":"No"}
    ],
    "syb_slug": null,
    "preparation_strategy": "UP-specific current affairs carry heavy weight — follow the UP budget, state schemes, and Hindi-medium sources. Build optional subject mastery for Mains."
  },
  {
    "name": "MPPSC State Services 2026", "slug": "mppsc-state-services", "short_name": "MPPSC SSE",
    "conducting_body": "Madhya Pradesh Public Service Commission (MPPSC)",
    "overview": "State Services Examination (SSE) for recruitment of Deputy Collector, DSP, and other State Services posts in Madhya Pradesh.",
    "eligibility": "Graduate in any discipline. Age 21-35 years (relaxation as per category).",
    "exam_pattern": [
      {"stage":"Prelims","mode":"Objective","subjects":[{"name":"General Studies","questions":100,"marks":200},{"name":"General Aptitude (Qualifying)","questions":100,"marks":200}],"negative_marking":"No"},
      {"stage":"Mains","mode":"Descriptive","subjects":[{"name":"Essay, Hindi, GS I-IV","marks":"varies"}],"negative_marking":"No"},
      {"stage":"Interview","mode":"Personal","negative_marking":"No"}
    ],
    "syb_slug": null,
    "preparation_strategy": "No negative marking in Prelims gives more freedom — cover MP-specific history, geography, economy and schemes alongside national GS."
  },
  {
    "name": "RPSC RAS Exam 2026", "slug": "rpsc-ras", "short_name": "RPSC RAS",
    "conducting_body": "Rajasthan Public Service Commission (RPSC)",
    "overview": "RAS (Rajasthan Administrative Services) exam for recruitment of various administrative and police gazetted posts in Rajasthan.",
    "eligibility": "Graduate in any discipline. Age 21-40 years with category relaxation.",
    "exam_pattern": [
      {"stage":"Prelims","mode":"Objective","subjects":[{"name":"General Knowledge & General Science","questions":150,"marks":200}],"negative_marking":"1/3rd per wrong answer"},
      {"stage":"Mains","mode":"Descriptive","subjects":[{"name":"Essay, Hindi/English, GKI-IV","marks":"varies"}],"negative_marking":"No"},
      {"stage":"Interview","mode":"Personal","negative_marking":"No"}
    ],
    "syb_slug": null,
    "preparation_strategy": "Rajasthan state GK (history, culture, geography, economy) is the differentiator. Solve past RAS papers and follow RPSC official test series frequently."
  },
  {
    "name": "WBCS (West Bengal Civil Service) 2026", "slug": "wbpcs", "short_name": "WBCS",
    "conducting_body": "West Bengal Public Service Commission (WBPSC)",
    "overview": "West Bengal Civil Service examination for various gazetted executive and technical posts in West Bengal state government.",
    "eligibility": "Graduate in any discipline. Age 21-36 years (relaxation for reserved categories).",
    "exam_pattern": [
      {"stage":"Prelims","mode":"Objective","subjects":[{"name":"General Studies","questions":200,"marks":200}],"negative_marking":"No"},
      {"stage":"Mains","mode":"Descriptive","subjects":[{"name":"General English, General Hindi (optional), GS I-II, Optional, Essay","marks":"varies"}],"negative_marking":"No"},
      {"stage":"Personality Test","mode":"Personal","negative_marking":"No"}
    ],
    "syb_slug": null,
    "preparation_strategy": "WBCS has a notoriously wide syllabus — balance Bengal-specific concerns with national GS. Compulsory English paper requires polished written English."
  },
  {
    "name": "JPSC Combined Civil Services 2026", "slug": "jpsc-ccs", "short_name": "JPSC",
    "conducting_body": "Jharkhand Public Service Commission (JPSC)",
    "overview": "Combined Civil Services Examination for recruitment of state service and state police service posts in Jharkhand.",
    "eligibility": "Graduate in any discipline. Age 21-35 years (relaxation applicable).",
    "exam_pattern": [
      {"stage":"Prelims","mode":"Objective","subjects":[{"name":"General Studies (Paper I)","questions":100,"marks":200},{"name":"General Studies (Paper II - CSAT)","questions":100,"marks":200}],"negative_marking":"No"},
      {"stage":"Mains","mode":"Descriptive","subjects":[{"name":"Hindi, Essay, GS I-IV, Optional","marks":"varies"}],"negative_marking":"No"},
      {"stage":"Interview","mode":"Personal","negative_marking":"No"}
    ],
    "syb_slug": null,
    "preparation_strategy": "Cover Jharkhand''s adivasis, culture, geography and economy heavily with state-specific current affairs and scheme coverage."
  },
  {
    "name": "HPSC HCS Exam 2026", "slug": "hpsc-hcs", "short_name": "HPSC HCS",
    "conducting_body": "Haryana Public Service Commission (HPSC)",
    "overview": "Haryana Civil Services examination for state services entry including HCS, DSP and allied posts in Haryana.",
    "eligibility": "Graduate in any discipline. Age 20-42 years (relaxation as per category).",
    "exam_pattern": [
      {"stage":"Prelims","mode":"Objective","subjects":[{"name":"General Studies + Aptitude","questions":100,"marks":200}],"negative_marking":"No"},
      {"stage":"Mains","mode":"Descriptive","subjects":[{"name":"Hindi, Essay, GS I-IV, Optional","marks":"varies"}],"negative_marking":"No"},
      {"stage":"Interview","mode":"Personal","negative_marking":"No"}
    ],
    "syb_slug": null,
    "preparation_strategy": "Haryana GS and the HCS-specific optional subjects carry the weight. Combine state history/geography with continuous current affairs."
  },
  {
    "name": "APPSC Group 1 & 2 (AP) 2026", "slug": "appsc-group-1", "short_name": "APPSC",
    "conducting_body": "Andhra Pradesh Public Service Commission (APPSC)",
    "overview": "Combined Civil Services (Groups 1 & 2) examination for recruitment of executive and police gazetted posts in Andhra Pradesh.",
    "eligibility": "Graduate in any discipline. Age 18-42 years (relaxation depending on category).",
    "exam_pattern": [
      {"stage":"Prelims","mode":"Objective","subjects":[{"name":"Paper I - General Studies","questions":150,"marks":150},{"name":"Paper II - Aptitude & Mental Ability","questions":150,"marks":150}],"negative_marking":"No"},
      {"stage":"Mains","mode":"Descriptive","subjects":[{"name":"General Studies I-III + Optional","marks":"varies"}],"negative_marking":"No"},
      {"stage":"Interview","mode":"Personal","negative_marking":"No"}
    ],
    "syb_slug": null,
    "preparation_strategy": "AP state GK, history and economy dominate. Track state budget and flagship schemes and revise the reasoning/maths paper for reliable scoring."
  },
  {
    "name": "TNPSC Group II / IIA 2026", "slug": "tnpsc-group-2", "short_name": "TNPSC Group II",
    "conducting_body": "Tamil Nadu Public Service Commission (TNPSC)",
    "overview": "Combined Civil Services Examination-II for recruitment of Section Officer, Statistical Dept and allied non-executive posts in Tamil Nadu.",
    "eligibility": "Diploma / Degree or its equivalent as per post. Age 18-35 years with category relaxations.",
    "exam_pattern": [
      {"stage":"Paper I (Tamil Eligibility + General Studies + Aptitude)","mode":"Objective","subjects":[{"name":"Tamil (qualifying)","questions":100,"marks":100},{"name":"General Studies","questions":75,"marks":150},{"name":"Aptitude & Mental Ability","questions":25,"marks":50}],"total_marks":300,"negative_marking":"No"},
      {"stage":"Paper II (General Studies) — Group IIA","mode":"Objective","negative_marking":"No"}
    ],
    "syb_slug": null,
    "preparation_strategy": "Tamil paper is compulsory — keep Tamil language practice close to full marks. Prioritise the TNPSC-released syllabus and previous year patterns."
  },
  {
    "name": "KPSC KAS (Karnataka) 2026", "slug": "kpsc-kas", "short_name": "KPSC KAS",
    "conducting_body": "Karnataka Public Service Commission (KPSC)",
    "overview": "Karnataka Administrative Services preliminary exam for Group A & B state service posts in Karnataka.",
    "eligibility": "Graduate in any discipline. Age 18-35 years with relaxations.",
    "exam_pattern": [
      {"stage":"Prelims","mode":"Objective","subjects":[{"name":"Paper I - General Studies","questions":100,"marks":200},{"name":"Paper II - General Studies","questions":100,"marks":200}],"negative_marking":"No"},
      {"stage":"Mains","mode":"Descriptive","subjects":[{"name":"Compulsory Kannada, Essay, GS I-III","marks":"varies"}],"negative_marking":"No"},
      {"stage":"Interview","mode":"Personal","negative_marking":"No"}
    ],
    "syb_slug": null,
    "preparation_strategy": "Karnataka state syllabus and Kannada competence are must-haves. Focus on the state''s history, geography, economy and current affairs."
  },
  {
    "name": "GPSC Class 1 & 2 Exam 2026", "slug": "gpsc-class-1", "short_name": "GPSC",
    "conducting_body": "Gujarat Public Service Commission (GPSC)",
    "overview": "Recruitment of Class 1 & 2 officers in Gujarat civil services through the Preliminary and Main examination route.",
    "eligibility": "Graduate in any discipline. Age 21-35 years (relaxation applicable).",
    "exam_pattern": [
      {"stage":"Prelims","mode":"Objective","subjects":[{"name":"Paper I - General Studies","questions":100,"marks":200},{"name":"Paper II - General Studies","questions":100,"marks":200}],"negative_marking":"No"},
      {"stage":"Mains","mode":"Descriptive","subjects":[{"name":"Gujarati, Essay, GS I-IV, Optional","marks":"varies"}],"negative_marking":"No"},
      {"stage":"Interview","mode":"Personal","negative_marking":"No"}
    ],
    "syb_slug": null,
    "preparation_strategy": "Gujarati-language competence is required for Mains and interview. Prepare Gujarat state affairs plus general studies with the GPSC prescribed syllabus."
  },
  {
    "name": "ESIC Various Posts Exam 2026", "slug": "esic-recruitment", "short_name": "ESIC Recruitment",
    "conducting_body": "Employees State Insurance Corporation (ESIC)",
    "overview": "ESIC recruitment drive for various posts including UDC, MTS, Steno, Staff Nurse and insurance inspector positions across the corporation.",
    "eligibility": "12th pass to Graduate depending on post. Age 18-35 years (variation by post).",
    "exam_pattern": [
      {"stage":"CBT (Level 5 / 4 Posts)","mode":"Computer Based","subjects":[{"name":"Reasoning, Quantitative Aptitude, General Awareness, English, Computer Knowledge","marks":"varies"}],"negative_marking":"0.25 per wrong answer"},
      {"stage":"Skill / Typing Test for applicable posts","mode":"Skill","negative_marking":"No"}
    ],
    "syb_slug": null,
    "preparation_strategy": "Strong 12th-to-graduate level aptitude plus heavy computer knowledge practice. ESIC repeats question patterns heavily across cycles."
  },
  {
    "name": "EPFO Grade A / SSA 2026", "slug": "epfo-recruitment", "short_name": "EPFO Recruitment",
    "conducting_body": "Employees Provident Fund Organisation (EPFO)",
    "overview": "Recruitment of Enforcement Officer, Accounts Officer and Social Security Assistant in EPFO through three-phase examination.",
    "eligibility": "Graduate with certain specifications. Age 21-30 years for officers (relaxation applicable).",
    "exam_pattern": [
      {"stage":"Phase 1 (Prelims)","mode":"Online CBT","subjects":[{"name":"Reasoning","marks":60},{"name":"Quantitative Aptitude","marks":60},{"name":"English","marks":30}],"negative_marking":"0.25 per wrong answer"},
      {"stage":"Phase 2 (Mains)","mode":"Online + Descriptive","subjects":[{"name":"Reasoning, Data Interpretation, English, General Awareness, Descriptive","marks":"varies"}],"negative_marking":"0.25 per wrong answer in objective"},
      {"stage":"Interview","mode":"Personal","negative_marking":"No"}
    ],
    "syb_slug": null,
    "preparation_strategy": "Finance, labour welfare and EPFO domain knowledge are decided in the interview phase. The Mains paper mixes bank-PO style quant with essay writing."
  },
  {
    "name": "GATE 2026 (For PSU Recruitment)", "slug": "gate-2026", "short_name": "GATE",
    "conducting_body": "Indian Institute of Science (IISc) + IITs, via NTA",
    "overview": "Graduate Aptitude Test in Engineering — accepted by major PSUs (BHEL, NTPC, GAIL, etc.) and post-graduate admission in engineering institutes.",
    "eligibility": "B.E/B.Tech or B.Sc graduates/students in relevant streams. No age limit.",
    "exam_pattern": [
      {"stage":"Computer Based Test","mode":"CBT","subjects":[{"name":"General Aptitude (15%)","questions":10,"marks":15},{"name":"Subject Paper (85%)","questions":55,"marks":85}],"total_questions":65,"total_marks":100,"duration":"3 hours","negative_marking":"1/3rd for 1-mark questions, 2/3rd for 2-mark"}
    ],
    "syb_slug": null,
    "preparation_strategy": "A score above the PSU cutoff unlocks direct shortlisting for recruitment. Focus 85% effort on the core subject paper and master previous year papers."
  },
  {
    "name": "IB (Security Assistant) & MHA Posts 2026", "slug": "ib-security-exam", "short_name": "IB Security",
    "conducting_body": "Intelligence Bureau / Ministry of Home Affairs",
    "overview": "Recruitment of Security Assistants and other staff for central security agencies and MHA affiliated units.",
    "eligibility": "12th pass (varies post-wise); age 18-27 years typical.",
    "exam_pattern": [
      {"stage":"Written Examination","mode":"CBT","subjects":[{"name":"General Awareness, Reasoning, Numerical Ability, English/Hindi","marks":"varies"}],"negative_marking":"0.25 per wrong answer"},
      {"stage":"Physical Standards + Interview","mode":"Physical","negative_marking":"No"}
    ],
    "syb_slug": null,
    "preparation_strategy": "Security-awareness GK and accuracy typical of SSC-style papers. Aim for a full logical reasoning section to secure the shortlist."
  },
  {
    "name": "UP Police SI (Sub Inspector) Exam 2026", "slug": "up-police-si-exam", "short_name": "UP Police SI",
    "conducting_body": "UP Police Recruitment & Promotion Board (UPPRPB)",
    "overview": "Recruitment of Sub Inspectors in Uttar Pradesh Police including civil and armed police cadres.",
    "eligibility": "Graduate in any discipline. Age 20-28 years (relaxation applicable).",
    "exam_pattern": [
      {"stage":"Computer Based Test","mode":"CBT","subjects":[{"name":"General Knowledge & General Hindi","questions":100,"marks":100},{"name":"Numerical Ability & Reasoning","marks":"varies"}],"total_marks":200,"negative_marking":"No"},
      {"stage":"PET / PST + Document Verification","mode":"Physical","negative_marking":"No"}
    ],
    "syb_slug": null,
    "preparation_strategy": "UPPRPB exams love UP-state GK and Hindi. Prepare the Hindi nibandh and state geography/history aggressively."
  },
  {
    "name": "UP Police Constable Exam 2026", "slug": "up-police-constable-exam", "short_name": "UP Police Constable",
    "conducting_body": "UP Police Recruitment & Promotion Board (UPPRPB)",
    "overview": "Recruitment of constables in Uttar Pradesh Police with lakhs of applicants every cycle.",
    "eligibility": "10th / 12th pass as per post. Age 18-25 years (relaxation applicable).",
    "exam_pattern": [
      {"stage":"Computer Based Test","mode":"CBT","subjects":[{"name":"General Knowledge, General Hindi, Numerical & Mental Ability, Reasoning","total_marks":100}],"negative_marking":"No"},
      {"stage":"PET / PST","mode":"Physical","negative_marking":"No"}
    ],
    "syb_slug": null,
    "preparation_strategy": "Zero negative marking lets you attempt everything. Hindi medium GK is the deciding factor; ensure daily current-affairs and UP-state knowledge."
  }
]'
-- JSONEND
) as v(
  name text, slug text, short_name text, conducting_body text, overview text,
  eligibility text, exam_pattern jsonb, syb_slug text, preparation_strategy text
)
on conflict (slug) do nothing;