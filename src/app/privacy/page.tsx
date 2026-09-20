import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/ui/JsonLd";
import { PageContainer, Panel } from "@/components/layout/PageContainer";
import { articleSchema, breadcrumbSchema } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy — SarkaariNaukri.online",
  description:
    "How SarkaariNaukri.online collects, uses and protects your data — cookies, analytics, third-party links and your rights. Read our privacy policy.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <PageContainer>
      <JsonLd
        data={breadcrumbSchema([{ name: "Privacy Policy", path: "/privacy" }])}
      />
      <JsonLd
        data={articleSchema({
          headline: "Privacy Policy",
          description:
            "Data handling, cookies and analytics practices of SarkaariNaukri.online.",
          url: `${SITE.url}/privacy`,
        })}
      />

      <Breadcrumbs
        items={[{ label: "Privacy Policy" }]}
      />

      <header className="mb-4 border-b-2 border-navy pb-3">
        <h1 className="text-2xl md:text-3xl">Privacy Policy</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Last updated: 1 January 2026
        </p>
      </header>

      <Panel title="Information We Collect" className="mb-4">
        <div className="whitespace-pre-line text-sm leading-relaxed">
          {`• We do not require you to create an account or submit personal details to browse this site.
• Anonymous, aggregated usage data (pages viewed, device type, general location) may be collected by our analytics provider to understand which pages help our readers. This data cannot identify you personally.
• Any ad network we use may set cookies or similar identifiers to show relevant ads.`}
        </div>
      </Panel>

      <Panel title="Cookies" className="mb-4">
        <div className="whitespace-pre-line text-sm leading-relaxed">
          {`Cookies are small files stored on your device that help sites remember preferences and measure traffic. You can block or delete cookies through your browser settings at any time; the site remains usable without them.`}
        </div>
      </Panel>

      <Panel title="Third-Party Links" className="mb-4">
        <div className="whitespace-pre-line text-sm leading-relaxed">
          {`Pages on this site link to official government websites and offline application portals. We are not responsible for the content or privacy practices of those external sites. Read each official site's own privacy policy before sharing any data with it.`}
        </div>
      </Panel>

      <Panel title="Your Rights" className="mb-4">
        <div className="whitespace-pre-line text-sm leading-relaxed">
          {`You may request that any stored data about you be corrected or deleted, or simply opt out of non-essential cookies. Contact us via the contact page and we will action reasonable requests promptly.`}
        </div>
      </Panel>
    </PageContainer>
  );
}
