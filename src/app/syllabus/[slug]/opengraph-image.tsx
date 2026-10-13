import { getSyllabusBySlug } from "@/lib/queries";
import { brandOg, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const alt = "Syllabus on SarkaariNaukri.online";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: PageProps<"/syllabus/[slug]">) {
  const { slug } = await params;
  const syllabus = await getSyllabusBySlug(slug);
  if (!syllabus) {
    return brandOg({ title: "SarkaariNaukri.online" });
  }
  return brandOg({
    badge: "Syllabus",
    title: `${syllabus.exam_name} Syllabus`,
    subtitle: syllabus.stage ? `Stage: ${syllabus.stage}` : undefined,
  });
}
