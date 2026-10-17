/**
 * Part C — print three sample JobPosting documents.
 *
 * Read-only, no database. Shows what the builder produces for the shapes that
 * matter: a fully-populated verified job, one whose eligibility text cannot be
 * mapped cleanly, and one that must not be emitted at all.
 *
 * Usage: npm run samples:jobposting
 */
import { buildJobPosting } from "../src/lib/jobPosting.ts";

const url = "https://www.sarkaarinaukri.online/jobs/ssc-gd-2026";

const base = {
  title: "SSC GD Constable 2026",
  short_description: "Constable (General Duty) recruitment in CAPF forces.",
  department: "Staff Selection Commission",
  application_end: "2026-11-30",
  notification_date: "2026-10-01",
  created_at: "2026-09-01T00:00:00Z",
  state: "central",
  vacancy_total: 12400,
  pay_scale: "Level 3, Rs 18,400 - 56,100",
  status: "active",
  verification_status: "verified",
  official_link: "https://ssc.gov.in/Download/notice.pdf",
  link_http_status: 200,
};

const samples = [
  {
    title: "1) Verified + open + mappable eligibility + parseable pay",
    job: { ...base, eligibility_education: "Graduation Degree" },
    opts: { url, regionName: "Delhi" },
  },
  {
    title:
      "2) Verified + open, eligibility that CANNOT be mapped -> educationRequirements omitted entirely",
    job: {
      ...base,
      title: "Bihar TRE 4.0 Teacher Recruitment 2026",
      state: "bihar",
      pay_scale: "Level 10 (as per notification)",
      eligibility_education: "As per the official notification",
    },
    opts: {
      url: "https://www.sarkaarinaukri.online/jobs/bihar-tre-4",
      regionName: "Bihar",
    },
  },
  {
    title: "3) Unverified (what all 124 jobs look like today) -> null, nothing emitted",
    job: {
      ...base,
      verification_status: "needs_review",
      eligibility_education: "12th Pass",
    },
    opts: { url, regionName: "Delhi" },
  },
];

for (const sample of samples) {
  console.log("\n" + "=".repeat(78));
  console.log(sample.title);
  console.log("=".repeat(78));
  const doc = buildJobPosting(sample.job, sample.opts);
  if (doc === null) {
    console.log("null  ->  no JobPosting block is rendered on the page.");
  } else {
    console.log(JSON.stringify(doc, null, 2));
  }
}