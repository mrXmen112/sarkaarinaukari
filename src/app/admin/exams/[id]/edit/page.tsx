import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { ExamForm } from "@/components/admin/ExamForm";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function EditExamPage({
  params,
}: {
  params: { id: string };
}) {
  const { supabase } = await requireAdmin();
  const { data: exam } = await supabase
    .from("exams")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!exam) notFound();

  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Exams", href: "/admin/exams" },
          { label: "Edit" },
        ]}
      />
      <PageHeader title="Edit Exam" />
      <ExamForm exam={exam} />
    </PageContainer>
  );
}