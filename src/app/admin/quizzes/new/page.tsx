import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { QuizForm } from "@/components/admin/QuizForm";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function NewQuizPage() {
  await requireAdmin();
  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Quizzes", href: "/admin/quizzes" },
          { label: "New" },
        ]}
      />
      <PageHeader title="New Quiz" />
      <QuizForm />
    </PageContainer>
  );
}