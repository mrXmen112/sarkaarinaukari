/**
 * State and Bihar organisation landing pages (Phase 3).
 *
 * Bihar is the deepest section (34 of 91 active jobs) and gets its own
 * organisation pages. Other states get a factual hub page naming their public
 * service commission and main recruiting boards — no invented vacancy data.
 */

import type { LandingPage } from "./landingPages";

/* ------------------------------------------------------------------ */
/* Bihar organisation pages — /bihar/[org]                              */
/* ------------------------------------------------------------------ */

export const BIHAR_ORG_PAGES: LandingPage[] = [
  {
    kind: "bihar-org",
    slug: "bpsc",
    h1: "BPSC Jobs 2026 — Bihar Public Service Commission Vacancies",
    metaTitle: "BPSC Jobs 2026: Bihar PSC Vacancy, Prelims, Mains & Apply",
    metaDescription:
      "Latest BPSC government jobs 2026 — Combined Competitive, Combined Preliminary, Mains and departmental exams. Eligibility, age, fee, last date and official apply links.",
    intro: [
      "The Bihar Public Service Commission (BPSC) is the main recruiting agency for state civil services in Bihar. Its Combined Preliminary Examination (CSE) is the standard entry point for the Bihar Civil Service, followed by the Combined Main (Written) Examination and interview. BPSC also recruits for subordinate and departmental posts such as Block Agriculture Officer, Head Teacher, Assistant Professor and various administrative cadres.",
      "This page tracks every current BPSC vacancy with the post name, notification number, vacancies, age limit, category-wise fee, last date and the official apply link. BPSC publishes its notifications on bpsc.bih.nic.in and applications are made only through the commission's own portal.",
      "BPSC follows a well-known annual cycle — preliminary exam in a given year, mains and interview the following year — so aspirants should prepare for the cycle rather than the last date. Keep the official notification PDF with you; every eligibility and relaxation clause is set there.",
    ],
    faqs: [
      {
        question: "BPSC Combined Prelims ki age limit kya hai?",
        answer:
          "The usual band for the BPSC Combined Prelims is 20-37 years with relaxation for SC/ST/OBC and women candidates as per state rules. The exact limit for each cycle is printed in the official notification.",
      },
      {
        question: "BPSC ki application kahan se karein?",
        answer:
          "BPSC applications are submitted only through the official commission portal at bpsc.bih.nic.in during the application window. Requests to upload fees by other means should be treated as fake.",
      },
      {
        question: "BPSC ka exam pattern kya hota hai?",
        answer:
          "The Combined Preliminary exam has two objective papers — General Studies and General Aptitude/CSAT — followed by the Combined Main (Written) Exam and interview for the selected candidates. State-specific patterns are set in the official notification.",
      },
    ],
    filters: { department: "bpsc" },
    neighbours: [
      { label: "All Bihar Jobs", href: "/bihar" },
      { label: "BSSC Jobs", href: "/bihar/bssc" },
      { label: "Bihar Police Jobs", href: "/bihar/bihar-police" },
      { label: "Bihar TRE Jobs", href: "/bihar/bihar-tre" },
      { label: "BPSC Syllabus", href: "/syllabus/bpsc-70th-prelims" },
    ],
  },
  {
    kind: "bihar-org",
    slug: "bssc",
    h1: "BSSC Jobs 2026 — Bihar Staff Selection Commission Vacancies",
    metaTitle: "BSSC Jobs 2026: Bihar SSC Vacancy, CGL, Inter Level & Apply",
    metaDescription:
      "Latest BSSC government jobs 2026 — Combined Graduate Level, Inter Level, Stenographer and other Bihar Staff Selection Commission posts. Eligibility, age, fee and official apply links.",
    intro: [
      "The Bihar Staff Selection Commission (BSSC) is responsible for a large share of state-level recruitment in Bihar, from the Combined Graduate Level (CGL) and Intermediate Level examination drives to category-wise Stenographer, Typist, Assistant and lower-staff posts.",
      "This page lists every current BSSC vacancy with the post name, vacancies, age band, category-wise fee, last date and the official notification and apply link. BSSC advertisements are published on the commission's official website, and applications are accepted only there.",
      "Because BSSC recruitment happens in phases — CGL mains, intermediate level, and separate category cycles — this page updates as each notice is released. Check the official notification PDF for the reservation details, as they vary from cycle to cycle.",
    ],
    faqs: [
      {
        question: "BSSC CGL ke liye qualification kya hai?",
        answer:
          "BSSC CGL typically requires graduation in any discipline from a recognised university. Some posts set a preference for specific subjects or categories as per the notification.",
      },
      {
        question: "BSSC jobs ki age limit kitni hoti hai?",
        answer:
          "Most BSSC posts allow 18-37 years for general candidates with relaxation for SC/ST/OBC and women candidates as per state norms. The official notification sets the final limits for each cycle.",
      },
      {
        question: "BSSC form bharne ka official site kaunsa hai?",
        answer:
          "BSSC applications are submitted only through the official commission website. Always verify the URL from the notification PDF — fake BSSC form links circulate frequently.",
      },
    ],
    filters: { department: "bssc" },
    neighbours: [
      { label: "All Bihar Jobs", href: "/bihar" },
      { label: "BPSC Jobs", href: "/bihar/bpsc" },
      { label: "Bihar TRE Jobs", href: "/bihar/bihar-tre" },
      { label: "12th Pass Jobs", href: "/jobs/12th-pass" },
      { label: "Graduate Jobs", href: "/jobs/graduate" },
    ],
  },
  {
    kind: "bihar-org",
    slug: "bihar-police",
    h1: "Bihar Police SI 2026 — Notification, Vacancy, Eligibility & Apply",
    metaTitle: "Bihar Police SI 2026: Vacancy, Eligibility & Apply Online",
    metaDescription:
      "Bihar Police SI 2026 recruitment by CSBC — check notification status, vacancy, eligibility, physical test, fee and official apply link. No 2026 SI notice confirmed yet.",
    intro: [
      "Bihar Police Sub-Inspector (SI) recruitment is conducted by the Central Selection Board of Constable (CSBC) on behalf of the Bihar Police. CSBC publishes the official advertisement, application window, vacancy matrix and physical standards on csbc.bihar.gov.in. At the last audit no 2026 SI notification had been published, so dates and vacancy figures circulating on unofficial sites should be treated as unconfirmed.",
      "This page tracks the Bihar Police SI 2026 cycle and also lists current CSBC constable, driver, fireman, jail warder and prohibition constable vacancies. Every listing shows the post name, service, vacancies, age limit, fee, last date and the official source link so you can confirm the details before applying.",
      "Bihar Police selection normally includes a written examination followed by a Physical Standard Test and Physical Efficiency Test. Prepare for the physical standards alongside the syllabus — height, chest and running requirements are a common reason candidates are screened out — and apply only through the official CSBC portal.",
    ],
    faqs: [
      {
        question: "Has CSBC released the Bihar Police SI 2026 notification?",
        answer:
          "No official 2026 Sub-Inspector notification was found on the CSBC website at the last audit. Check csbc.bihar.gov.in for the current advertisement before relying on any date or vacancy figure.",
      },
      {
        question: "Bihar Police SI ke liye qualification aur age kya hai?",
        answer:
          "Sub-Inspector recruitment generally requires a bachelor's degree and an age within the range prescribed in the CSBC advertisement, with relaxation for reserved categories. The official notice sets the final eligibility.",
      },
      {
        question: "Bihar Police SI ki form kahan se bharein?",
        answer:
          "Applications are submitted only through the official CSBC portal linked in the advertisement. Fake form links circulate during recruitment season — verify the URL before paying any fee.",
      },
    ],
    filters: { department: "bihar-police" },
    neighbours: [
      { label: "All Bihar Jobs", href: "/bihar" },
      { label: "Police Jobs", href: "/jobs/category/police" },
      { label: "Defence Jobs", href: "/jobs/category/defence" },
      { label: "10th Pass Jobs", href: "/jobs/10th-pass" },
    ],
  },
  {
    kind: "bihar-org",
    slug: "bihar-tre",
    h1: "Bihar TRE 4.0 2026 — 33,320 Vacancy, Apply Online & Admit Card",
    metaTitle: "Bihar TRE 4.0 2026: Vacancy, Apply Online, Admit Card",
    metaDescription:
      "BPSC Bihar TRE 4.0 2026: 33,320 teacher posts, apply online from 25 September to 26 October 2026. Check eligibility, fee, exam pattern and official notice.",
    intro: [
      "Bihar TRE 4.0 is the fourth Bihar School Teacher Recruitment Examination, conducted by the Bihar Public Service Commission (BPSC) for the Education Department. Under Advertisement No. 15/2026 dated 22 September 2026, BPSC notified 32,388 posts and later added 932, taking the total to 33,320 vacancies for Primary, Middle, Secondary and Senior Secondary teachers.",
      "The online application window is 25 September to 26 October 2026. The application fee is ₹100 for all candidates; a biometric fee of ₹200 applies only to candidates without a national identity document, plus bank transaction charges. Complete the fee payment before submitting the form and check the BPSC notice for the exact cut-off. The exam date has not been announced in the advertisement.",
      "This page tracks the TRE 4.0 vacancy, eligibility, selection process, application link and admit card updates from BPSC. Applications are accepted only on bpsconline.bihar.gov.in. Read the official advertisement and any corrigendum before applying, because BPSC can revise the vacancy matrix or schedule.",
    ],
    faqs: [
      {
        question: "Bihar TRE 4.0 mein kitne post hain?",
        answer:
          "BPSC notified 32,388 posts in Advertisement No. 15/2026 and added 932 posts, taking the total to 33,320. The level-wise split is in the official advertisement.",
      },
      {
        question: "Bihar TRE 4.0 ki last date kya hai?",
        answer:
          "The online application closes on 26 October 2026. Check the BPSC notice for the exact fee-payment cut-off and pay before submitting the form.",
      },
      {
        question: "Bihar TRE 4.0 kis board conduct kar raha hai?",
        answer:
          "The Bihar Public Service Commission (BPSC) is conducting TRE 4.0. Applications are made through the BPSC online portal, not the BSSC portal.",
      },
      {
        question: "TRE 4.0 ka exam date kab hai?",
        answer:
          "The exam date has not been announced in the advertisement. Check the official BPSC website and notice board for the examination programme and admit card.",
      },
    ],
    filters: { department: "bihar-tre" },
    neighbours: [
      { label: "All Bihar Jobs", href: "/bihar" },
      { label: "B.Ed Jobs", href: "/jobs/bed" },
      { label: "Teaching Jobs", href: "/jobs/category/teaching" },
      { label: "Post Graduate Jobs", href: "/jobs/post-graduate" },
    ],
  },
  {
    kind: "bihar-org",
    slug: "bihar-health",
    h1: "Bihar Health Jobs 2026 — Staff Nurse, ANM, CHO & Health Department Vacancies",
    metaTitle: "Bihar Health Jobs 2026: Staff Nurse, ANM, CHO Govt Jobs",
    metaDescription:
      "Latest Bihar health government jobs 2026 — Staff Nurse, ANM, CHO, health worker and paramedical posts in the Bihar Health Department. Eligibility, fee and official apply links.",
    intro: [
      "The Bihar Health Department and its affiliated bodies — the State Health Society, the District Health Societies, the Institute of Medical Sciences and paramedical training institutes — recruit staff nurses, ANMs, community health officers, health workers and lab technicians across the state.",
      "This page lists every current Bihar health-sector vacancy with the post name, institution, vacancies, age band, fee structure, last date and the official notification and apply link. Recruitment is usually announced by the State Health Society Bihar or the relevant department.",
      "Most health-sector posts require 10+2 with science plus a nursing or paramedical qualification, and a valid registration with the relevant state council. Salary scales and allowances for Bihar health staff are set by the state government and reflected in the notification.",
    ],
    faqs: [
      {
        question: "Bihar health staff nurse ki qualification kya hai?",
        answer:
          "Staff nurse posts typically require 10+2 with science and a GNM or BSc Nursing degree, with registration from the Bihar State Nursing Council. Some posts accept an ANM certificate for ANM roles.",
      },
      {
        question: "Bihar health jobs ki age limit kitni hai?",
        answer:
          "Health worker and nurse posts generally allow 18-37 years with relaxation for reserved categories and female candidates as per state rules. Check the specific notification for final limits.",
      },
      {
        question: "Bihar health department ki form kahan se bharein?",
        answer:
          "Vacancies are advertised by the State Health Society Bihar and the Bihar Health Department. Apply only through the official link given in the notification.",
      },
    ],
    filters: { department: "bihar-health" },
    neighbours: [
      { label: "All Bihar Jobs", href: "/bihar" },
      { label: "Nursing Jobs", href: "/jobs/nursing" },
      { label: "12th Pass Jobs", href: "/jobs/12th-pass" },
      { label: "BPSC Jobs", href: "/bihar/bpsc" },
    ],
  },
  {
    kind: "bihar-org",
    slug: "bihar-home-guard",
    h1: "Bihar Home Guard Jobs 2026 — Home Guard & Civil Defence Vacancies",
    metaTitle: "Bihar Home Guard Jobs 2026: Eligibility, Age, Fee & Apply",
    metaDescription:
      "Latest Bihar Home Guard and Civil Defence government jobs 2026 — Home Guard, Chaukidar and Civil Defence vacancies. Eligibility, age limit, fee, last date and official apply links.",
    intro: [
      "Bihar Home Guard and Civil Defence recruitment, typically conducted through the Bihar Police / CSBC process, covers Home Guard, Chaukidar and Civil Defence roles that support policing and disaster response across the state. These posts have some of the most approachable eligibility criteria in the state, but competition is intense.",
      "This page lists every current Home Guard or Civil Defence vacancy with the post name, vacancies, age band, fee, last date and the official notification and apply link. Applications are made only through the official recruiting body portal named in the notification.",
      "Home Guard recruitment in Bihar has been conducted in phases with different age limits and district-wise allocation. Always verify the current phase's eligibility, physical standards and last date in the official notification before applying.",
    ],
    faqs: [
      {
        question: "Bihar Home Guard ke liye age limit kitni hai?",
        answer:
          "Home Guard cycles in Bihar have typically allowed candidates aged 18-30 (or up to 30 for some categories) with relaxation for reserved categories. The exact limit is printed in the official notification for the current phase.",
      },
      {
        question: "Home Guard ke liye qualification kya chahiye?",
        answer:
          "A 10th pass is generally the minimum requirement, though some phases specify additional physical standards. Check the notification for the current cycle.",
      },
      {
        question: "Home Guard form kahan se bharein?",
        answer:
          "Apply only through the official recruiting body portal linked in the Bihar Home Guard / Civil Defence notification. Unpaid or third-party form-filling sites are not authorised.",
      },
    ],
    filters: { q: "Home Guard" },
    neighbours: [
      { label: "All Bihar Jobs", href: "/bihar" },
      { label: "Bihar Police Jobs", href: "/bihar/bihar-police" },
      { label: "10th Pass Jobs", href: "/jobs/10th-pass" },
      { label: "Police Jobs", href: "/jobs/category/police" },
    ],
  },
  {
    kind: "bihar-org",
    slug: "bihar-jal-nigam",
    h1: "Bihar Jal Nigam Jobs 2026 — Water & Sanitation Mission Vacancies",
    metaTitle: "Bihar Jal Nigam Jobs 2026: JE, Technician & Sanitation Posts",
    metaDescription:
      "Latest Bihar Jal Nigam and Jal Jeevan Mission jobs 2026 — junior engineer, technician, operator and sanitation posts. Eligibility, age, fee and official apply links.",
    intro: [
      "Bihar Jal Nigam and the State Jal Jeevan Mission (urban and rural water supply) recruit junior engineers, technicians, pump operators, plumbers and sanitation staff to run and expand water supply infrastructure across the state. These vacancies are usually advertised by the mission and its urban/rural executing agencies.",
      "This page lists every current Bihar water-supply or Jal Nigam vacancy with the post name, agency, vacancies, age band, fee, last date and the official notification and apply link. Eligibility for engineering posts usually requires a diploma or degree in civil/environmental engineering; technician and operator posts accept ITI or diploma.",
      "Because these projects are funded and executed by multiple agencies, the recruiting body changes from notice to notice — apply only through the official link in the notification, and keep your engineering or ITI documents ready.",
    ],
    faqs: [
      {
        question: "Bihar Jal Nigam JE ke liye qualification kya hai?",
        answer:
          "Junior Engineer posts usually accept a diploma or degree in civil engineering (or related branch) from a recognised institution. Technician and operator posts commonly accept ITI or diploma in the relevant trade.",
      },
      {
        question: "Jal Nigam jobs ki age limit kitni hai?",
        answer:
          "Technical posts generally allow 18-30 years (sometimes up to 37) with relaxation for reserved categories as per the recruiting agency's rules. The notification sets the final limits.",
      },
      {
        question: "Jal Jeevan Mission ki recruitment kahan hoti hai?",
        answer:
          "Vacancies are advertised by Bihar Jal Nigam, the State Jal Jeevan Mission and the executing urban/rural bodies. Apply only through the official portal mentioned in the notification.",
      },
    ],
    filters: { q: "Jal" },
    neighbours: [
      { label: "All Bihar Jobs", href: "/bihar" },
      { label: "ITI Jobs", href: "/jobs/iti" },
      { label: "Diploma Jobs", href: "/jobs/diploma" },
      { label: "Engineering Jobs", href: "/jobs/engineering" },
    ],
  },
  {
    kind: "bihar-org",
    slug: "bihar-panchayat",
    h1: "Bihar Panchayat Jobs 2026 — Gram Kachahari & Panchayat Secretary Vacancies",
    metaTitle: "Bihar Panchayat Jobs 2026: Gram Kachahari, Secretary Posts",
    metaDescription:
      "Latest Bihar Panchayat and Rural Development jobs 2026 — Gram Kachahari, Panchayat Secretary and Gram Rozgar Sevak vacancies. Eligibility, age, fee and official apply links.",
    intro: [
      "Bihar's Panchayati Raj and Rural Development departments recruit for local self-government posts — Gram Kachahari, Panchayat Secretary, Gram Rozgar Sevak and similar village and block-level roles. These are among the most accessible state government jobs in Bihar for local candidates.",
      "This page lists every current Panchayati Raj or Rural Development vacancy with the post name, department, vacancies, age band, fee, last date and the official notification and apply link. Recruitment for these posts is usually conducted by the Rural Development Department or the District Rural Development Agency.",
      "Eligibility is generally a 10th or 12th pass with a preference for candidates from the same panchayat area, and age limits follow state norms with relaxation. Read the official notification for the exact local-reservation clause for the current cycle.",
    ],
    faqs: [
      {
        question: "Gram Kachahari ke liye qualification kya hai?",
        answer:
          "Gram Kachahari posts usually require a 10th or 12th pass, with a preference for candidates who are residents of the concerned panchayat. The exact requirement is in the official notification.",
      },
      {
        question: "Panchayat jobs ki age limit kitni hai?",
        answer:
          "Local body posts in Bihar generally allow candidates aged 18-40 with relaxation for reserved categories and female candidates as per state rules.",
      },
      {
        question: "Panchayat ki form kahan se nikalte hain?",
        answer:
          "Vacancies are advertised by the Rural Development Department and the DRDA offices. Apply through the official link in the notification only.",
      },
    ],
    filters: { department: "bihar-panchayat" },
    neighbours: [
      { label: "All Bihar Jobs", href: "/bihar" },
      { label: "BPSC Jobs", href: "/bihar/bpsc" },
      { label: "10th Pass Jobs", href: "/jobs/10th-pass" },
      { label: "12th Pass Jobs", href: "/jobs/12th-pass" },
    ],
  },
];

