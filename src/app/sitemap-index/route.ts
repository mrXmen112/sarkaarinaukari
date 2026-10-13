import { SITE } from "@/lib/site";

/**
 * Sitemap index (Phase 2). generateSitemaps serves the section files
 * (/sitemap/jobs.xml ...); this route serves the index itself, mapped to
 * /sitemap.xml by the rewrite in next.config.ts.
 */

const SECTIONS = ["static", "landing", "jobs", "updates", "prep"] as const;

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const base = SITE.url.replace(/\/+$/, "");
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${SECTIONS.map(
  (section) => `  <sitemap>
    <loc>${base}/sitemap/${section}.xml</loc>
  </sitemap>`,
).join("\n")}
</sitemapindex>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
