import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/ui/JsonLd";
import { PageContainer, Panel } from "@/components/layout/PageContainer";
import { articleSchema, breadcrumbSchema } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About SarkaariNaukari.online — Sarkari Naukri & Yojana Portal",
  description:
    "SarkaariNaukari.online is a one-stop Indian government job portal — latest sarkari naukri notifications, admit cards, results, answer keys and sarkari yojana. Learn about our mission, editorial standards and how we verify every post.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <PageContainer>
      <JsonLd
        data={breadcrumbSchema([{ name: "About Us", path: "/about" }])}
      />
      <JsonLd
        data={articleSchema({
          headline: "About SarkaariNaukari.online",
          description:
            "How we publish verified government job notifications, admit cards, results and yojana on a single portal.",
          url: `${SITE.url}/about`,
        })}
      />

      <Breadcrumbs
        items={[{ label: "About Us" }]}
      />

      <header className="mb-4 border-b-2 border-navy pb-3">
        <h1 className="text-2xl md:text-3xl">About SarkaariNaukari.online</h1>
      </header>

      <Panel title="Our Mission" className="mb-4">
        <div className="whitespace-pre-line text-sm leading-relaxed">
          {`SarkaariNaukari.online brings every central & state government exam update to one place — job notifications, admit cards, results, answer keys, syllabus and sarkari yojana — so you never miss an important date.

We focus on Bihar & Jharkhand government jobs (BPSC, BSSC, Bihar Police, TRE) alongside all-India vacancies from SSC, IBPS and RRB, organised into exam-wise guides and syllabus.`}
        </div>
      </Panel>

      <Panel title="Editorial Standards" className="mb-4">
        <div className="whitespace-pre-line text-sm leading-relaxed">
          {`• Every notification is verified against the official department or scheme website before publication.
• All admit cards, results and yojana links point to official portals — never to third-party mirrors.
• Post dates, exam dates and deadlines are the dates announced by the issuing authority.
• When an official page hasn't released a document yet, we clearly mark it "Yet to release" instead of guessing.`}
        </div>
      </Panel>

      <Panel title="Contact" className="mb-4">
        <div className="whitespace-pre-line text-sm leading-relaxed">
          {`Questions, corrections or feedback? Reach us on the contact page — we read every message and update pages when official information changes.`}
        </div>
      </Panel>
    </PageContainer>
  );
}
