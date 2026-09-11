import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { JobForm } from "@/components/admin/JobForm";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function EditJobPage({
  params,
}: {
  params: { id: string };
}) {
  const { supabase } = await requireAdmin();

  const [jobRes, cats, syls] = await Promise.all([
    supabase.from("jobs").select("*").eq("id", params.id).maybeSingle(),
    supabase
      .from("job_categories")
      .select("id, name, slug, parent_category, sort_order, created_at")
      .order("name"),
    supabase.from("syllabus").select("*").order("exam_name"),
  ]);

  const job = jobRes.data;
  if (!job) notFound();

  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Jobs", href: "/admin/jobs" },
          { label: "Edit" },
        ]}
      />
      <PageHeader title="Edit Job" />
      <JobForm job={job} categories={cats.data ?? []} syllabi={syls.data ?? []} />
    </PageContainer>
  );
}