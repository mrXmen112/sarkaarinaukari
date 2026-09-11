import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { YojanaForm } from "@/components/admin/YojanaForm";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function EditYojanaPage({
  params,
}: {
  params: { id: string };
}) {
  const { supabase } = await requireAdmin();
  const { data: yojana } = await supabase
    .from("yojana")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!yojana) notFound();

  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Yojana", href: "/admin/yojana" },
          { label: "Edit" },
        ]}
      />
      <PageHeader title="Edit Yojana" />
      <YojanaForm yojana={yojana} />
    </PageContainer>
  );
}