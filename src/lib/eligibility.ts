import { qualificationKeywords } from "@/lib/queries";
import type { JobWithCategory, SocialCategory, UserProfile } from "@/types/database";

/**
 * Eligibility checker (Phase 4F).
 *
 * Filters the live job list against the signed-in profile. Conservative by
 * design: a job is shown when we can positively match, and jobs whose limits
 * are not notified are included with a "check eligibility" note rather than
 * being hidden. Age relaxation uses the profile's category only when the job
 * states it in age_relaxation.
 */

const CATEGORY_RELAXATION: Record<SocialCategory, number> = {
  general: 0,
  obc: 3,
  sc: 5,
  st: 5,
  ews: 0,
};

export type EligibleMatch = {
  job: JobWithCategory;
  /** Short reason chips: what matched and what still needs checking. */
  matches: string[];
  needsCheck: string[];
};

function ageUpperBound(job: JobWithCategory, category: SocialCategory | null): number | null {
  if (job.eligibility_age_max == null) return null;
  if (!category) return job.eligibility_age_max;
  const stated = job.age_relaxation
    ? ((job.age_relaxation as Record<string, number>)[category] ?? 0)
    : 0;
  // Use the stated relaxation when present, else the general norm for the
  // category — the notification always has the final say.
  const norm = stated > 0 ? stated : (CATEGORY_RELAXATION[category] ?? 0);
  return job.eligibility_age_max + norm;
}

export function matchJobsToProfile(
  jobs: JobWithCategory[],
  profile: Pick<UserProfile, "age" | "education" | "category" | "state"> | null,
): EligibleMatch[] {
  if (!profile || (profile.age == null && !profile.education && !profile.state)) {
    return [];
  }

  const education = (profile.education ?? "").trim();
  const keywords = education ? qualificationKeywordsByFreeText(education) : [];

  const results: EligibleMatch[] = [];

  for (const job of jobs) {
    const matches: string[] = [];
    const needsCheck: string[] = [];

    // Age
    if (profile.age != null) {
      if (job.eligibility_age_min != null && profile.age < job.eligibility_age_min) {
        continue;
      }
      const upper = ageUpperBound(job, profile.category);
      if (upper != null && profile.age > upper) {
        continue;
      }
      if (job.eligibility_age_min != null || upper != null) {
        matches.push("Age matches");
      } else {
        needsCheck.push("Age limit not notified");
      }
    }

    // Qualification (keyword match against the eligibility text)
    if (keywords.length > 0 && job.eligibility_education) {
      const text = job.eligibility_education.toLowerCase();
      if (keywords.some((k) => text.includes(k.toLowerCase()))) {
        matches.push("Qualification matches");
      } else {
        needsCheck.push("Check eligibility text");
      }
    } else if (keywords.length > 0) {
      needsCheck.push("Eligibility not notified");
    }

    // State (central jobs are open to all; state jobs prefer their own state)
    if (profile.state) {
      if (!job.state) {
        matches.push("Open to all states");
      } else if (job.state === profile.state) {
        matches.push("Your state");
      }
    }

    if (matches.length > 0) {
      results.push({ job, matches, needsCheck });
    }
  }

  return results.sort((a, b) => {
    const ae = new Date(a.job.application_end).getTime();
    const be = new Date(b.job.application_end).getTime();
    return ae - be;
  });
}

function qualificationKeywordsByFreeText(education: string): string[] {
  const map: { test: RegExp; value: string }[] = [
    { test: /10th|matric|secondary/i, value: "10th" },
    { test: /12th|intermediate|higher secondary/i, value: "12th" },
    { test: /iti|diploma|polytechnic/i, value: "diploma" },
    { test: /b\.?tech|b\.?e|bachelor|graduate|b\.?com|b\.?sc|graduation/i, value: "graduate" },
    { test: /master|m\.?tech|m\.?sc|post ?graduate|mba/i, value: "post-graduate" },
    { test: /b\.?ed|d\.?el\.?ed|teacher/i, value: "bed" },
    { test: /b\.?pharm|pharmacy/i, value: "medical" },
    { test: /gnm|bsc.?nursing|bachelor of science.*nursing/i, value: "medical" },
    { test: /llb|law/i, value: "law" },
  ];
  const out = new Set<string>();
  for (const entry of map) {
    if (entry.test.test(education)) out.add(entry.value);
  }
  return [...out].flatMap((v) => qualificationKeywords(v));
}