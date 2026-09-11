import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { JobLinkedForm } from "@/components/admin/JobLinkedForm";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function NewAdmitCardPage() {
  const { supabase } = await requireAdmin();
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title")
    .order("title");

  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Admit Cards", href: "/admin/admit-cards" },
          { label: "New" },
        ]}
      />
      <PageHeader title="New Admit Card" />
      <JobLinkedForm kind="admit-card" jobs={jobs ?? []} />
    </PageContainer>
  );
}