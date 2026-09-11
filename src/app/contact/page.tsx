import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/ui/JsonLd";
import { PageContainer, Panel } from "@/components/layout/PageContainer";
import {
  ExternalLinkRow,
} from "@/components/updates/UpdatePanels";
import { articleSchema, breadcrumbSchema } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Us — SarkaariNaukari.online",
  description:
    "Get in touch with the SarkaariNaukari.online team. Report corrections, ask about a notification, or send feedback — we reply to every message.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <PageContainer>
      <JsonLd
        data={breadcrumbSchema([{ name: "Contact Us", path: "/contact" }])}
      />
      <JsonLd
        data={articleSchema({
          headline: "Contact SarkaariNaukari.online",
          description:
            "How to reach the SarkaariNaukari.online team with questions, corrections and feedback.",
          url: `${SITE.url}/contact`,
        })}
      />

      <Breadcrumbs
        items={[{ label: "Contact Us" }]}
      />

      <header className="mb-4 border-b-2 border-navy pb-3">
        <h1 className="text-2xl md:text-3xl">Contact Us</h1>
        <p className="mt-1 text-sm text-ink-muted">
          We read every message and update pages when official information changes.
        </p>
      </header>

      <Panel title="Email" className="mb-4">
        <ul className="divide-y divide-rule">
          <ExternalLinkRow
            href={`mailto:${SITE.contactEmail}`}
            label="General / Feedback"
            icon="globe"
          />
        </ul>
      </Panel>

      <Panel title="Before You Write" className="mb-4">
        <div className="whitespace-pre-line text-sm leading-relaxed">
          {`• For admit card downloads, results or official application links, always use the "Official Website" button on the relevant page — we don't handle applications directly.
• Corrections are fastest when you include the exact job/scheme name and the official source link.
• We never ask for OTPs, money or personal documents. Beware of callers claiming to be from this site.`}
        </div>
      </Panel>
    </PageContainer>
  );
}
