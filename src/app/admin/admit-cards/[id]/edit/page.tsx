import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { JobLinkedForm } from "@/components/admin/JobLinkedForm";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function EditAdmitCardPage({
  params,
}: {
  params: { id: string };
}) {
  const { supabase } = await requireAdmin();
  const [cardRes, jobsRes] = await Promise.all([
    supabase.from("admit_cards").select("*").eq("id", params.id).maybeSingle(),
    supabase.from("jobs").select("id, title").order("title"),
  ]);

  const card = cardRes.data;
  if (!card) notFound();

  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Admit Cards", href: "/admin/admit-cards" },
          { label: "Edit" },
        ]}
      />
      <PageHeader title="Edit Admit Card" />
      <JobLinkedForm
        kind="admit-card"
        jobId={card.job_id ?? undefined}
        jobs={jobsRes.data ?? []}
        row={card as unknown as Record<string, unknown>}
      />
    </PageContainer>
  );
}