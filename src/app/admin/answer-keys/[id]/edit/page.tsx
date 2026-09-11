import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { JobLinkedForm } from "@/components/admin/JobLinkedForm";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function EditAnswerKeyPage({
  params,
}: {
  params: { id: string };
}) {
  const { supabase } = await requireAdmin();
  const [keyRes, jobsRes] = await Promise.all([
    supabase.from("answer_keys").select("*").eq("id", params.id).maybeSingle(),
    supabase.from("jobs").select("id, title").order("title"),
  ]);

  const key = keyRes.data;
  if (!key) notFound();

  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Answer Keys", href: "/admin/answer-keys" },
          { label: "Edit" },
        ]}
      />
      <PageHeader title="Edit Answer Key" />
      <JobLinkedForm
        kind="answer-key"
        jobId={key.job_id ?? undefined}
        jobs={jobsRes.data ?? []}
        row={key as unknown as Record<string, unknown>}
      />
    </PageContainer>
  );
}