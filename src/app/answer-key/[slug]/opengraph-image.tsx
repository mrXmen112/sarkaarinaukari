import { formatDate } from "@/lib/date";
import { getAnswerKeyBySlug } from "@/lib/queries";
import { brandOg, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const alt = "Answer key details on SarkaariNaukri.online";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: PageProps<"/answer-key/[slug]">) {
  const { slug } = await params;
  const key = await getAnswerKeyBySlug(slug);
  if (!key) {
    return brandOg({ title: "SarkaariNaukri.online" });
  }
  return brandOg({
    badge: key.type === "final" ? "Final Answer Key" : "Answer Key",
    title: key.title,
    subtitle: key.release_date
      ? `Released ${formatDate(key.release_date)}`
      : undefined,
  });
}
