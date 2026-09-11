import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { JobLinkedForm } from "@/components/admin/JobLinkedForm";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function NewAnswerKeyPage() {
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
          { label: "Answer Keys", href: "/admin/answer-keys" },
          { label: "New" },
        ]}
      />
      <PageHeader title="New Answer Key" />
      <JobLinkedForm kind="answer-key" jobs={jobs ?? []} />
    </PageContainer>
  );
}