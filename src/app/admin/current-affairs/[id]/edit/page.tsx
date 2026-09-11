import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { CurrentAffairForm } from "@/components/admin/CurrentAffairForm";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function EditCurrentAffairPage({
  params,
}: {
  params: { id: string };
}) {
  const { supabase } = await requireAdmin();
  const { data: affair } = await supabase
    .from("current_affairs")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!affair) notFound();

  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Current Affairs", href: "/admin/current-affairs" },
          { label: "Edit" },
        ]}
      />
      <PageHeader title="Edit Current Affairs Brief" />
      <CurrentAffairForm affair={affair} />
    </PageContainer>
  );
}