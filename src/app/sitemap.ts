import { MetadataRoute } from "next";

import { createStaticClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { SITE } from "@/lib/site";
import {
  CATEGORY_PAGES,
  QUALIFICATION_PAGES,
} from "@/lib/landingPages";
import { BIHAR_ORG_PAGES, STATE_SLUGS } from "@/lib/landingPagesState";

/**
 * Sitemap index (Phase 2): each id below becomes /sitemap/<id>.xml, with the
 * index served at /sitemap.xml. Split by section so listings stay fast and
 * lastmod stays accurate per content type.
 */
const SITEMAP_SECTIONS = ["static", "landing", "jobs", "updates", "prep"] as const;

export async function generateSitemaps() {
  return SITEMAP_SECTIONS.map((id) => ({ id }));
}

export default async function sitemap(props: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const id = await props.id;
  const base = SITE.url;

  if (id === "static") {
    const staticRoutes: MetadataRoute.Sitemap = [
      { url: `${base}/`, changeFrequency: "daily", priority: 1 },
      { url: `${base}/bihar`, changeFrequency: "daily", priority: 0.9 },
      { url: `${base}/about`, changeFrequency: "monthly", priority: 0.6 },
      { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.6 },
      { url: `${base}/privacy`, changeFrequency: "monthly", priority: 0.5 },
      { url: `${base}/terms`, changeFrequency: "monthly", priority: 0.5 },
      { url: `${base}/disclaimer`, changeFrequency: "monthly", priority: 0.5 },
    ];
    return staticRoutes;
  }

  // Landing pages (Phase 3): qualification + category + Bihar organisation.
  if (id === "landing") {
    const routes: MetadataRoute.Sitemap = [];
    for (const page of QUALIFICATION_PAGES) {
      routes.push({
        url: `${base}/jobs/${page.slug}`,
        changeFrequency: "daily",
        priority: 0.7,
      });
    }
    for (const page of CATEGORY_PAGES) {
      routes.push({
        url: `${base}/jobs/category/${page.slug}`,
        changeFrequency: "daily",
        priority: 0.7,
      });
    }
    for (const page of BIHAR_ORG_PAGES) {
      routes.push({
        url: `${base}/bihar/${page.slug}`,
        changeFrequency: "daily",
        priority: 0.8,
      });
    }
    for (const state of STATE_SLUGS) {
      routes.push({
        url: `${base}/jobs/state/${state}`,
        changeFrequency: "daily",
        priority: state === "bihar" ? 0.8 : 0.6,
      });
    }
    return routes;
  }

  if (!isSupabaseConfigured) return [];

  const tableForSlug: Record<string, string> = {
    jobs: "jobs",
    admit_cards: "admit-card",
    results: "result",
    answer_keys: "answer-key",
    exams: "exams",
    syllabus: "syllabus",
    current_affairs: "current-affairs",
    quizzes: "quiz",
    yojana: "yojana",
  };

  const routeFor: Record<string, { table: string; columns: string }> = {
    jobs: { table: "jobs", columns: "slug, updated_at" },
    updates: { table: "admit_cards", columns: "slug, updated_at" },
    prep: { table: "exams", columns: "slug, updated_at" },
  };

  type SlugRow = { slug: string; updated_at: string | null };

  const routes: MetadataRoute.Sitemap = [];

  try {
    const supabase = createStaticClient();

    if (id === "jobs") {
      routes.push(
        { url: `${base}/jobs`, changeFrequency: "daily", priority: 0.9 },
        { url: `${base}/jobs/archive`, changeFrequency: "weekly", priority: 0.5 },
      );
      const { data: jobs } = await supabase
        .from("jobs")
        .select(routeFor.jobs.columns)
        .eq("is_published", true)
        .order("updated_at", { ascending: false });
      for (const row of (jobs ?? []) as unknown as SlugRow[]) {
        routes.push({
          url: `${base}/${tableForSlug.jobs}/${row.slug}`,
          lastModified: row.updated_at ? new Date(row.updated_at) : undefined,
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
      return routes;
    }

    if (id === "updates") {
      const listingPaths: MetadataRoute.Sitemap = [
        { url: `${base}/admit-card`, changeFrequency: "daily" },
        { url: `${base}/result`, changeFrequency: "daily" },
        { url: `${base}/answer-key`, changeFrequency: "daily" },
      ];
      routes.push(...listingPaths);

      for (const table of ["admit_cards", "results", "answer_keys"]) {
        const { data } = await supabase
          .from(table)
          .select("slug, updated_at")
          .eq("is_published", true)
          .order("updated_at", { ascending: false });
        for (const row of (data ?? []) as unknown as SlugRow[]) {
          routes.push({
            url: `${base}/${tableForSlug[table]}/${row.slug}`,
            lastModified: row.updated_at ? new Date(row.updated_at) : undefined,
            changeFrequency: "weekly",
            priority: 0.7,
          });
        }
      }
      return routes;
    }

    // prep: exams, syllabus, quiz, current-affairs, yojana + their listings
    const prepListings: MetadataRoute.Sitemap = [
      { url: `${base}/exams`, changeFrequency: "daily" },
      { url: `${base}/quiz`, changeFrequency: "weekly" },
      { url: `${base}/current-affairs`, changeFrequency: "daily" },
      { url: `${base}/yojana`, changeFrequency: "weekly" },
    ];
    routes.push(...prepListings);

    for (const table of ["exams", "syllabus", "current_affairs", "quizzes", "yojana"]) {
      const { data } = await supabase
        .from(table)
        .select("slug, updated_at")
        .eq("is_published", true)
        .order("updated_at", { ascending: false });
      for (const row of (data ?? []) as unknown as SlugRow[]) {
        routes.push({
          url: `${base}/${tableForSlug[table]}/${row.slug}`,
          lastModified: row.updated_at ? new Date(row.updated_at) : undefined,
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    }
    return routes;
  } catch {
    return routes;
  }
}
