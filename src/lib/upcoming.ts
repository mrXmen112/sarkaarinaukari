import { isSupabaseConfigured } from "@/lib/env";
import { pageWindow } from "@/lib/pagination";
import { createStaticClient } from "@/lib/supabase/server";
import type { UpcomingRecruitment } from "@/types/database";

type ListingQuery = {
  eq(column: string, value: string | number | boolean | null): ListingQuery;
  in(column: string, values: string[]): ListingQuery;
  ilike(column: string, value: string): ListingQuery;
  or(filters: string): ListingQuery;
  gte(column: string, value: string): ListingQuery;
  lt(column: string, value: string): ListingQuery;
  order(column: string, options: { ascending: boolean; nullsFirst?: boolean }): ListingQuery;
  range(from: number, to: number): ListingQuery;
  then: PromiseLike<{
    data: unknown[] | null;
    count: number | null;
    error: { message: string } | null;
  }>["then"];
};

export type UpcomingFilters = {
  statuses?: string[];
  level?: string;
  state?: string;
  organization?: string;
  qualification?: string;
  month?: string;
  q?: string;
  page?: number;
  pageSize?: number;
};

export type UpcomingListResult = {
  rows: UpcomingRecruitment[];
  total: number;
  page: number;
  totalPages: number;
};

const QUALIFICATION_TERMS: Record<string, string[]> = {
  graduate: ["graduate", "combined", "civil services"],
  engineering: ["engineering", "geo-scientist"],
  medical: ["medical", "forest"],
  defence: ["defence", "armed police", "naval", "military"],
};

export async function listUpcoming(
  filters: UpcomingFilters = {},
): Promise<UpcomingListResult> {
  const empty: UpcomingListResult = { rows: [], total: 0, page: 1, totalPages: 1 };
  if (!isSupabaseConfigured) return empty;

  const build = (head: boolean) => {
    let q = createStaticClient()
      .from("upcoming_recruitments")
      .select(head ? "id" : "*", { count: "exact", head })
      .eq("is_published", true) as unknown as ListingQuery;
    if (filters.statuses?.length) q = q.in("status", filters.statuses);
    if (filters.level) q = q.eq("level", filters.level);
    if (filters.state) q = q.eq("state", filters.state);
    if (filters.organization) q = q.ilike("organization", `%${filters.organization}%`);
    if (filters.q?.trim()) {
      const term = filters.q.trim().replace(/[%,()]/g, " ").slice(0, 80);
      q = q.or(`title.ilike.%${term}%,organization.ilike.%${term}%`);
    }
    const terms = QUALIFICATION_TERMS[filters.qualification ?? ""] ?? [];
    if (terms.length) {
      q = q.or(terms.map((t) => `title.ilike.%${t}%`).join(","));
    }
    const monthFilter = filters.month;
    if (monthFilter && /^\d{4}-\d{2}$/.test(monthFilter)) {
      const [y, m] = monthFilter.split("-").map(Number);
      const next = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
      q = q.gte("notification_date", `${monthFilter}-01`).lt("notification_date", next);
    }
    return q.order("notification_date", { ascending: true, nullsFirst: false })
      .order("exam_date", { ascending: true, nullsFirst: false })
      .order("title", { ascending: true });
  };

  const counted = await build(true);
  if (counted.error) {
    console.error("[upcoming] count failed:", counted.error.message);
    return empty;
  }
  const total = counted.count ?? 0;
  const window = pageWindow(filters.page ?? 1, total, filters.pageSize ?? 25);
  if (total === 0) return empty;
  const rowsQuery = build(false);
  const { data, error } = await rowsQuery.range(window.start, window.end);
  if (error) {
    console.error("[upcoming] rows failed:", error.message);
    return { ...empty, total, page: window.page, totalPages: window.totalPages };
  }
  return {
    rows: (data ?? []) as UpcomingRecruitment[],
    total,
    page: window.page,
    totalPages: window.totalPages,
  };
}

export async function getUpcomingBySlug(
  slug: string,
): Promise<UpcomingRecruitment | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await createStaticClient()
    .from("upcoming_recruitments")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  return (data as UpcomingRecruitment | null) ?? null;
}

export async function getAllUpcomingSlugs(): Promise<string[]> {
  if (!isSupabaseConfigured) return [];
  const { data } = await createStaticClient()
    .from("upcoming_recruitments")
    .select("slug")
    .eq("is_published", true);
  return ((data ?? []) as Pick<UpcomingRecruitment, "slug">[]).map((r) => r.slug);
}

export {
  COMING_SOON_STATUSES,
  EXPECTED_STATUSES,
  UPCOMING_EXAM_STATUSES,
} from "./upcomingStatus.ts";
