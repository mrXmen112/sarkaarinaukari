import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/ui/JsonLd";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { AuthForm } from "@/components/auth/AuthForm";
import { breadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Login — SarkaariNaukari.online",
  description:
    "Sign in to track your applied and saved government jobs, save quiz scores and manage your SarkaariNaukari.online profile.",
  alternates: { canonical: "/login" },
};

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const params = await searchParams;
  return (
    <PageContainer>
      <JsonLd
        data={breadcrumbSchema([{ name: "Login", path: "/login" }])}
      />
      <Breadcrumbs items={[{ label: "Login" }]} />

      <PageHeader
        title="Login to Your Account"
        subtitle="Track applied jobs, save job listings, and store your quiz scores."
      />

      {params.error ? (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Couldn&apos;t complete sign-in. Please try again or request a new
          verification link.
        </div>
      ) : null}

      <AuthForm />
    </PageContainer>
  );
}