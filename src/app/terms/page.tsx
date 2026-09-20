import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/ui/JsonLd";
import { PageContainer, Panel } from "@/components/layout/PageContainer";
import { articleSchema, breadcrumbSchema } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use — SarkaariNaukri.online",
  description:
    "Terms governing your use of SarkaariNaukri.online — acceptable use, accuracy of information, liability and more. Read our terms of use.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <PageContainer>
      <JsonLd
        data={breadcrumbSchema([{ name: "Terms of Use", path: "/terms" }])}
      />
      <JsonLd
        data={articleSchema({
          headline: "Terms of Use",
          description:
            "The rules for using SarkaariNaukri.online and its content.",
          url: `${SITE.url}/terms`,
        })}
      />

      <Breadcrumbs
        items={[{ label: "Terms of Use" }]}
      />

      <header className="mb-4 border-b-2 border-navy pb-3">
        <h1 className="text-2xl md:text-3xl">Terms of Use</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Last updated: 1 January 2026
        </p>
      </header>

      <Panel title="Information Accuracy" className="mb-4">
        <div className="whitespace-pre-line text-sm leading-relaxed">
          {`Content on this site is compiled from official government sources and updated regularly, but it is provided for general information only. Always confirm the official notification on the issuing department's website before applying. We are not the official authority for any recruitment or scheme.`}
        </div>
      </Panel>

      <Panel title="Acceptable Use" className="mb-4">
        <div className="whitespace-pre-line text-sm leading-relaxed">
          {`You may view and share links to our pages for personal, non-commercial purposes. You may not republish our content wholesale, scrape the site at scale, or misrepresent our content as being from an official authority.`}
        </div>
      </Panel>

      <Panel title="No Guarantee of Employment" className="mb-4">
        <div className="whitespace-pre-line text-sm leading-relaxed">
          {`Listing a vacancy or scheme on this site in no way guarantees application success, selection or payment of benefits. Selection and benefits are decided solely by the relevant government department.`}
        </div>
      </Panel>

      <Panel title="Limitation of Liability" className="mb-4">
        <div className="whitespace-pre-line text-sm leading-relaxed">
          {`To the fullest extent permitted by law, we are not liable for any loss arising from reliance on information published here or from links to third-party sites. By using this site you accept these terms.`}
        </div>
      </Panel>
    </PageContainer>
  );
}
