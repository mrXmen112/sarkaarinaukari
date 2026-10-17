import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { requireAdmin } from "@/lib/admin";

import { QuickPublishForm } from "./QuickPublishForm";

export const dynamic = "force-dynamic";

export default async function QuickPublishPage() {
  const { supabase } = await requireAdmin();
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title")
    .order("title");

  return (
    <PageContainer>
      <Breadcrumbs
        items={[{ label: "Admin", href: "/admin" }, { label: "Quick Publish" }]}
      />
      <PageHeader title="Quick Publish" />
      <p className="mb-4 max-w-2xl text-sm text-ink-muted">
        Paste one official URL (a notification, admit card, result or answer key
        — a web page or a PDF). We fetch it, extract the details for you to
        review, and publish in one click. Publishing stays disabled until the
        main official link passes validation, and new content starts unverified.
        Use the plain forms when you need full control.
      </p>
      <QuickPublishForm jobs={jobs ?? []} />
    </PageContainer>
  );
}
