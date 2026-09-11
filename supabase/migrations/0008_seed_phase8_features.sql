-- ============================================================================
-- Seed data — Phase 8: current affairs briefs + interactive quizzes.
--
-- Idempotent (upserts on slug). JSONB questions payloads are inlined as
-- literals so validated JSON can't drift from SQL.
--
-- Run:  supabase db push
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Current Affairs (daily exam-relevant briefs)
-- ---------------------------------------------------------------------------
insert into public.current_affairs (date, slug, title, content) values
  ('2026-09-10', 'bihar-gram-panchayat-territorial-constituency-election-dates',
   'Bihar Panchayat Territorial Constituency Election Dates Announced',
   'The State Election Commission, Bihar announced the schedule for the Gram Panchayat Territorial Constituency elections. The elections will be held in the Madhyam Vidyalayas and Anganwadi Kendra elections through ballot paper.\n\nThe notification highlights key dates, reservation rosters, and the model code of conduct starting with the announcement. Candidates must file nominations within the notified window and can withdraw up to the last withdrawal date.\n\nFor exam aspirants: this is relevant for BPSC, Bihar police and panchayat-level interviews. Expect questions on the panchayat electoral cycle, SEC powers, and reservation categories (SC/ST/OBC/Women).'),
  ('2026-09-09', 'india-climbs-gemini-esports-index-mobile-esports-kabaddi',
   'India Ranks 8th in Gemini Esports Index 2026',
   'India ranked 8th globally in the 2026 Gemini Esports Index, jumping from 10th place the previous year, driven by mobile gaming and the growth of grassroots esports tournaments.\n\nThe index scores countries on esports ecosystem health, including prize pools, event scale, grassroots programs, and viewership across platforms.\n\nIndia''s climb is attributed to mobile-first gaming, big-ticket international events (like the proposed esports at the 2030 Asian Games), and increased brand sponsorships in titles such as BGMI and Kabaddi esports.\n\nKey GK point: India''s push for esports recognition aligns with the government''s "Make in India" push in gaming, and the Esports Federation of India''s roadmap to the Olympics.');

insert into public.current_affairs (date, slug, title, content) values
  ('2026-09-08', 'world-cup-2026-club-world-cup-india-fifa-id',
   'FIFA World Cup 2026 Awaits — India Registers in FIFA Connect',
   'As the FIFA World Cup 2026 in North America (Canada, USA, Mexico) reaches its knockout crescendo, football fans in India followed the expanded 48-team format.\n\nIndian clubs and national teams register player IDs through the FIFA Connect platform, which the AIFF mandates for all professional squads; domestic transfers are tracked in the same system.\n\nGK box: FIFA World Cup 2026 is the first with 48 teams and three host nations. India''s FIFA ranking and the national team''s qualification journey are frequently asked in sports GK sections.'),
  ('2026-09-07', 'eci-voter-helderlink-helpline-1950-callai-helpline',
   'ECI Voter Helpline 1950 — Call AI Helpline For Assistance',
   'The Election Commission of India''s national voter helpline 1950 and the Voter Helpline App continue to scale during by-election schedules across states.\n\nThe app integrates the new AI-assisted IVR helpline, letting voters verify polling stations, download their EPIC/Voter ID, check candidate affidavits, and file Form-6/Form-8 corrections without visiting a polling booth.\n\nExam relevance: voter awareness rights, digital democracy, and the new voter information system (VIS) powered by the updated electoral roll. Expect a direct GK question on the helpline number and app features in SI and SSC exams.');

