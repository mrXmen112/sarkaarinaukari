import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/ui/JsonLd";
import { PageContainer, Panel } from "@/components/layout/PageContainer";
import { articleSchema, breadcrumbSchema } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Disclaimer — SarkaariNaukri.online",
  description:
    "Read the disclaimer for SarkaariNaukri.online — an unofficial information portal. We are not an official government website.",
  alternates: { canonical: "/disclaimer" },
};

export default function DisclaimerPage() {
  return (
    <PageContainer>
      <JsonLd
        data={breadcrumbSchema([{ name: "Disclaimer", path: "/disclaimer" }])}
      />
      <JsonLd
        data={articleSchema({
          headline: "Disclaimer",
          description:
            "Important disclaimer — SarkaariNaukri.online is an unofficial information aggregator, not a government body.",
          url: `${SITE.url}/disclaimer`,
        })}
      />

      <Breadcrumbs
        items={[{ label: "Disclaimer" }]}
      />

      <header className="mb-4 border-b-2 border-navy pb-3">
        <h1 className="text-2xl md:text-3xl">Disclaimer</h1>
      </header>

      <Panel title="Unofficial Information Portal" className="mb-4">
        <div className="whitespace-pre-line text-sm leading-relaxed">
          {`SarkaariNaukri.online is an independent, unofficial website that aggregates publicly available information about government jobs, examinations, schemes and yojana in India. We are not affiliated with, endorsed by, or connected to any government department, commission, ministry or public authority.`}
        </div>
      </Panel>

      <Panel title="Verify on Official Sources" className="mb-4">
        <div className="whitespace-pre-line text-sm leading-relaxed">
          {`Information here is compiled from official websites and may change faster than we can update. For anything official — applying, fees, admit cards, results — always use the official department website or the "Official Website" link on the relevant page.`}
        </div>
      </Panel>

      <Panel title="No Legal or Financial Advice" className="mb-4">
        <div className="whitespace-pre-line text-sm leading-relaxed">
          {`Nothing on this site constitutes legal, financial or professional advice. Decisions about applying for jobs or schemes are entirely your own, made in reliance on official notifications.`}
        </div>
      </Panel>
    </PageContainer>
  );
}
