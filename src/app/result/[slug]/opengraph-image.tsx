import { formatDate } from "@/lib/date";
import { getResultBySlug } from "@/lib/queries";
import { brandOg, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const alt = "Result details on SarkaariNaukri.online";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: PageProps<"/result/[slug]">) {
  const { slug } = await params;
  const result = await getResultBySlug(slug);
  if (!result) {
    return brandOg({ title: "SarkaariNaukri.online" });
  }
  return brandOg({
    badge: "Sarkari Result",
    title: result.title,
    subtitle: result.result_date
      ? `Result Date ${formatDate(result.result_date)}`
      : undefined,
  });
}