-- ---------------------------------------------------------------------------
-- Quizzes (interactive mock tests for exam prep)
-- ---------------------------------------------------------------------------
insert into public.quizzes (slug, title, subject, description, questions) values
  ('bihar-basic-knowledge-quiz', 'Bihar General Knowledge Quiz — Foundation',
   'GK', 'Test your Bihar static GK with 10 quick questions on Bihar polity, geography, history and culture.',
   '[
     {"question":"Which city is the summer capital of Bihar?","options":["Patna","Gaya","Rajgir","Darbhanga"],"correct_index":2,"explanation":"Rajgir serves as the summer capital of Bihar."},
     {"question":"The Bihar Legislative Assembly has how many seats?","options":["243","245","253","288"],"correct_index":0,"explanation":"Bihar''s Assembly has 243 seats."},
     {"question":"Which river flows through Patna?","options":["Gandak","Ganga","Sone","Kosi"],"correct_index":1,"explanation":"The Ganga flows along Patna''s northern boundary."},
     {"question":"Nalanda University ruins are located in which district?","options":["Nalanda","Patna","Gaya","Vaishali"],"correct_index":0,"explanation":"The ancient university is in Nalanda district."},
     {"question":"Which is the largest district of Bihar by area?","options":["Patna","West Champaran","Gaya","Purnea"],"correct_index":1,"explanation":"West Champaran is Bihar''s largest district."},
     {"question":"The Patna Sahib Gurudwara marks the birthplace of which Sikh Guru?","options":["Guru Nanak","Guru Gobind Singh","Guru Tegh Bahadur","Guru Arjan Dev"],"correct_index":1,"explanation":"Guru Gobind Singh was born in Patna Sahib."},
     {"question":"Bihar''s state animal is the _____?","options":["Tiger","Elephant","Wild Bull","Blackbuck"],"correct_index":2,"explanation":"The gaur (wild ox / Indian Bison) is the state animal."},
     {"question":"Which Mughal emperor made Prayagraj the seat of Bihar governance?","options":["Akbar","Sher Shah Suri","Babur","Aurangzeb"],"correct_index":0,"explanation":"Akbar transferred Bihar''s power seat to Allahabad (Prayagraj)."},
     {"question":"The Chhotanagpur plateau mainly covers which part of the state?","options":["Northern Bihar","South Bihar plains","Kaimur hills region","Entire Bihar"],"correct_index":2,"explanation":"Chhotanagpur plateau extends into Bihar''s southwest (Kaimur) region."},
     {"question":"Which Bihar city hosts the Rajgir International Convention Centre?","options":["Rajgir","Nalanda","Bodh Gaya","Pawapuri"],"correct_index":0,"explanation":"Rajgir hosts the international convention centre."}
   ]'::jsonb),
  ('general-awareness-ssc-quiz', 'General Awareness Mini Test — SSC Foundation',
   'GA', 'A quick 8-question general awareness warm-up covering polity, economy and static GK for SSC and state exams.',
   '[
     {"question":"The President of India can withhold assent to a money bill for how long?","options":["Not at all","14 days","21 days","30 days"],"correct_index":1,"explanation":"A money bill must be returned or given assent within 14 days."},
     {"question":"Who decides on the disqualification of a Member of Parliament under the 10th Schedule?","options":["President","Chief Justice","Speaker","Election Commission"],"correct_index":2,"explanation":"The Speaker decides under the anti-defection law."},
     {"question":"National Voter''s Day is observed on which date?","options":["January 25","January 26","February 14","March 31"],"correct_index":0,"explanation":"Jan 25 marks the ECI''s foundation day."},
     {"question":"The GST rate applicable to most essential food items is?","options":["5%","0%","12%","18%"],"correct_index":1,"explanation":"Unprocessed essentials like grains and milk are exempt / 0%."},
     {"question":"95th Constitutional Amendment extended reservation for SC/ST in Lok Sabha till which year?","options":["2010","2020","2030","No expiry"],"correct_index":1,"explanation":"The reservation extends up to 2020 under the 95th amendment (later extended onward by the 104th)."},
     {"question":"Which organisation compiles the Human Development Index?","options":["World Bank","IMF","UNDP","WTO"],"correct_index":2,"explanation":"UNDP publishes the HDI annually."},
     {"question":"The headquarters of the National Green Tribunal is in?","options":["New Delhi","Mumbai","Kolkata","Bhopal"],"correct_index":0,"explanation":"NGT sits in New Delhi."},
     {"question":"Ashoka''s Kalinga war is recorded in which Edict?","options":["Major Rock Edict XIII","Major Rock Edict I","Minor Rock Edict II","Pillar Edict VII"],"correct_index":0,"explanation":"Rock Edict XIII narrates the Kalinga war and its remorse."}
   ]'::jsonb);