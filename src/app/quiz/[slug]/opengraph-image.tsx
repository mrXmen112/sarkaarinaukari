import { getQuizBySlug } from "@/lib/queries";
import { brandOg, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const alt = "Quiz on SarkaariNaukri.online";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: PageProps<"/quiz/[slug]">) {
  const { slug } = await params;
  const quiz = await getQuizBySlug(slug);
  if (!quiz) {
    return brandOg({ title: "SarkaariNaukri.online" });
  }
  const count = Array.isArray(quiz.questions) ? quiz.questions.length : 0;
  return brandOg({
    badge: "Quiz & Mock Test",
    title: quiz.title,
    subtitle:
      count > 0
        ? `${count} questions${quiz.subject ? ` — ${quiz.subject}` : ""}`
        : (quiz.subject ?? undefined),
  });
}
