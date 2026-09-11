import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { JobForm } from "@/components/admin/JobForm";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function NewJobPage() {
  const { supabase } = await requireAdmin();

  const [cats, syls] = await Promise.all([
    supabase
      .from("job_categories")
      .select("id, name, slug, parent_category, sort_order, created_at")
      .order("name"),
    supabase.from("syllabus").select("*").order("exam_name"),
  ]);

  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Jobs", href: "/admin/jobs" },
          { label: "New" },
        ]}
      />
      <PageHeader title="New Job" />
      <JobForm categories={cats.data ?? []} syllabi={syls.data ?? []} />
    </PageContainer>
  );
}