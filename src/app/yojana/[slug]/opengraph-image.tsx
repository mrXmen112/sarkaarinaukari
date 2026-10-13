import { getYojanaBySlug } from "@/lib/queries";
import { brandOg, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const alt = "Scheme details on SarkaariNaukri.online";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: PageProps<"/yojana/[slug]">) {
  const { slug } = await params;
  const yojana = await getYojanaBySlug(slug);
  if (!yojana) {
    return brandOg({ title: "SarkaariNaukri.online" });
  }
  const level =
    yojana.level === "state"
      ? `State Scheme${yojana.state ? ` — ${yojana.state}` : ""}`
      : "Central Scheme";
  return brandOg({ badge: "Sarkari Yojana", title: yojana.title, subtitle: level });
}
