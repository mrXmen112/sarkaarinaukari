import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { YojanaForm } from "@/components/admin/YojanaForm";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function NewYojanaPage() {
  await requireAdmin();
  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Yojana", href: "/admin/yojana" },
          { label: "New" },
        ]}
      />
      <PageHeader title="New Yojana" />
      <YojanaForm />
    </PageContainer>
  );
}