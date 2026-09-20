import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";

export const metadata: Metadata = {
  title: "Page Not Found — SarkaariNaukri.online",
  description:
    "The page you are looking for does not exist or has been moved. Return to the homepage or browse the latest government job notifications.",
};

export default function NotFoundPage() {
  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "404" }]} />
      <PageHeader
        title="404 — Page Not Found"
        subtitle="The page you requested does not exist or has been moved."
      />
      <div className="mt-6 rounded border border-rule p-6 text-center">
        <p className="text-lg font-bold text-navy">
          Oops! Something went wrong.
        </p>
        <p className="mt-2 text-sm text-ink-muted">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block rounded bg-navy px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-navy-800"
        >
          Return to Homepage
        </Link>
      </div>
    </PageContainer>
  );
}
