import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { JobCategoryForm } from "@/components/admin/JobCategoryForm";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function NewJobCategoryPage() {
  await requireAdmin();
  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Categories", href: "/admin/job-categories" },
          { label: "New" },
        ]}
      />
      <PageHeader title="New Job Category" />
      <JobCategoryForm />
    </PageContainer>
  );
}