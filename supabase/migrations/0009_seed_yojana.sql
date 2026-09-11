-- Seed yojana (government schemes) content.
-- Upsert on slug so re-runs are safe.

insert into public.yojana (
  title, slug, level, state, description, benefits_summary,
  eligibility, benefits, how_to_apply, official_link, is_published
)
values
(
  'PM Kisan Samman Nidhi Yojana',
  'pm-kisan-samman-nidhi',
  'central',
  null,
  'PM-KISAN is a central scheme that provides income support of Rs 6,000 per year to all landholding farmer families across India.',
  'Rs 6,000/year income support for farmer families',
  'All landholding farmer families with cultivable land holding.',
  'Rs 6,000 per year in three equal instalments of Rs 2,000 each, transferred directly to the bank account of the beneficiary.',
  'Farmers can enrol online at the PM-Kisan portal by providing Aadhaar, land records and bank details.',
  'https://pmkisan.gov.in/',
  true
),
(
  'PM Awas Yojana (Gramin)',
  'pradhan-mantri-awas-yojana-gramin',
  'central',
  null,
  'Pradhan Mantri Awas Yojana-Gramin (PMAY-G) aims to provide a pucca house with basic amenities to every houseless household in rural India.',
  'Pucca house for every rural household',
  'Households that are houseless or living in kutcha/dilapidated houses and figure in the PMAY-G beneficiary list drawn on the basis of SECC-2011.',
  'Financial assistance for construction of a new house along with PMAY-G support for toilets, LPG connection, electricity and clean drinking water.',
  'Apply through the local Gram Panchayat office or the PMAY-G portal beneficiary selection process.',
  'https://pmayg.nic.in/',
  true
),
(
  'Ayushman Bharat Pradhan Mantri Jan Arogya Yojana',
  'ayushman-bharat-pmjay',
  'central',
  null,
  'Ayushman Bharat PM-JAY is the world''s largest health insurance scheme giving eligible families Rs 5 lakh cover per year for secondary and tertiary hospitalisation.',
  'Rs 5 lakh health cover per family per year',
  'Eligible families identified in the SECC-2011 database, with flexibility to any member of the household.',
  'Cashless treatment of Rs 5 lakh per family per year at empanelled hospitals, covering pre- and post-hospitalisation expenses.',
  'Check eligibility on the PM-JAY website and visit a nearby empanelled hospital with Voter ID/Aadhaar to obtain an e-card.',
  'https://pmjay.gov.in/',
  true
),
(
  'Atal Pension Yojana',
  'atal-pension-yojana',
  'central',
  null,
  'Atal Pension Yojana offers a guaranteed monthly pension of Rs 1,000 to 5,000 after the age of 60, aimed at the unorganised sector.',
  'Guaranteed monthly pension up to Rs 5,000 after 60',
  'Indian citizens aged 18-40 years with a savings bank account; contributions depend on age and desired pension.',
  'Guaranteed pension of Rs 1,000-5,000 per month after 60 years, with a spousal pension and government co-contribution for eligible subscribers.',
  'Open a National Pension System (NPS) account through a bank, post office, or online via the APY portal.',
  'https://www.pfrda.org.in/',
  true
),
(
  'Beti Bachao Beti Padhao Yojana',
  'beti-bachao-beti-padhao',
  'central',
  null,
  'Beti Bachao Beti Padhao is a tri-ministerial scheme for the survival, protection and education of the girl child across India.',
  'Survival, protection and education of the girl child',
  'Girl children under 10 years, their families and educational institutions covered through district-based campaigns.',
  'Focused interventions for girls'' enrolment and retention in schools, prevention of gender-biased sex selection, and awareness campaigns.',
  'Benefits reach beneficiaries through district collectors and schools; parents can contact their district BBBP nodal office for help.',
  'https://wcd.nic.in/bbbp-schemes',
  true
),
(
  'Sukanya Samriddhi Yojana',
  'sukanya-samriddhi-yojana',
  'central',
  null,
  'Sukanya Samriddhi Yojana (SSY) is a small-deposit scheme for the education and marriage of the girl child, offering high interest and tax benefits.',
  'High-interest small deposit for the girl child',
  'A girl child below 10 years; maximum deposits of Rs 1.5 lakh per year per girl.',
  'Attractive interest rate with tax benefit under Section 80C, tax-free maturity, and accounts operational for 21 years from opening.',
  'Open an SSY account in any post office or authorised commercial bank in the name of the girl child.',
  'https://www.indiapost.gov.in/',
  true
),
(
  'Chanakya Kalyan Yojana',
  'chanakya-kalyan-yojana',
  'state',
  'bihar',
  'Bihar government scheme providing online education and IT-training kits to economically weaker students under the state''s education assistance programmes.',
  'Education/IT assistance for disadvantaged students of Bihar',
  'Students of Bihar government schools belonging to economically weaker sections, as notified.',
  'Free online education kits, mobile/tablet and learning aids to support e-learning in rural Bihar.',
  'Apply through the beneficiary selection at the school or the Bihar education department portal.',
  'https://www.educationbihar.gov.in/',
  true
),
(
  'Bihar Rajya Vidyarthi Shikshit-va-Berozgar Bhatta Yojana',
  'bihar-unemployment-allowance',
  'state',
  'bihar',
  'Bihar unemployment allowance scheme providing monthly financial assistance to educated unemployed youth registered on the state''s service portal.',
  'Monthly unemployment allowance for educated youth of Bihar',
  'Unemployed youth aged 20-40 years with a qualification of Class 12 or above and registered on the Bihar Kaushal/Service portal.',
  'Monthly stipend (subject to budget) paid to eligible educated unemployed youth of the state.',
  'Register on the Bihar Service portal and complete the online application with education and bank details.',
  'https://yuvasamadhan.bihar.gov.in/',
  true
);

-- Ensure anything else (e.g. admin-created drafts) is left untouched.