export const BIHAR_ORG_PAGES_BY_SLUG: Record<string, LandingPage> =
  Object.fromEntries(BIHAR_ORG_PAGES.map((p) => [p.slug, p]));

/* ------------------------------------------------------------------ */
/* Bihar cross-section guides — /bihar/[guide]                         */
/* ------------------------------------------------------------------ */

export const BIHAR_GUIDE_PAGES: LandingPage[] = [
  {
    kind: "qualification",
    slug: "12th-pass-jobs",
    h1: "Bihar 12th Pass Jobs 2026 — Intermediate Government Vacancies",
    metaTitle: "Bihar 12th Pass Jobs 2026: Latest Government Vacancies",
    metaDescription:
      "Bihar 12th pass government jobs 2026 with post name, vacancy, eligibility, age limit, last date and application fee. Check official details before applying.",
    intro: [
      "Bihar recruits intermediate-pass candidates into several state services every year. The biggest routes are the BSSC Inter Level examination, CSBC constable and excise constable recruitment, Bihar Home Guard, Gram Rozgar Sevak, Gram Kachahari clerk, health worker posts and Bihar State Road Transport conductor recruitment. Each drive has its own eligibility, physical standard or skill requirement, so a 12th pass certificate alone does not make every post open to you.",
      "This page collects current Bihar government vacancies whose official eligibility accepts 12th pass or intermediate. For each post we show the recruiting body, post name and last date, plus the application source we hold; vacancy, age and fee figures appear only when the official notification publishes them. Where a notification does not publish a figure, the page shows nothing rather than filling the gap with a guess.",
      "Read the qualification clause carefully before applying. Police and Home Guard posts usually add height, chest, running and document requirements; conductor and clerk posts may require a driving licence or computer knowledge; health worker posts can require MPHW training. Age relaxation and local-residence rules are set by the recruiting body and change with every cycle.",
    ],
    faqs: [
      {
        question: "Bihar 12th pass jobs ke liye minimum qualification kya hai?",
        answer:
          "A 12th pass or intermediate certificate from a recognised board is the baseline for these posts. Some vacancies also require physical standards, a driving licence, computer knowledge, MPHW training or a Bihar domicile certificate, as stated in the official notification.",
      },
      {
        question: "Bihar mein 12th pass ke baad kaunsi sarkari naukri hoti hai?",
        answer:
          "Common routes include BSSC Inter Level, Bihar Police constable, excise constable, Home Guard, Gram Rozgar Sevak, Gram Kachahari clerk, health worker and BSRTC conductor recruitment. Availability changes with each recruitment cycle.",
      },
      {
        question: "Bihar 12th pass jobs ki age limit kitni hoti hai?",
        answer:
          "Age limits differ by post and recruiting body. Many entry-level posts use an 18-37 year band with relaxation for SC, ST, OBC, EWS, women and PwBD candidates under state rules. The exact limit is printed in the official advertisement.",
      },
      {
        question: "Bihar 12th pass job ke liye form kahan se bharein?",
        answer:
          "Apply only on the official portal named in the notification — for example the BSSC or CSBC website for their respective drives. This page links each job to its own official source and never collects an application fee.",
      },
    ],
    filters: { state: "bihar", qualification: "12th" },
    neighbours: [
      { label: "All Bihar Jobs", href: "/bihar" },
      { label: "All 12th Pass Jobs", href: "/jobs/12th-pass" },
      { label: "BPSC Jobs", href: "/bihar/bpsc" },
      { label: "BSSC Jobs", href: "/bihar/bssc" },
      { label: "Bihar Police Jobs", href: "/bihar/bihar-police" },
      { label: "Bihar Home Guard Jobs", href: "/bihar/bihar-home-guard" },
    ],
  },
];

