import type { Metadata } from "next";

import { ClassResultHub, classHubMetadata } from "@/components/results/ClassResultHub";

export const revalidate = 86400;

export const metadata: Metadata = classHubMetadata("10");

export default function Page() {
  return <ClassResultHub cls="10" />;
}