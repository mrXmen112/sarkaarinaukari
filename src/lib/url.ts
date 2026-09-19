import type { JobWithCategory } from "@/types/database";

const GOV_DOMAINS = [
  "gov.in",
  "gov.nic.in",
  "nic.in",
  "nicobe.in",
  "nicmain.nic.in",
  "mcit.gov.in",
  "nic.gov.in",
  "india.gov.in",
  "indiapost.gov.in",
  "citizenportal.gov.in",
  "eci.gov.in",
  "ecrb.gov.in",
  "upsc.gov.in",
  "ssc.nic.in",
  "ssc.gov.in",
  "ibps.in",
  "ibpsrecruitment.in",
  "railways.gov.in",
  "ncr.indianrailways.gov.in",
  "crpf.gov.in",
  "bsf.gov.in",
  "cisf.gov.in",
  "itbp.gov.in",
  "ssb.gov.in",
  "assamrifles.gov.in",
  "rpf.gov.in",
  "rrpf.gov.in",
  "indianarmy.nic.in",
  "indiannavy.nic.in",
  "indianairforce.nic.in",
  "capf.gov.in",
  "rcf.gov.in",
  "ntpc.co.in",
  "ntpc.gov.in",
  "careers.ntpc.co.in",
  "bhel.com",
  "bharatpetroleum.com",
  "hindanpetroleum.com",
  "iocl.com",
  "gaicl.com",
  "gailindia.com",
  "sco.org.in",
  "sbi.co.in",
  "sbi.com",
  "hdfcbank.com",
  "bankofbaroda.com",
  "pnb.co.in",
  "up-police.gov.in",
  "uppbpb.gov.in",
  "csd.delhipolice.gov.in",
  "bpsc.bih.nic.in",
  "bssc.bih.nic.in",
  "csb.bihar.gov.in",
  "panchayat.bihar.gov.in",
  "statehealthsocietybihar.org",
  "upsssc.gov.in",
  "uppsc.gov.in",
  "biharboardonline.in",
  "biharboard.com",
  "bbse.bihar.gov.in",
  "bihar.gov.in",
  "gov.bihar.gov.in",
  "biharpolice.gov.in",
  "bihar.jobs",
];

const GOV_PATHS = [
  "/",
  "/advt",
  "/result",
  "/answer-key",
  "/admit-card",
  "/careers",
  "/recruitment",
  "/application",
];

export type LinkStatus = "valid" | "suspicious" | "broken";

export interface LinkValidationResult {
  status: LinkStatus;
  reason: string;
  isExternal: boolean;
}

/**
 * Check if a URL points to a legitimate government domain.
 * Returns "valid" for gov.in/nic.in domains, "suspicious" for
 * anything that looks like a placeholder, and "broken" for
 * obvious non-functional URLs.
 */
export function validateOfficialLink(url: string | null | undefined): LinkValidationResult {
  if (!url || !url.trim()) {
    return { status: "broken", reason: "Empty URL", isExternal: false };
  }

  const trimmed = url.trim();

  if (trimmed === "#" || trimmed.toLowerCase() === "javascript:void(0)") {
    return { status: "broken", reason: `Placeholder URL: ${trimmed}`, isExternal: false };
  }

  if (trimmed.startsWith("javascript:") || trimmed.startsWith("mailto:") || trimmed.startsWith("tel:")) {
    return { status: "broken", reason: `Non-navigational URL: ${trimmed}`, isExternal: false };
  }

  try {
    const parsed = new URL(trimmed);
    const hostname = parsed.hostname.toLowerCase();

    // Check if it's an actual government domain
    const isGov = GOV_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
    const isGovPath = GOV_PATHS.some((path) => parsed.pathname.startsWith(path));

    if (isGov || isGovPath) {
      return { status: "valid", reason: `Valid government domain: ${hostname}`, isExternal: true };
    }

    // Check if it's at least a real domain with a proper TLD
    if (parsed.protocol === "https:" && hostname.includes(".")) {
      return { status: "suspicious", reason: `Non-government domain: ${hostname}`, isExternal: true };
    }

    return { status: "broken", reason: `Invalid protocol or format: ${trimmed}`, isExternal: false };
  } catch {
    return { status: "broken", reason: `Unparseable URL: ${trimmed}`, isExternal: false };
  }
}

/**
 * Extract broken links from a job listing for reporting.
 */
export function getJobLinkStatus(job: JobWithCategory): { url: string; status: LinkStatus; reason: string }[] {
  const results: { url: string; status: LinkStatus; reason: string }[] = [];

  if (job.official_link) {
    const result = validateOfficialLink(job.official_link);
    results.push({ url: job.official_link, status: result.status, reason: result.reason });
  }

  if (job.source_url) {
    const result = validateOfficialLink(job.source_url);
    results.push({ url: job.source_url, status: result.status, reason: result.reason });
  }

  return results;
}

/**
 * Check if any link in a job is broken.
 */
export function hasBrokenLink(job: JobWithCategory): boolean {
  return getJobLinkStatus(job).some((r) => r.status === "broken");
}

/**
 * Get all broken links from a list of jobs.
 */
export function getBrokenLinks(jobs: JobWithCategory[]): { slug: string; title: string; url: string; reason: string }[] {
  const broken: { slug: string; title: string; url: string; reason: string }[] = [];
  for (const job of jobs) {
    const statuses = getJobLinkStatus(job);
    for (const s of statuses) {
      if (s.status === "broken") {
        broken.push({ slug: job.slug, title: job.title, url: s.url, reason: s.reason });
      }
    }
  }
  return broken;
}
