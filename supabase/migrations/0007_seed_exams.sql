-- ============================================================================
-- Seed data — Phase 5: competitive exams + supporting syllabus entries.
--
-- The record payload is JSONB (validated with `node --check` style JSON.parse
-- before push) and expanded with jsonb_to_recordset, so SQL syntax can't drift
-- from the data. `exams.syllabus_id` is resolved by slug from public.syllabus.
--
-- Run:  supabase db push
-- ============================================================================

-- ---------------------------------------------------------------------------
-- More syllabus entries (subjects for exams beyond SSC CGL / BPSC)
-- ---------------------------------------------------------------------------
insert into public.syllabus (slug, exam_name, stage, subjects) values
  ('ibps-po-prelims', 'IBPS PO Prelims', 'prelims',
   '[{"subject":"English Language","topics":["Reading Comprehension","Cloze Test","Error Spotting","Para Jumbles"]},
     {"subject":"Quantitative Aptitude","topics":["Simplification","Data Interpretation","Inequalities","Number Series"]},
     {"subject":"Reasoning Ability","topics":["Puzzles & Seating","Syllogism","Coding-Decoding","Inequalities"]}]'::jsonb),
  ('rrb-group-d-cbt', 'RRB Group D CBT', 'cbt',
   '[{"subject":"Mathematics","topics":["Number System","Percentages","Ratio & Proportion","Time & Distance","Mensuration"]},
     {"subject":"General Intelligence & Reasoning","topics":["Analogies","Directions","Blood Relations","Series"]},
     {"subject":"General Science","topics":["Physics","Chemistry","Biology","Everyday Science"]},
     {"subject":"General Awareness & Current Affairs","topics":["Indian Politics","History","Sports","Railway Zone Knowledge"]}]'::jsonb),
  ('ssc-gd-cbt', 'SSC GD Constable CBT', 'cbt',
   '[{"subject":"General Intelligence & Reasoning","topics":["Similarities & Differences","Arithmetic Reasoning","Space Visualisation"]},
     {"subject":"General Knowledge & General Awareness","topics":["India & its Neighbours","Current Events","Sports","SSC Organisations"]},
     {"subject":"Elementary Mathematics","topics":["Number System","Percentage","Ratio & Proportion","Average","Simple Interest"]},
     {"subject":"English / Hindi","topics":["Fix the Sentence","Fill in the Blanks","Spellings"]}]'::jsonb),
  ('upsc-cse-prelims', 'UPSC CSE Prelims', 'prelims',
   '[{"subject":"General Studies Paper I","topics":["Current Affairs","History of India","Indian & World Geography","Indian Polity & Governance","Economic & Social Development","Science & Technology"]},
     {"subject":"CSAT Paper II","topics":["Comprehension","Interpersonal Skills","Logical Reasoning","Analytical Ability","Decision Making","Basic Numeracy"]}]'::jsonb)
on conflict (slug) do update
  set exam_name = excluded.exam_name, stage = excluded.stage, subjects = excluded.subjects;

-- ---------------------------------------------------------------------------
-- Exams (JSONB payload)
-- ---------------------------------------------------------------------------
insert into public.exams (
  name, slug, short_name, conducting_body, overview, eligibility, exam_pattern,
  syllabus_id, preparation_strategy, recommended_books, previous_year_papers,
  cutoff_trends, faqs, is_published
)
select
  v.name, v.slug, v.short_name, v.conducting_body, v.overview, v.eligibility,
  v.exam_pattern, (select id from public.syllabus where slug = v.syb_slug),
  v.preparation_strategy, v.recommended_books, v.previous_year_papers,
  v.cutoff_trends, v.faqs, true
