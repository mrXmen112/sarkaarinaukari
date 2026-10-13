import { formatDate } from "@/lib/date";
import { formatIndianNumber } from "@/lib/utils";
import { getJobBySlug } from "@/lib/queries";
import { brandOg, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const alt = "Job details on SarkaariNaukri.online";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: PageProps<"/jobs/[slug]">) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) {
    return brandOg({ title: "SarkaariNaukri.online" });
  }
  const parts: string[] = [];
  if (job.vacancy_total) parts.push(`${formatIndianNumber(job.vacancy_total)} Posts`);
  parts.push(`Last Date ${formatDate(job.application_end)}`);
  return brandOg({
    badge: "Sarkari Naukri",
    title: job.title,
    subtitle: parts.join(" · "),
  });
}
