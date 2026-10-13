import { getExamBySlug } from "@/lib/queries";
import { brandOg, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const alt = "Exam details on SarkaariNaukri.online";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: PageProps<"/exams/[slug]">) {
  const { slug } = await params;
  const exam = await getExamBySlug(slug);
  if (!exam) {
    return brandOg({ title: "SarkaariNaukri.online" });
  }
  return brandOg({
    badge: "Exam Information",
    title: exam.name,
    subtitle: exam.conducting_body ?? undefined,
  });
}
