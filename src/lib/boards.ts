/**
 * Board result hubs (Phase 4C).
 *
 * DATA POLICY: this site only GUIDES and REDIRECTS. It never asks for, stores
 * or processes a student's roll number or marks, and it has no student data
 * at all. Every "Check Result" button links to the board's own portal in a
 * new tab with rel="noopener noreferrer nofollow".
 *
 * VERIFICATION: every portalUrl below was checked to resolve on the public
 * DNS on the date in `verified`. `scripts/board-links-check.mjs` re-checks
 * them weekly; a broken portal is reported in the admin panel instead of
 * silently rotting. If a portal cannot be verified, do NOT guess a URL —
 * leave it out and ask.
 */

export type Board = {
  slug: string;
  name: string;
  /** Classes served: "10" | "12". */
  classes: ("10" | "12")[];
  state: string;
  /** Verified official board/result portal. */
  portalUrl: string;
  portalHost: string;
  /** Other official access points (SMS / DigiLocker / division sites). */
  alternatives: { label: string; href: string; note?: string }[];
  /** Date this URL was last verified (YYYY-MM-DD). */
  verified: string;
  /** Factual, board-specific note on how checking works. */
  note: string;
  /** What candidates need to keep handy before checking. */
  needs: string;
};

export const BOARDS: Board[] = [
  {
    slug: "cbse",
    name: "CBSE — Central Board of Secondary Education",
    classes: ["10", "12"],
    state: "central",
    portalUrl: "https://www.cbse.gov.in/",
    portalHost: "cbse.gov.in",
    alternatives: [
      {
        label: "DigiLocker marksheet",
        href: "https://www.digilocker.gov.in/",
        note: "CBSE marksheets are also issued on DigiLocker.",
      },
    ],
    verified: "2026-10-13",
    note: "CBSE declares Class 10 and Class 12 results centrally on cbse.gov.in, usually on a fixed annual schedule announced by the board.",
    needs: "Roll number and date of birth as printed on the admit card.",
  },
  {
    slug: "bseb",
    name: "BSEB — Bihar School Examination Board, Patna",
    classes: ["10", "12"],
    state: "bihar",
    portalUrl: "https://biharboardonline.com/",
    portalHost: "biharboardonline.com",
    alternatives: [
      {
        label: "BSEB secondary (Class 10)",
        href: "https://secondary.biharboardonline.com/",
      },
      {
        label: "BSEB intermediate (Class 12)",
        href: "https://intermediate.biharboardonline.com/",
      },
    ],
    verified: "2026-10-13",
    note: "BSEB runs Class 10 (matric) and Class 12 (intermediate) as two separate examinations, each declared on its own section of the board site. The intermediate board also covers the Bihar Open School and National Open School.",
    needs: "Roll code and roll number from the admit card (both are required).",
  },
  {
    slug: "cisce",
    name: "CISCE — ICSE (Class 10) and ISC (Class 12)",
    classes: ["10", "12"],
    state: "central",
    portalUrl: "https://www.cisce.org/",
    portalHost: "cisce.org",
    alternatives: [],
    verified: "2026-10-13",
    note: "CISCE conducts the ICSE (Class 10) and ISC (Class 12) exams and publishes results on its own site. Individual candidates usually verify through their school.",
    needs: "ICSE/ISC candidate number and date of birth.",
  },
  {
    slug: "up-board",
    name: "UP Board — Board of High School & Intermediate Education, Uttar Pradesh",
    classes: ["10", "12"],
    state: "uttar-pradesh",
    portalUrl: "https://upresults.nic.in/",
    portalHost: "upresults.nic.in",
    alternatives: [],
    verified: "2026-10-13",
    note: "The UP Board publishes high school (Class 10) and intermediate (Class 12) results on upresults.nic.in. Re-evaluation and compartment notices come from the same board.",
    needs: "Roll number and date of birth.",
  },
  {
    slug: "mp-board",
    name: "MP Board — Madhya Pradesh Board of Secondary Education",
    classes: ["10", "12"],
    state: "madhya-pradesh",
    portalUrl: "https://mpbse.mponline.gov.in/",
    portalHost: "mpbse.mponline.gov.in",
    alternatives: [],
    verified: "2026-10-13",
    note: "The MP Board declares Class 10 and Class 12 results on its mponline portal; supplementary (compartment) results are listed separately.",
    needs: "Roll number and date of birth.",
  },
  {
    slug: "rajasthan-board",
    name: "RBSE — Board of Secondary Education, Rajasthan",
    classes: ["10"],
    state: "rajasthan",
    portalUrl: "https://rajeduboard.rajasthan.gov.in/",
    portalHost: "rajeduboard.rajasthan.gov.in",
    alternatives: [],
    verified: "2026-10-13",
    note: "RBSE declares the secondary (Class 10) examination on the board portal. Class 12 results for RBSE schools are handled through the respective school and division offices.",
    needs: "Roll number (printed on the class marksheet / admit card).",
  },
  {
    slug: "maharashtra-board",
    name: "MSBSHSE — Maharashtra State Board of Secondary & Higher Secondary Education",
    classes: ["10", "12"],
    state: "maharashtra",
    portalUrl: "https://mahahsscboard.in/",
    portalHost: "mahahsscboard.in",
    alternatives: [
      {
        label: "Maharashtra e-marksheet verification",
        href: "https://boardmarksheet.maharashtra.gov.in/",
        note: "Official portal to verify or download an MSBSHSE marksheet and certificate online.",
      },
    ],
    verified: "2026-10-13",
    note: "The Maharashtra board publishes SSC (Class 10) and HSC (Class 12) results on mahahsscboard.in, and serves verified e-marksheets through the state marksheet portal.",
    needs: "Seat number and date of birth.",
  },
  {
    slug: "wbsc",
    name: "West Bengal Boards — WBBSE (Class 10) and WBCHSE (Class 12)",
    classes: ["10", "12"],
    state: "west-bengal",
    portalUrl: "https://www.wbresults.nic.in/",
    portalHost: "wbresults.nic.in",
    alternatives: [],
    verified: "2026-10-13",
    note: "West Bengal declares Madhyamik (Class 10) through WBBSE and Uchchatar Madhyamik (Class 12) through WBCHSE, both served from the shared results portal.",
    needs: "Roll number and date of birth (as per the board's format).",
  },
  {
    slug: "jsec",
    name: "Jharkhand — JAC (Class 10) and JCEB (Class 12)",
    classes: ["10", "12"],
    state: "jharkhand",
    portalUrl: "https://jac.jharkhand.gov.in/",
    portalHost: "jac.jharkhand.gov.in",
    alternatives: [
      { label: "JCEB (Class 12)", href: "https://jceeb.jharkhand.gov.in/" },
    ],
    verified: "2026-10-13",
    note: "Class 10 results come from the Jharkhand Academic Council and Class 12 results from JCEB; each board publishes on its own portal.",
    needs: "Roll number and date of birth.",
  },
  {
    slug: "haryana-board",
    name: "BSEH — Board of School Education Haryana",
    classes: ["10", "12"],
    state: "haryana",
    portalUrl: "https://bseh.org.in/",
    portalHost: "bseh.org.in",
    alternatives: [
      { label: "Haryana Open School results", href: "https://hseb.org.in/all-results.html" },
    ],
    verified: "2026-10-13",
    note: "Haryana declares secondary (Class 10) and senior secondary (Class 12) results on bseh.org.in, with open-school results listed on the separate HSEB portal.",
    needs: "Roll number and date of birth.",
  },
  {
    slug: "gujarat-board",
    name: "GSEB — Gujarat State Board of School Education",
    classes: ["10", "12"],
    state: "gujarat",
    portalUrl: "https://www.gseb.org.in/",
    portalHost: "gseb.org.in",
    alternatives: [],
    verified: "2026-10-13",
    note: "The Gujarat board publishes SSC (Class 10) and HSC (Class 12) results on gseb.org.in.",
    needs: "Seat number and date of birth.",
  },
  {
    slug: "odisha-board",
    name: "BSE Odisha — Board of Secondary Education, Odisha",
    classes: ["10", "12"],
    state: "odisha",
    portalUrl: "https://bse.odisha.gov.in/",
    portalHost: "bse.odisha.gov.in",
    alternatives: [],
    verified: "2026-10-13",
    note: "BSE Odisha publishes HSC (Class 10) and CHSE (Class 12) results on the board site.",
    needs: "Roll number and date of birth.",
  },
  {
    slug: "punjab-board",
    name: "PSEB — Punjab School Education Board",
    classes: ["10", "12"],
    state: "punjab",
    portalUrl: "https://pseb.ac.in/",
    portalHost: "pseb.ac.in",
    alternatives: [],
    verified: "2026-10-13",
    note: "PSEB publishes matriculation (Class 10) and senior secondary (Class 12) results on pseb.ac.in. Results are also available by SMS using the board's published short code.",
    needs: "Roll number and date of birth.",
  },
  {
    slug: "karnataka-board",
    name: "KSEAB — Karnataka School Examination and Assessment Board",
    classes: ["10", "12"],
    state: "karnataka",
    portalUrl: "https://kseeb.karnataka.gov.in/",
    portalHost: "kseeb.karnataka.gov.in",
    alternatives: [
      { label: "Karnataka results (karresults)", href: "https://karresults.nic.in/" },
    ],
    verified: "2026-10-13",
    note: "Karnataka publishes SSLC (Class 10) and PUC (Class 12) results through kseeb.karnataka.gov.in, with the state results service at karresults.nic.in.",
    needs: "Register number and date of birth (as on the admission ticket).",
  },
  {
    slug: "tn-board",
    name: "Tamil Nadu State Board — Directorate of Government Examinations",
    classes: ["10", "12"],
    state: "tamil-nadu",
    portalUrl: "https://tnresults.nic.in/",
    portalHost: "tnresults.nic.in",
    alternatives: [
      { label: "DGE Tamil Nadu", href: "https://www.dge.tn.gov.in/" },
      { label: "UMANG (results & marksheet)", href: "https://web.umang.gov.in/" },
    ],
    verified: "2026-10-13",
    note: "The Tamil Nadu State Board publishes SSLC (Class 10) and HSC (Class 12) results on tnresults.nic.in and the DGE portal; marksheets are also available on DigiLocker and UMANG.",
    needs: "Register number and date of birth.",
  },
  {
    slug: "ts-board",
    name: "Telangana — BSE Telangana (Class 10) and TSBPC (Class 12)",
    classes: ["10", "12"],
    state: "telangana",
    portalUrl: "https://bse.telangana.gov.in/",
    portalHost: "bse.telangana.gov.in",
    alternatives: [],
    verified: "2026-10-13",
    note: "Telangana Class 10 (SSC) results are declared by BSE Telangana, with Class 12 results handled by TSBPC.",
    needs: "Roll number from the SSC hall ticket.",
  },
  {
    slug: "ap-board",
    name: "AP Board — Andhra Pradesh State Board of Secondary & Intermediate Education",
    classes: ["10", "12"],
    state: "andhra-pradesh",
    portalUrl: "https://apsche.ap.gov.in/",
    portalHost: "apsche.ap.gov.in",
    alternatives: [],
    verified: "2026-10-13",
    note: "The Andhra Pradesh board publishes SSC (Class 10) and Intermediate (Class 12) results through its own portal.",
    needs: "Roll number and date of birth.",
  },
  {
    slug: "kerala-board",
    name: "Kerala HSE — Kerala Higher Secondary Education Board",
    classes: ["10", "12"],
    state: "kerala",
    portalUrl: "https://results.kerala.gov.in/",
    portalHost: "results.kerala.gov.in",
    alternatives: [],
    verified: "2026-10-13",
    note: "The Kerala board publishes SSLC (Class 10) and Higher Secondary (Class 12) results on the state results portal.",
    needs: "Register number and date of birth.",
  },
];

export const BOARDS_BY_SLUG: Record<string, Board> = Object.fromEntries(
  BOARDS.map((b) => [b.slug, b]),
);

export function boardsForClass(cls: "10" | "12"): Board[] {
  return BOARDS.filter((b) => b.classes.includes(cls));
}