import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { JobLinkedForm } from "@/components/admin/JobLinkedForm";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function EditResultPage({
  params,
}: {
  params: { id: string };
}) {
  const { supabase } = await requireAdmin();
  const [resultRes, jobsRes] = await Promise.all([
    supabase.from("results").select("*").eq("id", params.id).maybeSingle(),
    supabase.from("jobs").select("id, title").order("title"),
  ]);

  const result = resultRes.data;
  if (!result) notFound();

  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Results", href: "/admin/results" },
          { label: "Edit" },
        ]}
      />
      <PageHeader title="Edit Result" />
      <JobLinkedForm
        kind="result"
        jobId={result.job_id ?? undefined}
        jobs={jobsRes.data ?? []}
        row={result as unknown as Record<string, unknown>}
      />
    </PageContainer>
  );
}