export const BIHAR_GUIDE_PAGES_BY_SLUG: Record<string, LandingPage> =
  Object.fromEntries(BIHAR_GUIDE_PAGES.map((p) => [p.slug, p]));

/* ------------------------------------------------------------------ */
/* State pages — /jobs/state/[state]                                   */
/* ------------------------------------------------------------------ */

type StateSeed = {
  slug: string;
  /** Recruiters named honestly in the intro (well-known public bodies). */
  bodies: string;
  /** One-line, factual summary used in the intro. */
  highlight: string;
};

const STATE_SEEDS: StateSeed[] = [
  {
    slug: "bihar",
    bodies:
      "Bihar Public Service Commission (BPSC), Bihar Staff Selection Commission (BSSC), CSBC for Bihar Police, the Bihar Education Department for TRE, and the State Health Society for health posts",
    highlight:
      "Bihar has the widest recruitment calendar in the eastern region — civil services, police, teaching, health and rural development posts open together almost every month.",
  },
  {
    slug: "uttar-pradesh",
    bodies:
      "Uttar Pradesh Public Service Commission (UPPSC), UP Police Recruitment and Promotion Board (UPPBPB), UPSSSC and the State Health Society",
    highlight:
      "UPPSC combined competitive and subordinate services exams, police constable recruitment and UPSSSC group-level posts form the bulk of Uttar Pradesh government hiring.",
  },
  {
    slug: "madhya-pradesh",
    bodies:
      "Madhya Pradesh Public Service Commission (MPPSC), MP Employees Selection Board (MPESB) and the MP Police Recruitment Board",
    highlight:
      "MPPSC carries out the state civil services and subordinate services selection, while MPESB handles teacher and other staff recruitment.",
  },
  {
    slug: "rajasthan",
    bodies:
      "Rajasthan Public Service Commission (RPSC), Rajasthan Staff Selection Board (RSSB) and the Rajasthan Police Recruitment Board",
    highlight:
      "RAS and RPSC combined competitive services, plus RSSB teacher and subordinate board exams, drive most Rajasthan recruitment.",
  },
  {
    slug: "west-bengal",
    bodies:
      "West Bengal Public Service Commission (WBPSC), West Bengal Police Recruitment Board (WBPREB) and the West Bengal Health Recruitment Board",
    highlight:
      "WBCS and the general recruitment exams run by WBPSC, alongside WBPREB police recruitment, are the main state government drives.",
  },
  {
    slug: "tamil-nadu",
    bodies:
      "Tamil Nadu Public Service Commission (TNPSC), Tamil Nadu Police Recruitment Board and the Tamil Nadu Teachers Recruitment Board (TRB)",
    highlight:
      "TNPSC group examinations, including the combined civil services and group executive exams, run continuously through the year.",
  },
  {
    slug: "karnataka",
    bodies:
      "Karnataka Public Service Commission (KPSC) and the Karnataka Police Department recruitment",
    highlight:
      "KPSC conducts the Karnataka Administrative Service and the general gazetted probationer recruitment that feeds most state departments.",
  },
  {
    slug: "gujarat",
    bodies:
      "Gujarat Public Service Commission (GPSC) and the Gujarat Police Recruitment Board",
    highlight:
      "GPSC runs the deputy collector and state civil service selection along with subordinate service exams.",
  },
  {
    slug: "maharashtra",
    bodies:
      "Maharashtra Public Service Commission (MPSC) and the Maharashtra Police Recruitment Board",
    highlight:
      "MPSC combined preliminary and main examinations recruit into the Maharashtra Civil Service and allied cadres.",
  },
  {
    slug: "punjab",
    bodies:
      "Punjab Public Service Commission (PPSC) and the Punjab Subordinate Services Selection Board (PSSSB)",
    highlight:
      "PSSSB runs most group-level and subordinate staff recruitment in Punjab, while PPSC conducts the civil service selection.",
  },
  {
    slug: "haryana",
    bodies:
      "Haryana Public Service Commission (HPSC) and the Haryana Staff Selection Commission (HSSC)",
    highlight:
      "HSSC conducts the large group C and D recruitment drives while HPSC handles the civil services.",
  },
  {
    slug: "telangana",
    bodies:
      "Telangana Public Service Commission (TGPSC) and the Telangana Police Recruitment Board",
    highlight:
      "TGPSC group examinations recruit officers into the Telangana civil services and revenue departments.",
  },
  {
    slug: "andhra-pradesh",
    bodies:
      "Andhra Pradesh Public Service Commission (APPSC) and the AP Police Recruitment Board",
    highlight:
      "APPSC group exams recruit into the Andhra Pradesh civil services, with the police board running constable recruitment.",
  },
  {
    slug: "odisha",
    bodies:
      "Odisha Public Service Commission (OPSC) and the Odisha Police Recruitment Board",
    highlight:
      "OPSC combined competitive examinations recruit officers across Odisha civil services and administration.",
  },
  {
    slug: "jharkhand",
    bodies:
      "Jharkhand Public Service Commission (JPSC) and the Jharkhand Police Recruitment Board",
    highlight:
      "JPSC combined civil services and subordinate services examinations are the main Jharkhand recruitment drives.",
  },
  {
    slug: "chhattisgarh",
    bodies:
      "Chhattisgarh Public Service Commission (CGPSC) and the Chhattisgarh Police Recruitment Board",
    highlight:
      "CGPSC runs the state civil service and subordinate service examinations across Chhattisgarh.",
  },
  {
    slug: "kerala",
    bodies:
      "Kerala Public Service Commission (KPSC) and the Kerala Police Recruitment Board",
    highlight:
      "KPSC conducts the Kerala administrative service and department-specific examinations throughout the year.",
  },
  {
    slug: "assam",
    bodies:
      "Assam Public Service Commission (APSC) and the Assam Police Recruitment Board",
    highlight:
      "APSC combines civil services and subordinate services examinations, complemented by Assam Rifles recruitment.",
  },
  {
    slug: "uttarakhand",
    bodies:
      "Uttarakhand Public Service Commission (UKPSC) and the Uttarakhand Police Recruitment Board",
    highlight:
      "UKPSC conducts combined state civil services examinations and subordinate selection drives.",
  },
  {
    slug: "himachal-pradesh",
    bodies:
      "Himachal Pradesh Public Service Commission (HPPSC) and the Himachal Pradesh Subordinate Services Selection Board (HPSSSB)",
    highlight:
      "HPSSSB handles most clerk and subordinate recruitment while HPPSC runs the civil services selection.",
  },
  {
    slug: "goa",
    bodies: "Goa Public Service Commission and the Goa Police recruitment",
    highlight:
      "Goa PSC recruits for the Goa civil service and departmental posts across a relatively small state establishment.",
  },
  {
    slug: "jammu-kashmir",
    bodies:
      "Jammu and Kashmir Public Service Commission (JKPSC) and the J&K Police Recruitment Board",
    highlight:
      "JKPSC runs the civil services examination while the police board handles constable recruitment.",
  },
  {
    slug: "delhi",
    bodies:
      "Delhi Subordinate Services Selection Board (DSSSB), the Delhi Police and the Delhi administration recruitment",
    highlight:
      "DSSSB drives most teaching, nursing and clerical recruitment for Delhi government schools and hospitals, alongside Delhi Police constable recruitment.",
  },
  {
    slug: "manipur",
    bodies: "Manipur Public Service Commission and the state police recruitment",
    highlight:
      "MPSC conducts civil services and combined competitive examinations for the state.",
  },
  {
    slug: "meghalaya",
    bodies: "Meghalaya Public Service Commission",
    highlight:
      "Meghalaya PSC runs combined competitive services examinations for state civil services posts.",
  },
  {
    slug: "mizoram",
    bodies: "Mizoram Public Service Commission",
    highlight:
      "Mizoram PSC conducts civil services and departmental recruitment for the state.",
  },
  {
    slug: "nagaland",
    bodies: "Nagaland Public Service Commission",
    highlight:
      "NPSC runs the combined technical and administrative services examinations for Nagaland.",
  },
  {
    slug: "sikkim",
    bodies: "Sikkim Public Service Commission",
    highlight:
      "Sikkim PSC recruits for civil services and subordinate posts across the state.",
  },
  {
    slug: "tripura",
    bodies: "Tripura Public Service Commission and the state police recruitment",
    highlight:
      "TPSC conducts civil services and combined competitive examinations for Tripura.",
  },
];

