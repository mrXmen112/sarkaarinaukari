import { revalidatePath } from "next/cache";

/**
 * Public surfaces that depend on job rows. Covers the homepage, the Bihar hub,
 * every jobs listing/detail page and the sitemap in one call so publishing,
 * editing or unpublishing a job cannot leave a stale card behind.
 */
export function revalidateJobSurfaces(slug?: string | null): void {
  revalidatePath("/");
  revalidatePath("/bihar");
  revalidatePath("/jobs", "layout");
  revalidatePath("/sitemap-index");
  revalidatePath("/sitemap/jobs.xml");
  revalidatePath("/sitemap/updates.xml");
  if (slug) revalidatePath(`/jobs/${slug}`);
}

/**
 * Admit cards, results and answer keys appear on the homepage and the Bihar
 * hub's recent-updates rail as well as their own listing and detail pages.
 */
export function revalidateUpdateSurfaces(
  kind: "admit-card" | "result" | "answer-key",
  slug?: string | null,
): void {
  revalidatePath("/");
  revalidatePath("/bihar");
  revalidatePath(`/${kind}`, "layout");
  revalidatePath("/sitemap-index");
  revalidatePath("/sitemap/jobs.xml");
  revalidatePath("/sitemap/updates.xml");
  if (slug) revalidatePath(`/${kind}/${slug}`);
}
