-- ============================================================================
-- Seed data — Phase 15: additional sarkari yojana schemes.
--
-- Upsert on slug so re-runs are safe. Adds major central schemes and
-- Bihar-specific schemes to complement the 8 schemes in 0009_seed_yojana.sql.
--
-- Run:  supabase db push
-- ============================================================================

insert into public.yojana (
  title, slug, level, state, description, benefits_summary,
  eligibility, benefits, how_to_apply, official_link, is_published
)
values
  (
    'Pradhan Mantri Fasal Bima Yojana',
    'pm-fasal-bima',
    'central',
    null,
    'Pradhan Mantri Fasal Bima Yojana (PMFBY) is a crop insurance scheme providing financial support to farmers suffering crop loss/damage due to unforeseen events.',
    'Financial compensation for crop loss up to 2x premium for Kharif and Rabi crops',
    'All farmers growing notified crops in notified areas. Share croppers also eligible.',
    'Compensation is transferred directly to the bank account of the farmer after loss assessment. Premium is subsidized: 2% for Kharif, 1.5% for Rabi, 5% for commercial/horticultural crops.',
    'Farmers can enrol through the nearest agriculture officer or online at the PMFBY portal.',
    'https://pmfby.gov.in/',
    true
  ),
  (
    'Pradhan Mantri Kisan Maan-Dhan Yojana',
    'pm-kisan-man-dhan',
    'central',
    null,
    'Pension scheme for small and marginal farmers providing Rs 3,000/month pension after the age of 60.',
    'Rs 3,000/month pension after 60 years',
    'Small and marginal farmers with cultivable land up to 2 hectares, aged 18-40 years.',
    'Monthly pension of Rs 3,000 from age 60. The subscriber contributes Rs 55-200/month depending on age of entry; the Centre matches the contribution.',
    'Register at Common Service Centres (CSC) or through the PM-KISAN portal with Aadhaar and land documents.',
    'https://pmkmy.gov.in/',
    true
  ),
  (
    'Pradhan Mantri Viksit Bharat Rozgar Yojana',
    'pm-vibrant-rojgar',
    'central',
    null,
    'Employment incentive scheme for first-time employees in the formal sector. The government provides one month wage (up to Rs 15,000) as a gift directly to the employee''s account.',
    'One month wage up to Rs 15,000 for first-time employees',
    'First-time employees registered in the EPFO with salary up to Rs 1 lakh/month.',
    'One month wage (up to Rs 15,000) transferred directly to the bank account of the new employee within two months of joining.',
    'No separate registration required — EPFO automatically identifies eligible first-time employees and transfers the benefit.',
    'https://www.epfindia.gov.in/',
    true
  ),
  (
    'PM Matsya Sampada Yojana (PMMSY)',
    'pm-matsya-sampada',
    'central',
    null,
    'Pradhan Mantri Matsya Sampada Yojana is a flagship scheme for the holistic development of the fisheries and aquaculture sector with an aim to double the income of fishers and fish farmers.',
    'Infrastructure development and income doubling for fishers and fish farmers',
    'Fish farmers, fishers, and stakeholders in the fisheries sector across India.',
    'Financial support for infrastructure including fishing harbours, cold chains, aquaculture parks, and skill development. Benefits up to Rs 55,000 per hectare for aquaculture.',
    'Apply through the Fisheries Department or the PMMSY portal with relevant documents.',
    'https://www.pmmsy.gov.in/',
    true
  ),
  (
    'Pradhan Mantri Shram Yogi Maan-dhan',
    'pm-shram-yogi',
    'central',
    null,
    'Unorganized workers pension scheme providing Rs 3,000/month pension after 40 years of age for workers in the unorganized sector.',
    'Rs 3,000/month pension after age 40 for unorganized workers',
    'Unorganized workers aged 18-40 years with monthly income up to Rs 15,000.',
    'Monthly pension of Rs 3,000 after the age of 40. The subscriber contributes Rs 55-200/month depending on entry age; the Centre matches the contribution.',
    'Register at Common Service Centres (CSC) or through the PM-Shram Yogi portal with Aadhaar and identity proof.',
    'https://www.pmshramyogimaandhan.gov.in/',
    true
  ),
  (
    'Bihar Student Scholarship',
    'bihar-student-scholarship',
    'state',
    'bihar',
    'Bihar government scholarship schemes for students pursuing various courses from matriculation to postgraduate level to encourage education among economically weaker sections.',
    'Financial assistance for Bihar students from Class 1 to PG',
    'Bihar domicile students with family income below specified limits. Available for matriculation, intermediate, degree, and PG students.',
    'Scholarship amounts vary by class level and category, ranging from Rs 200 to Rs 10,000 per month. Amounts are credited directly to the student''s bank account.',
    'Apply through the Bihar Student Scholarship portal with income certificate, caste certificate, and bank details.',
    'https://biharonline.gov.in/scholarship',
    true
  ),
  (
    'Bihar Kisan Card',
    'bihar-kisan-card',
    'state',
    'bihar',
    'Bihar government initiative to provide a Kisan Credit Card to farmers for easy access to institutional credit and benefits of various government schemes.',
    'Easy access to agricultural credit and government scheme benefits',
    'All farmers (owner-cultivators, tenant farmers, share croppers) in Bihar.',
    'Kisan Credit Card provides collateral-free short-term credit up to Rs 1.6 lakh at subsidised interest rates. Cardholders also get interest subvention and accident insurance cover.',
    'Apply at the nearest District Agricultural Office or through the Bihar Kisan Card portal with land documents and identity proof.',
    'https://kisan.bihar.gov.in/',
    true
  ),
  (
    'Bihar Mukhyamantri Nishchay Swayam Sahayata Bhatta Yojana',
    'bihar-mukhyamantri-nishchay',
    'state',
    'bihar',
    'Bihar Chief Minister''s scheme providing Rs 1,000/month to widows, destitute women, and persons with disabilities who are below the poverty line.',
    'Rs 1,000/month financial assistance for widows, destitute women, and PwD',
    'Bihar domicile widows, destitute women, and persons with disabilities (40% or above) below the poverty line.',
    'Monthly financial assistance of Rs 1,000 credited to the bank account of the beneficiary. Provides basic financial security to vulnerable sections.',
    'Apply through the Bihar Social Welfare Department or the Bihar Bharti Seva portal with relevant certificates.',
    'https://socialwelfare.bihar.gov.in/',
    true
  ),
  (
    'Bihar Rural Livelihood Mission (JEEVIKA)',
    'bihar-jeevika',
    'state',
    'bihar',
    'Bihar''s flagship poverty reduction programme implementing the National Rural Livelihoods Mission. It organizes the poor into Self-Help Groups (SHGs) for sustainable livelihoods.',
    'Poverty reduction through SHG-based livelihoods and financial inclusion',
    'Below Poverty Line families, especially women, in rural Bihar.',
    'Formation of SHGs, capacity building, skill training, and provision of micro-credit. Women gain access to bank linkages, government schemes, and livelihood opportunities.',
    'Register through the nearest block-level JEEVIKA office or through the JEEVIKA Bihar portal.',
    'https://jeeviika.nic.in/',
    true
  ),
  (
    'Bihar Mukhyamantri Balika Cycle Yojana',
    'bihar-balika-cycle',
    'state',
    'bihar',
    'Bihar government scheme providing free bicycles to girl students from Class 9 to 12 to encourage education and reduce dropout rates among female students.',
    'Free bicycle to girl students in Class 9-12',
    'Girl students studying in Class 9 to 12 in government/government-aided schools in Bihar.',
    'A free bicycle is provided to each eligible girl student to facilitate commuting to school and reduce dropout rates.',
    'Apply through the school or the Bihar Education Project Council (BEPC) portal with school certificates and identity proof.',
    'https://bepc.bih.nic.in/',
    true
  );

-- Ensure anything else (e.g. admin-created drafts) is left untouched.
