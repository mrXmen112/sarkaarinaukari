import { MetadataRoute } from "next";

import { createStaticClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { SITE } from "@/lib/site";
import {
  CATEGORY_PAGES,
  QUALIFICATION_PAGES,
} from "@/lib/landingPages";
import {
  BIHAR_GUIDE_PAGES,
  BIHAR_ORG_PAGES,
  STATE_SLUGS,
} from "@/lib/landingPagesState";
import { BOARDS } from "@/lib/boards";
import { countVerifiedOpenJobs } from "@/lib/queries";
import {
  MIN_VERIFIED_OPEN_JOBS,
  isIndexable,
  examContentChars,
  yojanaContentChars,
} from "@/lib/indexable";

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
      { url: `${base}/editorial-policy`, changeFrequency: "monthly", priority: 0.5 },
      // Phase 4C — board result hubs (guides + official redirects)
      { url: `${base}/result/10th`, changeFrequency: "weekly", priority: 0.7 },
      { url: `${base}/result/12th`, changeFrequency: "weekly", priority: 0.7 },
      ...BOARDS.map((board) => ({
        url: `${base}/result/boards/${board.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ];
    return staticRoutes;
  }

  // Landing pages (Phase 3): qualification + category + Bihar organisation.
  // A hub is only advertised when it has >= 10 verified open jobs, matching
  // the noindex rule applied by landingMetadata().
  if (id === "landing") {
    const candidates = [
      ...QUALIFICATION_PAGES.map((page) => ({
        path: `/jobs/${page.slug}`,
        filters: page.filters,
        priority: 0.7,
      })),
      ...CATEGORY_PAGES.map((page) => ({
        path: `/jobs/category/${page.slug}`,
        filters: page.filters,
        priority: 0.7,
      })),
      ...BIHAR_ORG_PAGES.map((page) => ({
        path: `/bihar/${page.slug}`,
        filters: page.filters,
        priority: 0.8,
      })),
      ...BIHAR_GUIDE_PAGES.map((page) => ({
        path: `/bihar/${page.slug}`,
        filters: page.filters,
        priority: 0.8,
      })),
      ...STATE_SLUGS.map((state) => ({
        path: `/jobs/state/${state}`,
        filters: { state },
        priority: state === "bihar" ? 0.8 : 0.6,
      })),
    ];

    const routes = await Promise.all(
      candidates.map(async (candidate) => {
        const verifiedOpenJobs = await countVerifiedOpenJobs(candidate.filters);
        if (verifiedOpenJobs < MIN_VERIFIED_OPEN_JOBS) return null;
        return {
          url: `${base}${candidate.path}`,
          changeFrequency: "daily" as const,
          priority: candidate.priority,
        };
      }),
    );
    return routes.filter(
      (route): route is NonNullable<typeof route> => route !== null,
    );
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
    jobs: { table: "jobs", columns: "slug, content_changed_at" },
    updates: { table: "admit_cards", columns: "slug" },
    prep: { table: "exams", columns: "slug" },
  };

  type SlugRow = {
    slug: string;
    content_changed_at?: string | null;
    last_verified_at?: string | null;
  };

  /**
   * W5.2 — lastmod comes only from a signal that actually means "the content
   * changed", and is OMITTED when we do not have one.
   *
   * `updated_at` is NOT used anywhere in this file any more. On every content
   * table it is maintained by a BEFORE UPDATE trigger, and the measured data
   * shows it is a bulk stamp, not a per-page edit time:
   *
   *   jobs        124 rows /  2 distinct updated_at (85 share one second)
   *   exams        48 rows /  7 distinct
   *   admit_cards   8 rows /  2 distinct
   *   results       4 rows /  1 distinct
   *
   * Emitting those as <lastmod> announced that the entire catalogue changed on
   * one day, which is precisely the bulk-date lie W5.2 asks us to stop telling.
   *
   *   jobs                 -> content_changed_at  (real human edit; NULL today)
   *   exams / yojana       -> last_verified_at    (a human check; NULL today)
   *   everything else      -> omitted
   *
   * A sitemap with no <lastmod> is valid and simply lets Google choose its own
   * crawl schedule. A wrong <lastmod> is worse than none.
   */
  function lastmod(value: string | null | undefined): Date | undefined {
    if (!value) return undefined;
    const d = new Date(value);
    return Number.isFinite(d.getTime()) ? d : undefined;
  }

  /**
   * Columns needed to decide indexability, per prep table. Reading only what
   * the gate needs keeps this cheap; the sitemap is on the ISR hot path.
   */
  const PREP_COLUMNS: Record<string, string> = {
    exams:
      "slug, overview, eligibility, exam_pattern, preparation_strategy, conducting_body, official_link, last_verified_at, previous_year_papers",
    yojana:
      "slug, title, description, eligibility, how_to_apply, benefits_summary, benefits, official_link, last_verified_at",
    syllabus: "slug",
    current_affairs: "slug",
    quizzes: "slug",
  };

  type PrepRow = Record<string, unknown> & {
    slug: string;
    last_verified_at?: string | null;
  };

  /**
   * Templates that are NOT content-gated today keep their previous behaviour:
   * syllabus, current_affairs and quizzes have no official_link or
   * last_verified_at column (migration 0020 deliberately did not add them), so
   * applying the full rule would noindex all of them without a way to ever
   * pass it. They are flagged in the inventory as "not gated".
   */
  const PREP_KIND: Record<string, "exam" | "yojana" | null> = {
    exams: "exam",
    yojana: "yojana",
    syllabus: null,
    current_affairs: null,
    quizzes: null,
  };

  function prepIndexVerdict(table: string, row: PrepRow) {
    const kind = PREP_KIND[table];
    if (kind === null) {
      return { indexable: true, reasons: [] as string[] };
    }
    return isIndexable({
      kind,
      contentChars:
        kind === "exam"
          ? examContentChars(row as Parameters<typeof examContentChars>[0])
          : yojanaContentChars(row as Parameters<typeof yojanaContentChars>[0]),
      officialSourceUrl: (row.official_link as string | null) ?? null,
      lastVerifiedAt: (row.last_verified_at as string | null) ?? null,
      isPublished: true,
    });
  }

  function previousPapersVerdict(row: PrepRow) {
    const papers = Array.isArray(row.previous_year_papers)
      ? (row.previous_year_papers as { link?: string }[])
      : [];
    const officialLinks = papers.filter((p) =>
      /^https?:\/\//i.test(p?.link?.trim() ?? ""),
    ).length;
    return isIndexable({
      kind: "previousPapers",
      contentChars: examContentChars(row as Parameters<typeof examContentChars>[0]),
      officialSourceUrl: (row.official_link as string | null) ?? null,
      lastVerifiedAt: (row.last_verified_at as string | null) ?? null,
      officialPaperLinks: officialLinks,
      isPublished: true,
    });
  }

  const routes: MetadataRoute.Sitemap = [];

  try {
    const supabase = createStaticClient();

    if (id === "jobs") {
      routes.push(
        { url: `${base}/jobs`, changeFrequency: "daily", priority: 0.9 },
        { url: `${base}/jobs/archive`, changeFrequency: "weekly", priority: 0.5 },
      );
      // Only human-verified job pages are indexable, so only they belong here.
      const { data: jobs } = await supabase
        .from("jobs")
        .select(routeFor.jobs.columns)
        .eq("is_published", true)
        .eq("type", "job")
        .eq("verification_status", "verified")
        .order("content_changed_at", { ascending: false, nullsFirst: false });
      for (const row of (jobs ?? []) as unknown as SlugRow[]) {
        routes.push({
          url: `${base}/${tableForSlug.jobs}/${row.slug}`,
          // W5.2: content_changed_at only. NULL today means no <lastmod> at all.
          lastModified: lastmod(row.content_changed_at),
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
        const dateColumn = table === "results" ? "result_date" : "release_date";
        const { data } = await supabase
          .from(table)
          .select("slug")
          .eq("is_published", true)
          .eq("status", "released")
          .lte(dateColumn, new Date().toISOString().slice(0, 10))
          .order("created_at", { ascending: false });
        for (const row of (data ?? []) as unknown as SlugRow[]) {
          routes.push({
            url: `${base}/${tableForSlug[table]}/${row.slug}`,
            // W5.2: no trustworthy per-page edit time on these tables, so
            // lastmod is omitted rather than stamped with a bulk date.
            changeFrequency: "weekly",
            priority: 0.7,
          });
        }
      }
      return routes;
    }

    // prep: exams, syllabus, quiz, current-affairs, yojana + their listings
    //
    // B4: the listings themselves stay (they are real hub pages with their own
    // canonical), but individual detail rows are only emitted when
    // src/lib/indexable.ts says they may be indexed — the SAME function that
    // writes their robots meta tag. Previously this loop emitted every
    // published row unconditionally, which is how a noindexed page ends up
    // advertised in a sitemap.
    const prepListings: MetadataRoute.Sitemap = [
      { url: `${base}/exams`, changeFrequency: "daily" },
      { url: `${base}/quiz`, changeFrequency: "weekly" },
      { url: `${base}/current-affairs`, changeFrequency: "daily" },
      { url: `${base}/yojana`, changeFrequency: "weekly" },
    ];
    routes.push(...prepListings);

    const excluded: { url: string; reasons: string[] }[] = [];

    for (const table of ["exams", "syllabus", "current_affairs", "quizzes", "yojana"]) {
      const { data } = await supabase
        .from(table)
        .select(PREP_COLUMNS[table])
        .eq("is_published", true)
        .order("slug", { ascending: true });

      // W5.2: exams and yojana carry a human `last_verified_at` (0020), which is
      // the only trustworthy "this page was checked/updated" signal they have.
      // NULL today -> no lastmod. The ungated tables have no such column at all.
      const prepLastMod = (row: PrepRow) =>
        PREP_KIND[table] === null ? undefined : lastmod(row.last_verified_at);

      for (const row of (data ?? []) as PrepRow[]) {
        const url = `${base}/${tableForSlug[table]}/${row.slug}`;
        const verdict = prepIndexVerdict(table, row);
        if (!verdict.indexable) {
          excluded.push({ url, reasons: verdict.reasons });
          continue;
        }
        routes.push({
          url,
          lastModified: prepLastMod(row),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }

      // Phase 4B — one previous-papers page per published exam. Gated on the
      // exam actually having officially published papers; without at least one
      // it is an empty shell and must stay out of the sitemap.
      if (table === "exams") {
        for (const row of (data ?? []) as PrepRow[]) {
          const url = `${base}/previous-papers/${row.slug}`;
          const verdict = previousPapersVerdict(row);
          if (!verdict.indexable) {
            excluded.push({ url, reasons: verdict.reasons });
            continue;
          }
          routes.push({
            url,
            lastModified: prepLastMod(row),
            changeFrequency: "monthly",
            priority: 0.5,
          });
        }
      }
    }

    if (excluded.length > 0) {
      console.warn(
        `[sitemap] ${id}: excluded ${excluded.length} noindexed URL(s), e.g. ` +
          excluded
            .slice(0, 3)
            .map((e) => `${new URL(e.url).pathname} (${e.reasons.join("; ")})`)
            .join(", "),
      );
    }

    return routes;
  } catch {
    return routes;
  }
}
