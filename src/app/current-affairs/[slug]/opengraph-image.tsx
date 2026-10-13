import { formatDate } from "@/lib/date";
import { getCurrentAffairBySlug } from "@/lib/queries";
import { brandOg, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const alt = "Current affairs on SarkaariNaukri.online";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: PageProps<"/current-affairs/[slug]">) {
  const { slug } = await params;
  const brief = await getCurrentAffairBySlug(slug);
  if (!brief?.title) {
    return brandOg({ title: "SarkaariNaukri.online" });
  }
  return brandOg({
    badge: "Current Affairs",
    title: brief.title,
    subtitle: brief.date ? formatDate(brief.date) : undefined,
  });
}
