import { MetadataRoute } from "next";

import { createStaticClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { SITE } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url;
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/jobs`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/bihar`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/admit-card`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/result`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/answer-key`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/yojana`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/exams`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/current-affairs`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/quiz`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/disclaimer`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/profile`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  const dynamicRoutes: MetadataRoute.Sitemap = [];

  if (isSupabaseConfigured) {
    try {
      const supabase = createStaticClient();

      const [{ data: jobs }, { data: exams }, { data: yojana }, { data: admitCards }, { data: results }, { data: answerKeys }, { data: currentAffairs }, { data: quizzes }, { data: syllabi }] = await Promise.all([
        supabase.from("jobs").select("slug").eq("is_published", true),
        supabase.from("exams").select("slug").eq("is_published", true),
        supabase.from("yojana").select("slug").eq("is_published", true),
        supabase.from("admit_cards").select("slug").eq("is_published", true),
        supabase.from("results").select("slug").eq("is_published", true),
        supabase.from("answer_keys").select("slug").eq("is_published", true),
        supabase.from("current_affairs").select("slug").eq("is_published", true),
        supabase.from("quizzes").select("slug").eq("is_published", true),
        supabase.from("syllabus").select("slug"),
      ]);

      const tableForSlug = (table: string) => {
        switch (table) {
          case "jobs": return "jobs";
          case "exams": return "exams";
          case "yojana": return "yojana";
          case "admit_cards": return "admit-card";
          case "results": return "result";
          case "answer_keys": return "answer-key";
          case "current_affairs": return "current-affairs";
          case "quizzes": return "quiz";
          default: return table;
        }
      };

      const addSlugs = (table: string, rows: { slug: string }[] | null) => {
        if (!rows) return;
        const path = tableForSlug(table);
        for (const row of rows) {
          dynamicRoutes.push({
            url: `${base}/${path}/${row.slug}`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
          });
        }
      };

      addSlugs("jobs", jobs as { slug: string }[]);
      addSlugs("exams", exams as { slug: string }[]);
      addSlugs("yojana", yojana as { slug: string }[]);
      addSlugs("admit_cards", admitCards as { slug: string }[]);
      addSlugs("results", results as { slug: string }[]);
      addSlugs("answer_keys", answerKeys as { slug: string }[]);
      addSlugs("current_affairs", currentAffairs as { slug: string }[]);
      addSlugs("quizzes", quizzes as { slug: string }[]);
      addSlugs("syllabus", syllabi as { slug: string }[]);
    } catch {
      // Return static routes only if the query fails.
    }
  }

  return [...staticRoutes, ...dynamicRoutes];
}
