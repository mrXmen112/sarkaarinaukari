import Link from "next/link";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { CurrentAffairForm } from "@/components/admin/CurrentAffairForm";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function NewCurrentAffairPage() {
  await requireAdmin();
  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Current Affairs", href: "/admin/current-affairs" },
          { label: "New" },
        ]}
      />
      <PageHeader title="New Current Affairs Brief" />
      <CurrentAffairForm />
    </PageContainer>
  );
}