import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { JobLinkedForm } from "@/components/admin/JobLinkedForm";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function NewResultPage() {
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
          { label: "Results", href: "/admin/results" },
          { label: "New" },
        ]}
      />
      <PageHeader title="New Result" />
      <JobLinkedForm kind="result" jobs={jobs ?? []} />
    </PageContainer>
  );
}