/**
 * Landing page catalogue (Phase 3).
 *
 * Every page here is a real, crawlable URL with its own H1, original intro
 * copy, live job table, FAQ and links to neighbouring pages. Copy is written
 * once, describes how each recruiting body actually works, and never claims
 * vacancy numbers we do not have.
 *
 * Filters map onto `listJobs` (categorySlug / state / qualification / q).
 */

export type Faq = { question: string; answer: string };

export type LandingPage = {
  /** URL path segment family, used to build absolute paths. */
  kind: "qualification" | "state" | "category" | "bihar-org";
  slug: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  /** 100-200 words of original intro. Paragraphs. */
  intro: string[];
  faqs: Faq[];
  filters: {
    categorySlug?: string;
    state?: string;
    department?: string;
    qualification?: string;
    q?: string;
  };
  /** Neighbouring pages (path + label) rendered under the job table. */
  neighbours: { label: string; href: string }[];
};

/* ------------------------------------------------------------------ */
/* Qualification pages                                                 */
/* ------------------------------------------------------------------ */

const QUALIFICATION_PAGES: LandingPage[] = [
  {
    kind: "qualification",
    slug: "10th-pass",
    h1: "10th Pass Sarkari Naukri 2026 — Government Jobs for 10th Pass Candidates",
    metaTitle: "10th Pass Sarkari Naukri 2026: Govt Jobs, Eligibility & Apply",
    metaDescription:
      "Government jobs after 10th pass in 2026 — Railway, Police, Army, Driver, Constable and Group D posts. Check eligibility, age limit, last date and official apply links.",
    intro: [
      "A 10th pass qualification is the minimum for a large number of entry-level government jobs. Railway vacancies like RRB Group D Level 1, RPF Constable and ASM, state police constable and driver posts, Central Armed Police Forces constable recruitment, postal department multi-tasking staff and Class 4 / peon / chowkidar style local body work all accept matriculation or its equivalent.",
      "On this page we list every current vacancy that accepts a 10th pass candidate — with the post name, department, total vacancy, age limit, application fee, last date and the official notification and apply links. Every listing is verified against the recruiting body's own notification; where a notice does not mention a particular field we show nothing rather than guess.",
      "Most of these posts prefer candidates who also hold a driving licence, aITI trade, or a computer certificate, and almost all of them have an age relaxation for SC, ST, OBC, EWS and PwBD candidates. Read the eligibility section of each notification before applying — age limits and cut-offs are set by the conducting body and change with every cycle.",
    ],
    faqs: [
      {
        question: "Kya 10th pass sarkari naukri ke liye eligible hain?",
        answer:
          "Railway Group D, RPF Constable, police constable, MTS and several defence / local body posts accept a 10th pass certificate from a recognised board. Always check the minimum qualification printed in the official notification for the specific recruitment cycle.",
      },
      {
        question: "10th pass jobs mein age limit kitni hoti hai?",
        answer:
          "The usual pattern is 18-30 or 18-33 years with relaxation as per central/state norms for SC, ST, OBC, EWS and PwBD candidates. The exact limit is printed in the official advertisement for each recruitment.",
      },
      {
        question: "10th pass ke liye koi graduation zaroori hai kya?",
        answer:
          "No. Matriculation is sufficient for Group D, constable, driver, peon and peon-cum-chowkidar style posts. However, preferring aITI, a driving licence or a computer certificate can improve your chances in the document verification stage.",
      },
      {
        question: "Apply karne ke liye fees kitni lagti hai?",
        answer:
          "Fees are category-wise and set by the conducting body — general/OBC candidates typically pay a few hundred rupees, while SC, ST, and PwBD candidates are usually exempt. The exact figures are shown on each job page and in the official notification.",
      },
    ],
    filters: { qualification: "10th" },
    neighbours: [
      { label: "12th Pass Jobs", href: "/jobs/12th-pass" },
      { label: "ITI / Diploma Jobs", href: "/jobs/iti" },
      { label: "Graduate Jobs", href: "/jobs/graduate" },
      { label: "Railway Jobs", href: "/jobs/category/railway" },
      { label: "Police Jobs", href: "/jobs/category/police" },
    ],
  },
  {
    kind: "qualification",
    slug: "12th-pass",
    h1: "12th Pass Sarkari Naukri 2026 — Govt Jobs After Higher Secondary",
    metaTitle: "12th Pass Sarkari Naukri 2026: Jobs, Eligibility & Last Date",
    metaDescription:
      "Government jobs after 12th pass 2026 — SSC CHSL, Railway JE, Police Sub-Inspector, Clerk, Teaching and Nursing posts. Eligibility, age, fee and official apply links.",
    intro: [
      "A 12th pass (higher secondary / intermediate) qualification opens the largest band of government jobs in India: SSC CHSL, Railway Junior Engineer and Technician, police sub-inspector and clerk-cum-cashier posts, state clerk selections, teaching assistant and teacher recruitment for many states, and most GNM / B.Sc Nursing and paramedical entries that accept 10+2 with science.",
      "This page collects every live vacancy that accepts a 12th pass or equivalent qualification. Each listing shows the post name, department, vacancy count, age band, category-wise fee, last date and the official notification PDF — nothing is filled in that the notification does not state.",
      "For most of these posts the competition is high, so read the syllabus and pattern of the conducting body carefully before the deadline. Where an admit card or result has already been published for a recruitment, it is linked from the job page so you can follow the full cycle in one place.",
    ],
    faqs: [
      {
        question: "12th pass ke baad konsi sarkari naukri hoti hai?",
        answer:
          "SSC CHSL, Railway JE, police sub-inspector, clerk, teaching assistant, and nursing/paramedical posts are the most common. Any 12th pass or equivalent from a recognised board qualifies, unless the notification specifies a particular subject such as science for nursing or mathematics for railway JE.",
      },
      {
        question: "12th pass jobs ke liye age limit kya hai?",
        answer:
          "Most 12th level posts follow an 18-30 or 18-33 year band with age relaxation for reserved categories as per government norms. Always read the age and relaxation table in the official advertisement.",
      },
      {
        question: "Kya science mandatory hai 12th pass jobs ke liye?",
        answer:
          "For nursing, paramedical and some technical entries, 10+2 with science is required. For clerical and clerk-level posts, any stream is usually accepted unless the notification states otherwise.",
      },
    ],
    filters: { qualification: "12th" },
    neighbours: [
      { label: "10th Pass Jobs", href: "/jobs/10th-pass" },
      { label: "ITI / Diploma Jobs", href: "/jobs/iti" },
      { label: "Graduate Jobs", href: "/jobs/graduate" },
      { label: "Nursing Jobs", href: "/jobs/nursing" },
      { label: "SSC Jobs", href: "/jobs/category/ssc" },
    ],
  },
  {
    kind: "qualification",
    slug: "iti",
    h1: "ITI Sarkari Naukri 2026 — Government Jobs After ITI / Trade Course",
    metaTitle: "ITI Sarkari Naukri 2026: Govt Jobs After ITI, Eligibility & Apply",
    metaDescription:
      "ITI pass sarkari naukri 2026 — supervisor, technician, lineman, electrician, welder and artisan posts in government departments. Check eligibility, age, fee and official apply links.",
    intro: [
      "An ITI (Industrial Training Institute) trade certificate, or a diploma in a technical stream, makes you eligible for a large number of government technician and supervisor posts: CPWD and PWD junior engineer and supervisor roles, electricity board lineman and technician selections, railway technician and signal posts, state public works department draftsman and surveyor roles, and artisan and welder recruitment in PSU plants.",
      "The jobs listed here accept aITI certificate or a diploma in engineering or technology as the minimum qualification. Trade preference usually matters — posts that ask for a specific trade such as electrician, fitter, welder, turner or lineman want the matching ITI trade certificate.",
      "Because technical recruitment is often conducted by state-level boards, keep an eye on this page as well as your state's engineering and technical department notifications. Every job here shows the official apply link and notification so you can verify the trade and qualification requirements yourself.",
    ],
    faqs: [
      {
        question: "ITI ke baad konsi government job milti hai?",
        answer:
          "ITI certificate holders are eligible for technician, lineman, electrician, welder, artisan, supervisor and junior engineer posts in CPWD, electricity boards, railways, PSUs and state technical departments. The required trade must match the advertised trade.",
      },
      {
        question: "Kya diploma holders bhi apply kar sakte hain?",
        answer:
          "Yes. Most ITI-level posts accept an equivalent diploma in engineering or technology in addition to the ITI certificate, unless the notification explicitly restricts the recruitment to ITI candidates.",
      },
      {
        question: "ITI pass jobs mein age limit kitni hoti hai?",
        answer:
          "Typically 18-30 or 18-33 years with relaxation for reserved categories. Some PSU and technical departments also set a minimum age of 20-21 for certain trades.",
      },
    ],
    filters: { qualification: "diploma" },
    neighbours: [
      { label: "Diploma Jobs", href: "/jobs/diploma" },
      { label: "Engineering Jobs", href: "/jobs/engineering" },
      { label: "10th Pass Jobs", href: "/jobs/10th-pass" },
      { label: "12th Pass Jobs", href: "/jobs/12th-pass" },
      { label: "Railway Jobs", href: "/jobs/category/railway" },
    ],
  },
  {
    kind: "qualification",
    slug: "diploma",
    h1: "Diploma Sarkari Naukri 2026 — Government Jobs After Polytechnic Diploma",
    metaTitle: "Diploma Sarkari Naukri 2026: Polytechnic Govt Jobs & Eligibility",
    metaDescription:
      "Government jobs after diploma in engineering 2026 — junior engineer, assistant engineer, surveyor, draftsman and technician posts. Eligibility, age, fee and official apply links.",
    intro: [
      "A diploma in engineering or technology qualifies you for junior engineer, assistant engineer, surveyor, draftsman and technician roles across CPWD, PWD, water boards, electricity boards, railways, metros, mining departments and public sector undertakings. Many of these recruitment drives run through state technical departments and public service commissions.",
      "This page lists every current vacancy that accepts a diploma as the minimum qualification, along with the post name, department, vacancies, age band, application fee and last date. Diploma holders should also check the state's public works, electricity and water board sites, because a large share of diploma-level recruitment is announced only on those department portals.",
      "For diploma holders looking for a higher-pay scale, keep an eye on lateral-entry engineer recruitments that allow diploma holders to appear directly — eligibility for those is set by each department's own rules and must be read in the official notification.",
    ],
    faqs: [
      {
        question: "Diploma holders ke liye government jobs kaunse hain?",
        answer:
          "Junior engineer, assistant engineer, surveyor, draftsman, technician and operator posts in CPWD/PWD, electricity and water boards, railways, metro rail, mining and PSUs are the main options for diploma holders.",
      },
      {
        question: "Junior Engineer ke liye diploma kaunsa hona chahiye?",
        answer:
          "A diploma in civil, mechanical, electrical or the relevant engineering branch is normally required for JE posts. The exact branch is specified in each notification — always verify before applying.",
      },
      {
        question: "Diploma pass lateral entry se JE ban sakte hain kya?",
        answer:
          "Many departments allow diploma holders to appear directly in engineering recruitment without a degree. The exact eligibility (lateral entry, diploma-only or degree-required) is defined by the recruiting department in the official notification.",
      },
    ],
    filters: { qualification: "diploma" },
    neighbours: [
      { label: "ITI Jobs", href: "/jobs/iti" },
      { label: "Engineering Jobs", href: "/jobs/engineering" },
      { label: "12th Pass Jobs", href: "/jobs/12th-pass" },
      { label: "Graduate Jobs", href: "/jobs/graduate" },
    ],
  },
  {
    kind: "qualification",
    slug: "engineering",
    h1: "Engineering Sarkari Naukri 2026 — B.Tech / B.E Government Jobs",
    metaTitle: "Engineering Sarkari Naukri 2026: B.Tech Govt Jobs & Eligibility",
    metaDescription:
      "Government jobs after B.Tech / B.E 2026 — junior engineer, assistant engineer, GET and PSU technical posts. Eligibility, age, fee and official apply links.",
    intro: [
      "Engineers are recruited across civil services, public works departments, electricity boards, railways, defence establishments and public sector undertakings — from site engineer and junior engineer to graduate engineer trainee and assistant engineer. Degree in engineering or technology is the standard minimum qualification for these posts, and many of them use GATE score-based recruitment or the department's own selection test.",
      "This page lists every current vacancy that accepts a B.Tech, B.E or equivalent engineering degree. For each one we show the post name, department, vacancy count, age band, fee structure and last date, with the official notification and apply link so you can confirm the required branch and experience.",
      "Fresh graduate engineers who want a stable government career should also watch the state public service commission engineering cadre recruitments and PSU graduate engineer trainee drives, which usually accept candidates from any branch unless the notification narrows it.",
    ],
    faqs: [
      {
        question: "B.Tech pass candidates ke liye government jobs konsi hain?",
        answer:
          "Junior engineer, assistant engineer, site engineer, graduate engineer trainee (GET) and technical posts in CPWD, electricity boards, railways, defence and PSUs. Most require a degree in a relevant engineering branch.",
      },
      {
        question: "Kya GATE score government jobs ke liye zaroori hai?",
        answer:
          "Many PSU and state engineering recruitments accept a valid GATE score instead of a separate exam. Not every recruitment requires GATE — check the official notification for the selection method.",
      },
      {
        question: "Engineering jobs mein age limit kitni hoti hai?",
        answer:
          "For entry-level engineer posts the usual band is 18-30 or 21-30 years with relaxation for reserved categories. Some PSU drives prefer candidates below 30 years at the closing date of the application.",
      },
    ],
    filters: { qualification: "engineering" },
    neighbours: [
      { label: "ITI Jobs", href: "/jobs/iti" },
      { label: "Diploma Jobs", href: "/jobs/diploma" },
      { label: "Graduate Jobs", href: "/jobs/graduate" },
      { label: "Railway Jobs", href: "/jobs/category/railway" },
    ],
  },
  {
    kind: "qualification",
    slug: "nursing",
    h1: "Nursing Sarkari Naukri 2026 — Government Nursing Jobs (Staff Nurse, GNM, BSc)",
    metaTitle: "Nursing Sarkari Naukri 2026: Staff Nurse & GNM Govt Jobs",
    metaDescription:
      "Nursing sarkari naukri 2026 — Staff Nurse, ANM, GNM and BSc Nursing government jobs. Eligibility, age, fee, last date and official apply links for health departments.",
    intro: [
      "Nursing is one of the most in-demand government recruitment categories in India. Staff nurse, senior nurse, ANM (Auxiliary Nurse Midwife), GNM and BSc Nursing posts are advertised by state health departments, public hospitals, municipal corporations, railways, defence services and AIIMS-style institutions every year.",
      "This page collects every current nursing vacancy we have verified against an official notification, with the post name, department, vacancies, age limit, category-wise fee and last date. Most of these drives require 10+2 with science plus a GNM or BSc Nursing degree, and a valid state nursing council registration.",
      "Because a large share of nursing recruitment is announced on state health department and public service commission sites, we also recommend checking your state's health department website directly for the freshest circulars.",
    ],
    faqs: [
      {
        question: "Nursing sarkari naukri ke liye kya qualification chahiye?",
        answer:
          "Most staff nurse posts require 10+2 with science and a GNM or BSc Nursing degree, plus registration with the relevant State Nursing Council. Some ANM posts accept an ANM certificate instead.",
      },
      {
        question: "Staff nurse jobs age limit kitni hoti hai?",
        answer:
          "Usually 18-35 or 21-35 years for staff nurse posts, with relaxation as per central/state norms for reserved categories and, in some states, a concession for female candidates.",
      },
      {
        question: "Nursing council registration zaroori hai kya?",
        answer:
          "Yes. A valid registration from the State Nursing Council where the job is located is generally mandatory at the time of joining, and many notifications ask for the registration number in the application form.",
      },
    ],
    filters: { qualification: "medical" },
    neighbours: [
      { label: "12th Pass Jobs", href: "/jobs/12th-pass" },
      { label: "Graduate Jobs", href: "/jobs/graduate" },
      { label: "Bihar Health Jobs", href: "/bihar/bihar-health" },
      { label: "All Healthcare Jobs", href: "/jobs?status=all" },
    ],
  },
  {
    kind: "qualification",
    slug: "graduate",
    h1: "Graduate Sarkari Naukri 2026 — Government Jobs for Graduates",
    metaTitle: "Graduate Sarkari Naukri 2026: Govt Jobs After Graduation",
    metaDescription:
      "Government jobs after graduation 2026 — SSC CGL, bank PO, state civil service, PSU and clerk posts. Eligibility, age, fee, last date and official apply links.",
    intro: [
      "A bachelor's degree from a recognised university is the gateway to the largest pool of government recruitment in India: SSC CGL, IBPS PO and clerk, state public service commissions, UPSC, PSU and defence officer entries, and a large number of graduate-level clerical and field posts.",
      "This page lists every live vacancy that accepts graduation as the minimum qualification, with the post name, department, vacancies, age limit, category-wise fee and last date. Unlike many job portals we do not require you to guess the qualification — each listing is linked to its official notification so you can confirm whether your degree and stream meet the requirement.",
      "For most graduate posts the age band is 18-32 or 20-30 years with relaxation for reserved categories, and the selection usually involves a written exam, descriptive paper and document verification — sometimes an interview as well.",
    ],
    faqs: [
      {
        question: "Graduate level government jobs mein konsa exam hota hai?",
        answer:
          "SSC CGL, IBPS PO/Clerk, state PSC combined competitive exams, UPSC Civil Services and PSU officer recruitment are the main graduate-level exams. The pattern and syllabus for each is set by the conducting body.",
      },
      {
        question: "Graduate jobs ki age limit kya hoti hai?",
        answer:
          "Most graduate posts accept candidates aged 18-32 or 20-30 years with relaxation for SC, ST, OBC, EWS and PwBD candidates as per government norms. UPSC Civil Services allows a wider band with longer extensions.",
      },
      {
        question: "Koi bhi graduate degree chalegi ya specific subject chahiye?",
        answer:
          "Most graduate-level clerk and officer posts accept any subject. Some technical or field posts specify a required discipline, so always check the eligibility section of the official notification.",
      },
    ],
    filters: { qualification: "graduate" },
    neighbours: [
      { label: "Post Graduate Jobs", href: "/jobs/post-graduate" },
      { label: "12th Pass Jobs", href: "/jobs/12th-pass" },
      { label: "B.Ed / D.El.Ed Jobs", href: "/jobs/bed" },
      { label: "SSC Jobs", href: "/jobs/category/ssc" },
      { label: "Banking Jobs", href: "/jobs/category/banking" },
      { label: "Teaching Jobs", href: "/jobs/category/teaching" },
    ],
  },
  {
    kind: "qualification",
    slug: "post-graduate",
    h1: "Post Graduate Sarkari Naukri 2026 — Government Jobs After PG",
    metaTitle: "Post Graduate Sarkari Naukri 2026: PG Govt Jobs & Eligibility",
    metaDescription:
      "Government jobs after post-graduation 2026 — teaching, research, specialist officer and senior PSU posts. Eligibility, age, fee and official apply links.",
    intro: [
      "A master's degree opens senior and specialist government recruitment: university and college teaching posts, research assistant roles, specialist officer and deputy posts in PSUs and banks, and a range of senior administrative and technical positions in central and state departments.",
      "This page lists every current vacancy that requires a post-graduation degree as the minimum qualification. Teaching recruitment in particular — including Bihar TRE, KVS, NVS, DSSSB and state lecturer-level drives — falls into this category, alongside specialist and senior technical posts.",
      "Because these recruitments are few but highly competitive, each listing here shows the exact eligibility, age band and last date from the official notification so you can plan your application well in advance.",
    ],
    faqs: [
      {
        question: "Post graduate level government jobs konsi hain?",
        answer:
          "Teaching and lecturer posts, research roles, specialist and deputy-level positions in PSUs and banks, and senior administrative posts. Many accept an M.Sc., M.A., M.Com., M.Ed., MBA or equivalent master's degree.",
      },
      {
        question: "Teaching jobs ke liye PG mandatory hai kya?",
        answer:
          "For lecturer and higher academic posts a master's degree is usually required. For primary and upper-primary teacher recruitment, a B.Ed. or D.El.Ed with a CTET/SET qualification is typically accepted.",
      },
      {
        question: "PG jobs ki age limit kitni hoti hai?",
        answer:
          "PG-level government posts typically allow candidates aged 21-40 years with relaxation for reserved categories. Some university teaching posts allow a wider age band.",
      },
    ],
    filters: { qualification: "post-graduate" },
    neighbours: [
      { label: "Graduate Jobs", href: "/jobs/graduate" },
      { label: "B.Ed / D.El.Ed Jobs", href: "/jobs/bed" },
      { label: "Teaching Jobs", href: "/jobs/category/teaching" },
      { label: "Bihar TRE Jobs", href: "/bihar/bihar-tre" },
    ],
  },
  {
    kind: "qualification",
    slug: "bed",
    h1: "B.Ed / D.El.Ed Sarkari Naukri 2026 — Teaching Jobs for B.Ed Holders",
    metaTitle: "B.Ed Sarkari Naukri 2026: Teaching Govt Jobs & Eligibility",
    metaDescription:
      "B.Ed / D.El.Ed sarkari naukri 2026 — primary, upper primary and high school teacher recruitment (TRE, KVS, NVS, DSSSB, state TET). Eligibility and apply links.",
    intro: [
      "Teacher recruitment drives across India — Bihar TRE, KVS, NVS, DSSSB and the state-level TET-based selections — mostly require a B.Ed or D.El.Ed degree along with a valid CTET or state TET certificate for primary and upper primary levels, and a PG degree for lecturer posts.",
      "This page lists every current teaching vacancy that accepts a B.Ed or D.El.Ed qualification, with the post name, department, vacancies, age band, fee and last date. Teaching recruitment is announced in cycles, so the most recent notification is always the one to apply against — each listing here links to the official circular.",
      "Keep both your CTET/SET certificate and your B.Ed/D.El.Ed marksheet ready, because most teacher applications ask for the certification number at the time of applying.",
    ],
    faqs: [
      {
        question: "B.Ed se teacher ki sarkari naukri kaise milti hai?",
        answer:
          "State teacher recruitment like Bihar TRE, KVS, NVS and DSSSB accepts B.Ed or D.El.Ed holders for primary and upper primary posts, usually with a valid CTET/SET certificate. Lecturer-level posts require a PG degree.",
      },
      {
        question: "Kya CTET zaroori hai teaching job ke liye?",
        answer:
          "Yes. CTET (central) or the state TET is the minimum certification required for most primary and upper primary teacher posts in India. Keep the certificate number handy when filling the form.",
      },
      {
        question: "Teaching jobs ki age limit kitni hai?",
        answer:
          "Typically 18-40 years with relaxation for reserved categories, and many state drives allow a higher upper age limit with relaxation for female and differently-abled candidates.",
      },
    ],
    filters: { qualification: "bed" },
    neighbours: [
      { label: "Post Graduate Jobs", href: "/jobs/post-graduate" },
      { label: "Graduate Jobs", href: "/jobs/graduate" },
      { label: "Teaching Jobs", href: "/jobs/category/teaching" },
      { label: "Bihar TRE Jobs", href: "/bihar/bihar-tre" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Category pages (department family)                                  */
/* ------------------------------------------------------------------ */

const CATEGORY_PAGES: LandingPage[] = [
  {
    kind: "category",
    slug: "ssc",
    h1: "SSC Jobs 2026 — Staff Selection Commission Government Jobs",
    metaTitle: "SSC Jobs 2026: SSC CGL, CHSL, GD, MTS & Exam Calendar",
    metaDescription:
      "Latest SSC government jobs 2026 — CGL, CHSL, Multi Tasking, GD Constable and JE. Eligibility, age, fee, exam pattern, last date and official apply links.",
    intro: [
      "The Staff Selection Commission is one of the largest government recruiters in India, running national-level exams for central government ministries, departments and offices: Combined Graduate Level (CGL), Combined Higher Secondary (CHSL), Multi Tasking Staff and Groundsmen (MTS/Haulage), Constable (GD) in CAPFs, Stenographer, Junior Engineer and various departmental exams.",
      "This page tracks every current SSC vacancy with the post name, vacancy count, age limit, category-wise fee, exam pattern reference, last date and the official notification and apply links. SSC publishes notifications on its own portal and regional recruitment bureaus — we only list openings we can trace back to an official SSC circular.",
      "SSC exams follow an annual calendar, so prepare for the cycle rather than the last date. Check eligibility and relaxation clauses carefully, and remember that SSC applications are made on the official ssc.gov.in portal only.",
    ],
    faqs: [
      {
        question: "SSC ke konse konse exams hote hain?",
        answer:
          "The major SSC exams are CGL, CHSL, MTS, GD Constable (CAPF), Stenographer, JE and various departmental/regional exams. Each has its own eligibility, pattern and notification.",
      },
      {
        question: "SSC jobs ki age limit kitni hoti hai?",
        answer:
          "For most posts the band is 18-32 years with relaxation as per central government norms for SC, ST, OBC, EWS and PwBD candidates. GD Constable and some field posts have a lower ceiling.",
      },
      {
        question: "SSC ki application kaise karein?",
        answer:
          "Applications are submitted only through the official SSC portals (ssc.gov.in and the concerned regional bureau's website) during the application window printed in the notification. There is no middleman or paid shortcut.",
      },
    ],
    filters: { q: "SSC" },
    neighbours: [
      { label: "Graduate Jobs", href: "/jobs/graduate" },
      { label: "12th Pass Jobs", href: "/jobs/12th-pass" },
      { label: "10th Pass Jobs", href: "/jobs/10th-pass" },
      { label: "Railway Jobs", href: "/jobs/category/railway" },
    ],
  },
  {
    kind: "category",
    slug: "railway",
    h1: "Railway Jobs 2026 — Indian Railways Government Recruitment",
    metaTitle: "Railway Jobs 2026: RRB Group D, ALP, JE & NTPC Govt Jobs",
    metaDescription:
      "Latest Indian Railways jobs 2026 — RRB Group D, Assistant Loco Pilot, JE, Technician, NTPC, RPF andGRP. Eligibility, age, fee, last date and official apply links.",
    intro: [
      "Indian Railways recruits lakhs of candidates through the Railway Recruitment Boards (RRB) — central Railway Recruitment Board and its zonal boards. The main drives include RRB Group D Level 1, Assistant Loco Pilot, Junior Engineer, Technician, NTPC, Group C posts and Railway Protection Force constable recruitment.",
      "This page lists every current railway vacancy with the post name, zone or board, vacancies, age limit, category-wise fee, last date and the official notification and apply links. RRBs publish notifications on their own portals, and applications are accepted only there.",
      "Railway recruitment is one of the most competitive in India. Most Group D and ALP posts require a 10th pass (with ITI/diploma preferred for some trades), while JE and NTPC require a diploma or degree. Keep an eye on this page as new zones announce their cycles through the year.",
    ],
    faqs: [
      {
        question: "Railway jobs ke liye qualification kya chahiye?",
        answer:
          "RRB Group D and ALP mostly require 10th pass (ITI/diploma often preferred for specific trades), while JE and NTPC require a diploma or graduation in the relevant field. Age limits and relaxations follow railway recruitment rules.",
      },
      {
        question: "Railway jobs ki age limit kitni hoti hai?",
        answer:
          "The usual band is 18-33 years for Group D, ALP and RPF posts with relaxation for reserved categories as per railway norms. Some recruitment drives allow 15-27 for some categories — always check the official RRB notification.",
      },
      {
        question: "Railway ki application kahan se karein?",
        answer:
          "Railway applications are submitted only through the official RRB / Railway Recruitment Cell portals listed in the notification. Group D applications are centralised through the RRBC website; zone-based posts use the individual RRB portals.",
      },
    ],
    filters: { q: "Railway" },
    neighbours: [
      { label: "10th Pass Jobs", href: "/jobs/10th-pass" },
      { label: "ITI Jobs", href: "/jobs/iti" },
      { label: "Engineering Jobs", href: "/jobs/engineering" },
      { label: "Police Jobs", href: "/jobs/category/police" },
    ],
  },
  {
    kind: "category",
    slug: "banking",
    h1: "Banking Jobs 2026 — Bank PO, Clerk & IBPS Government Recruitment",
    metaTitle: "Banking Jobs 2026: Bank PO, Clerk & IBPS/SBI Govt Jobs",
    metaDescription:
      "Latest banking government jobs 2026 — IBPS PO/Clerk CRP, SBI PO, RBI Grade B and other bank recruitments. Eligibility, age, fee, last date and official apply links.",
    intro: [
      "Banking recruitment in India is coordinated largely by the Institute of Banking Personnel Selection (IBPS) for public sector banks, while each bank — SBI, RBI, NABARD, LIC and the regional banks — conducts its own selection for its own posts. The flagship exams are IBPS CRP PO and CRP Clerk, SBI Probationary Officer and Junior Associate, and RBI Grade B.",
      "This page collects every current banking vacancy with the post name, bank, vacancies, age limit, application fee, last date and the official notification and apply link. Every recruitment on this page can be traced to an official IBPS, bank or regulator circular.",
      "Banking exams have a preliminary and main stage, with separate cut-offs for each stage and different cut-offs by state and category. Prepare for the cycle — the prelims syllabus is shared across banks, so one preparation covers most of them.",
    ],
    faqs: [
      {
        question: "Banking jobs ke liye qualification kya chahiye?",
        answer:
          "A bachelor's degree in any discipline from a recognised university is required for IBPS PO, CRP Clerk, SBI PO and RBI Grade B. Final-year candidates can apply for many IBPS drives, subject to the notification's eligibility date.",
      },
      {
        question: "Banking jobs ki age limit kitni hoti hai?",
        answer:
          "The usual band is 20-30 years with relaxation for SC/ST/OBC/PwBD/EWS and ex-serviceman candidates as per government norms. The exact limits are printed in each bank's notification.",
      },
      {
        question: "IBPS aur SBI ki application kahan karein?",
        answer:
          "IBPS drives are applied for on the official ibps.in portal, while each bank posts its own vacancies on its career page (e.g. sbi.co.in/careers, rbi.org.in). Applications made through unofficial channels are invalid.",
      },
    ],
    filters: { q: "Bank" },
    neighbours: [
      { label: "Graduate Jobs", href: "/jobs/graduate" },
      { label: "SSC Jobs", href: "/jobs/category/ssc" },
      { label: "PSU Jobs", href: "/jobs/category/psu" },
    ],
  },
  {
    kind: "category",
    slug: "defence",
    h1: "Defence Jobs 2026 — Indian Army, Navy, Air Force & CAPF Recruitment",
    metaTitle: "Defence Jobs 2026: Indian Army, Navy, Air Force & CAPF Govt Jobs",
    metaDescription:
      "Latest Indian defence jobs 2026 — Agniveer, Army, Navy, Air Force, CAPF constable and officer entries. Eligibility, age, fee, last date and official apply links.",
    intro: [
      "Indian defence recruitment covers the permanent cadre — Indian Army, Indian Navy and Indian Air Force officer and airmen entries — as well as the Agniveer scheme and the Central Armed Police Forces (CAPF) constable recruitment run by SSC. Together these are among the most popular government careers in the country.",
      "This page lists every current defence vacancy we can verify from an official notification, with the post name, service or force, vacancies, age band, fee, last date and the official apply link. Defence recruitment is announced by the respective service HQ / recruitment portals and by SSC for CAPF posts.",
      "Selection usually involves a written exam followed by physical standard and medical tests, with a merit-based rally or SSB interview for officer entries. Age criteria and cut-offs differ sharply by entry type — read the official notification carefully.",
    ],
    faqs: [
      {
        question: "Defence jobs ke liye age limit kitni hoti hai?",
        answer:
          "Agniveer and constable entries usually allow 17-21 or 18-23 years, while officer entries through NDA, CDS and AFCAT allow an upper age of about 24-25 with relaxation for reserved categories as per service rules.",
      },
      {
        question: "Defence jobs ke liye qualification kya chahiye?",
        answer:
          "Agniveer and airmen entries accept 10th pass (with science and mathematics for technical Agniveer). Commissioned officer entries require a graduation degree, and NDA also accepts candidates in the final year of graduation.",
      },
      {
        question: "CAPF constable ki recruitment kaun karta hai?",
        answer:
          "Constable recruitment for CAPFs (BSF, CRPF, CISF, ITBP, SSB, RPF, Assam Rifles) is conducted by the Staff Selection Commission on behalf of the forces, and is advertised on ssc.gov.in.",
      },
    ],
    filters: { categorySlug: "defence" },
    neighbours: [
      { label: "Police Jobs", href: "/jobs/category/police" },
      { label: "10th Pass Jobs", href: "/jobs/10th-pass" },
      { label: "SSC Jobs", href: "/jobs/category/ssc" },
    ],
  },
  {
    kind: "category",
    slug: "police",
    h1: "Police Jobs 2026 — State Police Constable, SI & Sub-Inspector Vacancies",
    metaTitle: "Police Jobs 2026: Constable, SI & Sub-Inspector Govt Jobs",
    metaDescription:
      "Latest police government jobs 2026 — state police constable, sub-inspector, SI and special branch vacancies. Eligibility, age, physical standard, fee and official apply links.",
    intro: [
      "State police departments and armed police branches — Bihar Police, UP Police, Rajasthan Police, MP Police, Delhi Police and the many state forces — recruit constables, sub-inspectors and special branch personnel almost every year, making police recruitment one of the largest categories of government hiring.",
      "This page lists every current police vacancy with the post name, department, vacancies, age band, fee structure and last date, along with the official notification and apply link. Police recruitment also carries a Physical Standard Test (PST) and Physical Efficiency Test (PET) in addition to the written exam, so candidates should start fitness preparation early.",
      "Eligibility usually requires a 10th or 12th pass depending on the rank, a valid driving licence for vehicle posts, and an age band with relaxation as per state rules. Each notification sets its own standards — always check the official circular.",
    ],
    faqs: [
      {
        question: "Police constable ki age limit kitni hoti hai?",
        answer:
          "Most state police constable drives allow 18-23 or 18-25 years with relaxation for reserved categories, and often a concession for female candidates. Sub-inspector posts usually allow up to 28-30 years.",
      },
      {
        question: "Police jobs mein kya physical test hota hai?",
        answer:
          "Yes. After the written exam, candidates must clear a Physical Standard Test (height, chest, weight) and in many states a Physical Efficiency Test (running, long jump, shot put). Both have prescribed standards with relaxation for reserved categories.",
      },
      {
        question: "Police job ke liye qualification kya chahiye?",
        answer:
          "Constable recruitment typically requires a 10th pass (12th for some states or for driver roles), and sub-inspector posts usually require graduation. A driving licence is mandatory for vehicle-based constable posts.",
      },
    ],
    filters: { categorySlug: "defence" },
    neighbours: [
      { label: "10th Pass Jobs", href: "/jobs/10th-pass" },
      { label: "12th Pass Jobs", href: "/jobs/12th-pass" },
      { label: "Defence Jobs", href: "/jobs/category/defence" },
      { label: "Bihar Police Jobs", href: "/bihar/bihar-police" },
    ],
  },
  {
    kind: "category",
    slug: "teaching",
    h1: "Teaching Jobs 2026 — Teacher Recruitment (TRE, KVS, NVS, DSSSB)",
    metaTitle: "Teaching Jobs 2026: Teacher Recruitment (TRE, KVS, NVS) Govt Jobs",
    metaDescription:
      "Latest teaching government jobs 2026 — Bihar TRE, KVS, NVS, DSSSB and state TET-based teacher recruitment. Eligibility, CTET, age, fee and official apply links.",
    intro: [
      "Teacher recruitment in India happens in waves — the national KVS, NVS and DSSSB drives, the state-level TET-based teacher selection commissions, and the large Bihar Teacher Recruitment Examination (TRE) cycles that fill tens of thousands of primary and upper-primary posts.",
      "This page lists every current teaching vacancy with the post name, recruiting body, vacancies, age band, fee and last date, and the official notification and apply link. Most primary and upper primary teacher posts require a B.Ed or D.El.Ed along with a valid CTET or state TET certificate; lecturer posts require a PG degree.",
      "Teaching recruitment is highly competitive and announces large vacancy counts at once. Bookmark this page and also watch the recruiting body's own website, since applications are accepted only through the official portals mentioned in the notification.",
    ],
    faqs: [
      {
        question: "Teacher job ke liye kya qualification aur certificate chahiye?",
        answer:
          "Primary and upper primary teacher posts need a B.Ed or D.El.Ed with a valid CTET/SET certificate. Lecturer posts need a PG degree in the relevant subject, usually with a NET/SET preference.",
      },
      {
        question: "Teaching jobs ki age limit kitni hoti hai?",
        answer:
          "Most teacher drives allow 18-40 years with relaxation for reserved categories, and several states grant additional relaxation for female and differently-abled candidates. Check each notification for the exact limits.",
      },
      {
        question: "Bihar TRE mein apply kaise karein?",
        answer:
          "Bihar TRE applications are submitted through the official Bihar Education Department recruitment portal during the application window. Keep your B.Ed/D.El.Ed and CTET certificates ready, and apply only through the official link in the notification.",
      },
    ],
    filters: { categorySlug: "teaching" },
    neighbours: [
      { label: "B.Ed Jobs", href: "/jobs/bed" },
      { label: "Post Graduate Jobs", href: "/jobs/post-graduate" },
      { label: "Graduate Jobs", href: "/jobs/graduate" },
      { label: "Bihar TRE Jobs", href: "/bihar/bihar-tre" },
    ],
  },
  {
    kind: "category",
    slug: "psu",
    h1: "PSU Jobs 2026 — Public Sector Undertaking Government Jobs",
    metaTitle: "PSU Jobs 2026: Public Sector Undertaking Recruitment",
    metaDescription:
      "Latest PSU government jobs 2026 — graduate engineer trainee, management trainee, technician and officer recruitment in public sector undertakings. Eligibility and official apply links.",
    intro: [
      "Public Sector Undertakings recruit across the country for engineering (Graduate Engineer Trainee / GET through GATE), management (Management Trainee), and a wide range of executive, technician and artisan posts. PSUs like NTPC, IOC, GAIL, BHEL, IOCL, Power Grid and the banking and telecom PSUs announce vacancies through their own recruitment portals.",
      "This page lists every current PSU vacancy with the post name, undertaking, vacancies, age band, fee and last date, and the official notification and apply link. GET recruitment is usually conducted through GATE scores, while management and executive posts use the company's own selection process.",
      "Because PSU recruitment is company-specific, keep an eye on the career page of the undertaking you are targeting in addition to this page — each company publishes its own notification and accept applications only on its official portal.",
    ],
    faqs: [
      {
        question: "PSU jobs ke liye qualification kya chahiye?",
        answer:
          "GET posts require a degree in engineering (selected through GATE), management trainee posts accept any graduation with an MBA preferred, and technician/artisan posts accept ITI, diploma or aITI as applicable.",
      },
      {
        question: "GATE score se PSU mein apply kar sakte hain?",
        answer:
          "Yes — most PSU Graduate Engineer Trainee recruitment is done through GATE scores (valid for one to three years depending on the company and category). Some PSUs also conduct their own tests for executive posts.",
      },
      {
        question: "PSU jobs ki age limit kitni hoti hai?",
        answer:
          "Most PSU posts follow an upper age of 30 years with relaxation for SC/ST/OBC/PwBD/EWS and ex-servicemen candidates. Some PSU drives set the upper age at 35 for certain posts — the notification governs.",
      },
    ],
    filters: { categorySlug: "psu" },
    neighbours: [
      { label: "Engineering Jobs", href: "/jobs/engineering" },
      { label: "ITI Jobs", href: "/jobs/iti" },
      { label: "Graduate Jobs", href: "/jobs/graduate" },
      { label: "Banking Jobs", href: "/jobs/category/banking" },
    ],
  },
];

export const QUALIFICATION_PAGES_BY_SLUG: Record<string, LandingPage> =
  Object.fromEntries(QUALIFICATION_PAGES.map((p) => [p.slug, p]));
export const CATEGORY_PAGES_BY_SLUG: Record<string, LandingPage> =
  Object.fromEntries(CATEGORY_PAGES.map((p) => [p.slug, p]));

/** Short human labels for landing-page links (headers, footers, hubs). */
export const LANDING_LABELS: Record<string, string> = {
  "10th-pass": "10th Pass",
  "12th-pass": "12th Pass",
  iti: "ITI",
  diploma: "Diploma",
  engineering: "Engineering",
  nursing: "Nursing",
  graduate: "Graduate",
  "post-graduate": "Post Graduate",
  bed: "B.Ed / D.El.Ed",
  ssc: "SSC",
  railway: "Railway",
  banking: "Banking",
  defence: "Defence",
  police: "Police",
  teaching: "Teaching",
  psu: "PSU",
  bpsc: "BPSC",
  bssc: "BSSC",
  "bihar-police": "Bihar Police",
  "bihar-tre": "Bihar TRE",
  "bihar-health": "Bihar Health",
  "bihar-home-guard": "Bihar Home Guard",
  "bihar-jal-nigam": "Bihar Jal Nigam",
  "bihar-panchayat": "Bihar Panchayat",
};

export { QUALIFICATION_PAGES, CATEGORY_PAGES };