import type { YojanaCategory } from "@/types/database";

/** Directory taxonomy requested for Sarkari Yojana coverage. */
export const YOJANA_CATEGORIES: {
  value: YojanaCategory;
  label: string;
}[] = [
  { value: "women_welfare", label: "Women Welfare" },
  { value: "farmer_welfare", label: "Farmer Welfare" },
  { value: "student_scholarship", label: "Student Scholarships" },
  { value: "employment", label: "Employment" },
  { value: "business_startup", label: "Business & Startup" },
  { value: "housing", label: "Housing" },
  { value: "healthcare", label: "Healthcare" },
  { value: "pension", label: "Pension" },
  { value: "education", label: "Education" },
  { value: "social_welfare", label: "Social Welfare" },
  { value: "sc_st_obc_welfare", label: "SC/ST/OBC Welfare" },
];

export const YOJANA_LEVELS = [
  { value: "central", label: "Central Government" },
  { value: "state", label: "State Government" },
  { value: "ut", label: "Union Territory" },
];

export function yojanaCategoryLabel(value: string | null | undefined): string {
  return (
    YOJANA_CATEGORIES.find((c) => c.value === value)?.label ??
    (value ? value.replace(/_/g, " ") : "General")
  );
}

export function yojanaLevelLabel(level: string | null | undefined): string {
  if (level === "central") return "Central Government";
  if (level === "ut") return "Union Territory";
  if (level === "state") return "State Government";
  return "Government";
}
