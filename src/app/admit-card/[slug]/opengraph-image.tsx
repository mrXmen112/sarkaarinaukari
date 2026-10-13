import { formatDate } from "@/lib/date";
import { getAdmitCardBySlug } from "@/lib/queries";
import { brandOg, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const alt = "Admit card details on SarkaariNaukri.online";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: PageProps<"/admit-card/[slug]">) {
  const { slug } = await params;
  const card = await getAdmitCardBySlug(slug);
  if (!card) {
    return brandOg({ title: "SarkaariNaukri.online" });
  }
  const subtitle = card.exam_date
    ? `Exam Date ${formatDate(card.exam_date)}`
    : card.release_date
      ? `Released ${formatDate(card.release_date)}`
      : undefined;
  return brandOg({ badge: "Admit Card", title: card.title, subtitle });
}