function stateLabelText(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Build the state page config for one state slug. */
export function buildStatePage(slug: string): LandingPage | null {
  const seed = STATE_SEEDS.find((s) => s.slug === slug);
  if (!seed) return null;
  const name = stateLabelText(slug);
  const isBihar = slug === "bihar";

  const intro = [
    `Government jobs in ${name} are advertised by a small set of public bodies, and most aspirants only need to track a handful of them. The main recruiters are ${seed.bodies}. ${seed.highlight}`,
    `This page lists every current ${name} vacancy that we have verified against an official notification — the post name, department, total vacancy, age limit, category-wise fee, last date and the official apply link. Where a notification does not state a field, we show nothing rather than guessing, and we never list a vacancy we cannot trace to a government source.`,
    isBihar
      ? "Because Bihar is our deepest state section, each major recruiting body also has its own page with dedicated eligibility, exam-pattern and notification detail. Start with the organisation pages below if you want to go deeper than the combined list."
      : `Recruitment calendars in ${name} follow an annual cycle, so preparing for the next round matters more than reacting to the last date. Bookmark this page and check the recruiting body's own website for the freshest circulars — applications are accepted only through official portals.`,
  ];

  const faqs = [
    {
      question: `${name} mein government jobs kaise dhundh sakte hain?`,
      answer: `The standard route is the public service commission and the main staff selection board of the state — in this case ${seed.bodies}. Official notices are published on their websites, and this page tracks every such vacancy we can verify.`,
    },
    {
      question: `${name} sarkari naukri ki age limit kitni hoti hai?`,
      answer: `Most ${name} government posts follow an age band between 18 and 30-37 years with relaxation for SC, ST, OBC, EWS, PwBD and, in many states, female candidates. The exact limit is printed in each official notification.`,
    },
    {
      question: `${name} government job apply karne ka official tareeka kya hai?`,
      answer: `Applications are submitted only through the official portal of the recruiting body named in the notification. Never pay anyone for form-filling on unofficial sites — no legitimate recruitment requires that.`,
    },
  ];

  return {
    kind: "state",
    slug,
    h1: `${name} Government Jobs 2026 — ${name} Sarkari Naukri`,
    metaTitle: `${name} Sarkari Naukri 2026: Government Jobs in ${name}`,
    metaDescription: `Latest government jobs in ${name} 2026 — PSC, police, teaching, health and PSU vacancies with eligibility, age, fee, last date and official apply links, verified against official notifications.`,
    intro,
    faqs,
    filters: { state: slug },
    neighbours: isBihar
      ? [
          { label: "BPSC Jobs", href: "/bihar/bpsc" },
          { label: "BSSC Jobs", href: "/bihar/bssc" },
          { label: "Bihar Police Jobs", href: "/bihar/bihar-police" },
          { label: "Bihar TRE Jobs", href: "/bihar/bihar-tre" },
          { label: "Bihar Health Jobs", href: "/bihar/bihar-health" },
        ]
      : [
          { label: "Bihar Jobs", href: "/jobs/state/bihar" },
          { label: "All India Jobs", href: "/jobs" },
          { label: "Graduate Jobs", href: "/jobs/graduate" },
          { label: "SSC Jobs", href: "/jobs/category/ssc" },
        ],
  };
}

export const STATE_SLUGS = STATE_SEEDS.map((s) => s.slug);