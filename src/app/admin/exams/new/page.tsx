import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { ExamForm } from "@/components/admin/ExamForm";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function NewExamPage() {
  await requireAdmin();
  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Exams", href: "/admin/exams" },
          { label: "New" },
        ]}
      />
      <PageHeader title="New Exam" />
      <ExamForm />
    </PageContainer>
  );
}