from jsonb_to_recordset(
-- JSONBEGIN
'[
  {
    "name": "SSC CGL 2026", "slug": "ssc-cgl", "short_name": "SSC CGL",
    "conducting_body": "Staff Selection Commission (SSC)",
    "overview": "Combined Graduate Level is SSC''s flagship examination for Group B and Group C posts across ministries, departments and constitutional bodies. Roughly 18,000 vacancies across hundreds of posts; the exam happens in three computer-based stages plus a descriptive paper.",
    "eligibility": "Graduate in any discipline from a recognised university. Age 18-32 years with category-wise relaxation.",
    "exam_pattern": [
      {"stage":"Tier 1 (CBT)","mode":"Computer Based","subjects":[{"name":"General Intelligence & Reasoning","questions":25,"marks":50},{"name":"General Awareness","questions":25,"marks":50},{"name":"Quantitative Aptitude","questions":25,"marks":50},{"name":"English Comprehension","questions":25,"marks":50}],"total_questions":100,"total_marks":200,"duration":"60 minutes","negative_marking":"0.50 per wrong answer"},
      {"stage":"Tier 2 (CBT)","mode":"Computer Based","subjects":[{"name":"Quantitative Abilities","questions":30,"marks":90},{"name":"English Language","questions":45,"marks":135},{"name":"Statistics","questions":15,"marks":45},{"name":"General Studies (Finance & Economics)","questions":20,"marks":60}],"total_questions":170,"total_marks":390,"duration":"3 x 60 minutes","negative_marking":"0.50 per wrong answer"},
      {"stage":"Tier 3 (Descriptive)","mode":"Pen & Paper","subjects":[{"name":"Essay / Letter / Application / Precis","questions":2,"marks":100}],"duration":"60 minutes","negative_marking":"No"}
    ],
    "syb_slug": "ssc-cgl-tier-1",
    "preparation_strategy": "Start with the Tier 1 syllabus and target 95%+ accuracy in all four sections. Give one full-length mock test every week in the last two months and analyse attempted-vs-correct questions. Tier 2 requires subject depth: prepare Statistics and General Studies (Finance) from the specific books listed below.",
    "recommended_books": [
      {"title":"Quantitative Aptitude for Competitive Examinations","author":"R.S. Aggarwal","affiliate_link":"https://www.amazon.in/s?k=quantitative+aptitude+rs+aggarwal&tag=sarkaarinaukari-21"},
      {"title":"Analytical Reasoning","author":"M.K. Pandey","affiliate_link":"https://www.amazon.in/s?k=analytical+reasoning+mk+pandey&tag=sarkaarinaukari-21"},
      {"title":"Lucent''s General Knowledge","author":"Lucent Publications","affiliate_link":"https://www.amazon.in/s?k=lucent+general+knowledge&tag=sarkaarinaukari-21"}
    ],
    "previous_year_papers": [
      {"year":2025,"label":"Tier 1 2025 Paper","link":"https://ssc.gov.in/papers/cgl-2025-tier1"},
      {"year":2025,"label":"Tier 2 2025 Paper","link":"https://ssc.gov.in/papers/cgl-2025-tier2"},
      {"year":2024,"label":"Tier 1 2024 Paper","link":"https://ssc.gov.in/papers/cgl-2024-tier1"}
    ],
    "cutoff_trends": [
      {"year":2025,"stage":"Tier 1","cutoffs":{"general":137.68,"obc":131.90,"sc":124.62,"st":118.50,"ews":133.73,"pwd":82.19}},
      {"year":2024,"stage":"Tier 1","cutoffs":{"general":142.91,"obc":137.21,"sc":128.21,"st":122.73,"ews":139.17,"pwd":76.50}}
    ],
    "faqs": [
      {"question":"Is SSC CGL conducted in Hindi as well?","answer":"Yes. Tier 1, Tier 2 and Tier 3 can be answered in English or Hindi, except the English Comprehension section. Candidates opting for the Hindi medium can still answer the English section in English."},
      {"question":"What is the Tier 1 negative marking?","answer":"0.50 marks are deducted for every wrong answer in the computer-based Tier 1. No deduction is made for unattempted questions."},
      {"question":"Can final-year students apply for SSC CGL?","answer":"Yes. Final-year students can appear in Tier 1 and Tier 2, provided they produce proof of graduation before Tier 3 or document verification."}
    ]
  },
  {
    "name": "BPSC 70th CCE", "slug": "bpsc-70th", "short_name": "BPSC 70th",
    "conducting_body": "Bihar Public Service Commission (BPSC)",
    "overview": "The Combined Competitive Examination (CCE) of BPSC is Bihar''s premier recruitment exam for the state civil services: SDM, DSP, excise, treasury, and a range of Group A and B posts. It is one of the largest state-level recruitment drives in India.",
    "eligibility": "Graduate in any stream from a recognised university. Age 20-37 years (relaxation for SC/ST, OBC, women and ex-servicemen).",
    "exam_pattern": [
      {"stage":"Preliminary Exam","mode":"Objective","subjects":[{"name":"General Studies","questions":150,"marks":150},{"name":"Maths & Reasoning","questions":50,"marks":75}],"total_questions":200,"total_marks":225,"duration":"3 hours","negative_marking":"1/3rd per wrong answer for General Studies","notes":"Qualifying paper only; marks not counted for the merit list"},
      {"stage":"Main Exam","mode":"Descriptive","subjects":[{"name":"General Hindi","marks":100},{"name":"General Studies Part I","marks":200},{"name":"General Studies Part II","marks":200},{"name":"Optional Subject","marks":200}],"total_marks":700,"duration":"4 x 3 hours","negative_marking":"No"}
    ],
    "syb_slug": "bpsc-70th-prelims",
    "preparation_strategy": "The prelims are a screening test taken by lakhs of applicants. Finish the GS syllabus twice, practise 10 years of prelims questions for pattern familiarity, and keep a daily newspaper habit for static plus current affairs. For mains, choose one optional subject and build a 200-mark strategy early.",
    "recommended_books": [
      {"title":"Bihar General Studies (BPSC specific)","author":"BSC Publication","affiliate_link":"https://www.amazon.in/s?k=bpsc+exam+books&tag=sarkaarinaukari-21"},
      {"title":"Indian Polity","author":"M. Laxmikanth","affiliate_link":"https://www.amazon.in/s?k=indian+polity+laxmikanth&tag=sarkaarinaukari-21"}
    ],
    "previous_year_papers": [
      {"year":2025,"label":"BPSC 69th Prelims Paper","link":"https://bpsc.bih.nic.in/papers/69th-prelims"},
      {"year":2023,"label":"BPSC 68th Prelims Paper","link":"https://bpsc.bih.nic.in/papers/68th-prelims"}
    ],
    "cutoff_trends": [
      {"year":2025,"stage":"Prelims","cutoffs":{"general":80,"obc":76,"sc":66,"st":63,"female":74}},
      {"year":2023,"stage":"Prelims","cutoffs":{"general":85,"obc":80,"sc":70,"st":68,"female":78}}
    ],
    "faqs": [
      {"question":"Is the BPSC Prelims negative marking?","answer":"The 70th CCE introduced 1/3rd negative marking for wrong answers in the General Studies paper, so only answer what you are confident about."},
      {"question":"Can candidates outside Bihar apply for BPSC?","answer":"Yes. BPSC 70th is open to candidates across India, though some reserved-category seats carry a Bihar domicile requirement."}
    ]
  },
  {
    "name": "IBPS PO 2026 (CRP 17)", "slug": "ibps-po", "short_name": "IBPS PO",
    "conducting_body": "Institute of Banking Personnel Selection (IBPS)",
    "overview": "Recruitment of Probationary Officers in 11 participating public sector banks through a two-stage online exam followed by an interview. IBPS PO is the most popular banking examination in the country.",
    "eligibility": "Graduate in any discipline. Age 20-30 years (relaxation for reserved categories).",
    "exam_pattern": [
      {"stage":"Prelims","mode":"Online CBT","subjects":[{"name":"English Language","questions":30,"marks":30},{"name":"Quantitative Aptitude","questions":35,"marks":35},{"name":"Reasoning Ability","questions":35,"marks":35}],"total_questions":100,"total_marks":100,"duration":"60 minutes","negative_marking":"0.25 per wrong answer"},
      {"stage":"Mains","mode":"Online CBT","subjects":[{"name":"Reasoning & Computer Aptitude","questions":45,"marks":60},{"name":"Data Analysis & Interpretation","questions":35,"marks":60},{"name":"English Language","questions":35,"marks":40},{"name":"General / Economy / Banking Awareness","questions":40,"marks":40},{"name":"English Descriptive (Letter & Essay)","questions":2,"marks":25}],"total_questions":157,"total_marks":225,"duration":"180 minutes","negative_marking":"0.25 per wrong answer"},
      {"stage":"Interview","mode":"Personal","duration":"~20 minutes","negative_marking":"No"}
    ],
    "syb_slug": "ibps-po-prelims",
    "preparation_strategy": "Prelims demands speed scoring: aim to finish 100 questions in 60 minutes. Data Analysis & Interpretation dominates the mains quant paper, so practise high-level DI sets. Write the English descriptive (letter + essay) daily for 2-3 weeks to score 20+ out of 25.",
    "recommended_books": [
      {"title":"Quantitative Aptitude for Competitive Exams","author":"R.S. Aggarwal","affiliate_link":"https://www.amazon.in/s?k=quantitative+aptitude+rs+aggarwal&tag=sarkaarinaukari-21"},
      {"title":"Banking Awareness for IBPS PO","author":"Disha Experts","affiliate_link":"https://www.amazon.in/s?k=baking+awareness+ibps+po+book&tag=sarkaarinaukari-21"}
    ],
    "previous_year_papers": [
      {"year":2025,"label":"IBPS PO Prelims 2025","link":"https://www.ibps.in/papers/po-prelims-2025"},
      {"year":2025,"label":"IBPS PO Mains 2025","link":"https://www.ibps.in/papers/po-mains-2025"}
    ],
    "cutoff_trends": [
      {"year":2025,"stage":"Prelims","cutoffs":{"general":14.75,"obc":12.50,"sc":10.75,"st":10.50,"ews":13.25,"pwd":10.00}},
      {"year":2024,"stage":"Prelims","cutoffs":{"general":15.75,"obc":13.25,"sc":11.25,"st":11.00,"ews":14.50,"pwd":10.50}}
    ],
    "faqs": [
      {"question":"How many attempts can I give for IBPS PO?","answer":"General candidates get 6 attempts, OBC get 9, and SC/ST candidates have no attempt limit."},
      {"question":"Is the IBPS PO interview descriptive?","answer":"The interview is a personal interview of roughly 20 minutes. The descriptive test is part of Mains: a letter and an essay worth 25 marks."}
    ]
  },
  {
    "name": "SSC GD Constable Exam", "slug": "ssc-gd", "short_name": "SSC GD",
    "conducting_body": "Staff Selection Commission (SSC)",
    "overview": "Recruitment of General Duty Constables across CAPFs - BSF, CISF, CRPF, SSB, ITBP, Assam Rifles - plus NIA and SSF. Selection combines a computer-based test with a physical efficiency or standard test.",
    "eligibility": "10th pass (or equivalent). Age 18-23 years (upper age relaxed for EXM and reserved categories).",
    "exam_pattern": [
      {"stage":"CBT","mode":"Computer Based","subjects":[{"name":"General Intelligence & Reasoning","questions":20,"marks":20},{"name":"General Knowledge & General Awareness","questions":20,"marks":20},{"name":"Elementary Mathematics","questions":20,"marks":20},{"name":"English / Hindi","questions":20,"marks":20}],"total_questions":80,"total_marks":160,"duration":"60 minutes","negative_marking":"0.25 per wrong answer"},
      {"stage":"PET / PST","mode":"Physical","notes":"Race 1600m (8 min / 6.5 min women), high jump & long jump standards, chest expansion for males"},
      {"stage":"Document Verification","mode":"Offline","negative_marking":"No"}
    ],
    "syb_slug": "ssc-gd-cbt",
    "preparation_strategy": "The CBT is easy to moderate; the real filter is the physical test. Practise the 1600m run daily for three months before the exam window and confirm your height and chest standards against the post-wise requirements before investing prep time.",
    "recommended_books": [
      {"title":"SSC GD Constable Guide","author":"Arihant Experts","affiliate_link":"https://www.amazon.in/s?k=ssc+gd+constable+book&tag=sarkaarinaukari-21"}
    ],
    "previous_year_papers": [
      {"year":2025,"label":"SSC GD CBT 2025","link":"https://ssc.gov.in/papers/gd-2025"}
    ],
    "cutoff_trends": [
      {"year":2025,"stage":"CBT","cutoffs":{"general":99.12,"obc":95.50,"sc":88.25,"st":84.75,"ews":97.00,"pwd":55.50}}
    ],
    "faqs": [
      {"question":"Is height relaxable for female or EXM candidates?","answer":"Yes. Women get relaxed height and PET standards, and EXM candidates receive a height relaxation of 1 inch."},
      {"question":"What is the running standard for males?","answer":"Males must finish 1600 metres within 8 minutes in PET; females have a 6.5-minute standard."}
    ]
  },
  {
    "name": "RRB Group D (Level 1) Exam", "slug": "rrb-group-d", "short_name": "RRB Group D",
    "conducting_body": "Railway Recruitment Board (RRB)",
    "overview": "Recruitment of Track Maintainer-Grade IV, Helper, Assistant Pointsman and other Level 1 posts across Indian Railways. The exam is held zone-wise under the same notification.",
    "eligibility": "10th pass or ITI in a relevant trade. Age 18-33 years.",
    "exam_pattern": [
      {"stage":"CBT Stage 1","mode":"Computer Based","subjects":[{"name":"Mathematics","questions":20,"marks":20},{"name":"General Intelligence & Reasoning","questions":20,"marks":20},{"name":"General Science","questions":20,"marks":20},{"name":"General Awareness & Current Affairs","questions":20,"marks":20}],"total_questions":80,"total_marks":80,"duration":"90 minutes","negative_marking":"1/3rd per wrong answer"},
      {"stage":"CBT Stage 2","mode":"Computer Based","total_questions":100,"total_marks":100,"duration":"90 minutes","negative_marking":"1/3rd per wrong answer"},
      {"stage":"PET","mode":"Physical","notes":"Weightlifting 35 kg and running for qualifying candidates"},
      {"stage":"Document Verification / Medical","mode":"Offline","negative_marking":"No"}
    ],
    "syb_slug": "rrb-group-d-cbt",
    "preparation_strategy": "Zone-wise competition varies; check previous years'' cutoffs for your zone. General Science is the make-or-break section: cover NCERT Physics, Chemistry and Biology for classes 9 and 10 thoroughly. The rest is class-10 level arithmetic and reasoning.",
    "recommended_books": [
      {"title":"RRB Group D 2026 Complete Guide","author":"Sahitya Bhawan","affiliate_link":"https://www.amazon.in/s?k=rrb+group+d+books&tag=sarkaarinaukari-21"}
    ],
    "previous_year_papers": [
      {"year":2025,"label":"RRB Group D CBT 2025","link":"https://railways.gov.in/papers/rrb-groupd-2025"}
    ],
    "cutoff_trends": [
      {"year":2025,"stage":"CBT 1","cutoffs":{"general":71.31,"obc":67.63,"sc":60.75,"st":57.50,"ews":70.25,"pwd":41.30}}
    ],
    "faqs": [
      {"question":"Is there a criterion of clearing each section separately?","answer":"Yes. Minimum qualifying marks are applied section-wise as well as overall, including a separate threshold for General Science."},
      {"question":"Can a final-year ITI student apply?","answer":"No. The ITI certificate must be completed on or before the document verification date."}
    ]
  },
  {
    "name": "UPSC Civil Services (CSE)", "slug": "upsc-cse", "short_name": "UPSC CSE",
    "conducting_body": "Union Public Service Commission (UPSC)",
    "overview": "The Civil Services Examination selects officers for IAS, IPS, IFS and Group A or B central services. The three-stage exam runs over the better part of a year and is the definitive test of analytical writing.",
    "eligibility": "Graduate in any discipline; final-year students may appear for Prelims. Age 21-32 years (relaxation for reserved categories and ex-servicemen).",
    "exam_pattern": [
      {"stage":"Preliminary","mode":"Objective","subjects":[{"name":"General Studies I","questions":100,"marks":200},{"name":"CSAT (Qualifying)","questions":80,"marks":200}],"total_questions":180,"total_marks":400,"duration":"2 x 2 hours","negative_marking":"1/3rd per wrong answer"},
      {"stage":"Main (Written)","mode":"Descriptive","subjects":[{"name":"Essay","marks":250},{"name":"General Studies I-IV","marks":1000},{"name":"Optional Subject (2 papers)","marks":500},{"name":"Qualifying languages (English + one paper)","marks":"Pass only"}],"total_marks":1750,"duration":"9 papers over 5 days","negative_marking":"No"},
      {"stage":"Personality Test","mode":"Interview","total_marks":275,"negative_marking":"No"}
    ],
    "syb_slug": "upsc-cse-prelims",
    "preparation_strategy": "Prelims is a negative-marking trap; strategy beats coverage. Solve a dozen previous prelims papers before starting fresh MCQ practice. For mains, begin answer-writing early: four GS papers plus an optional subject mean handwritten practice is non-negotiable from the first month.",
    "recommended_books": [
      {"title":"Indian Polity","author":"M. Laxmikanth","affiliate_link":"https://www.amazon.in/s?k=indian+polity+laxmikanth&tag=sarkaarinaukari-21"},
      {"title":"India Year Book","author":"Publications Division, Govt of India","affiliate_link":"https://www.amazon.in/s?k=india+year+book+2026&tag=sarkaarinaukari-21"},
      {"title":"Certificate Physical Geography","author":"G.C. Leong","affiliate_link":"https://www.amazon.in/s?k=gc+leong+physical+geography&tag=sarkaarinaukari-21"}
    ],
    "previous_year_papers": [
      {"year":2025,"label":"CSE Prelims 2025","link":"https://upsc.gov.in/papers/cse-prelims-2025"}
    ],
    "cutoff_trends": [
      {"year":2025,"stage":"Prelims","cutoffs":{"general":83.34,"obc":81.67,"sc":80.00,"st":78.67,"ews":79.33,"pwd":45.00}}
    ],
    "faqs": [
      {"question":"How many attempts are allowed in UPSC CSE?","answer":"General candidates get 6 attempts, OBC get 9, and SC/ST candidates have unlimited attempts subject to the age limit."},
      {"question":"Is the language paper compulsory for graduates?","answer":"English and one qualifying Indian-language paper are mandatory in Mains. They are qualifying only: you must score 25% in each."}
    ]
  }
]'
-- JSONEND
) as v(
  name text, slug text, short_name text, conducting_body text, overview text,
  eligibility text, exam_pattern jsonb, syb_slug text, preparation_strategy text,
  recommended_books jsonb, previous_year_papers jsonb, cutoff_trends jsonb, faqs jsonb
)
on conflict (slug) do nothing;