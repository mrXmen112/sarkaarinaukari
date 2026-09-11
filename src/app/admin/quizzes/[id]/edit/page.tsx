import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { QuizForm } from "@/components/admin/QuizForm";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function EditQuizPage({
  params,
}: {
  params: { id: string };
}) {
  const { supabase } = await requireAdmin();
  const { data: quiz } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!quiz) notFound();

  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Quizzes", href: "/admin/quizzes" },
          { label: "Edit" },
        ]}
      />
      <PageHeader title="Edit Quiz" />
      <QuizForm quiz={quiz} />
    </PageContainer>
  );
}