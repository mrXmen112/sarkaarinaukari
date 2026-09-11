import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { JobCategoryForm } from "@/components/admin/JobCategoryForm";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function EditJobCategoryPage({
  params,
}: {
  params: { id: string };
}) {
  const { supabase } = await requireAdmin();
  const { data: category } = await supabase
    .from("job_categories")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!category) notFound();

  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Categories", href: "/admin/job-categories" },
          { label: "Edit" },
        ]}
      />
      <PageHeader title="Edit Job Category" />
      <JobCategoryForm category={category} />
    </PageContainer>
  );
}