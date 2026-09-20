import { faqSchema } from "@/lib/seo";
import { JsonLd } from "@/components/ui/JsonLd";
import { Panel } from "@/components/layout/PageContainer";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  title: string;
  faqs: FAQItem[];
  url: string;
  headline: string;
}

export function FAQSection({ title, faqs, url, headline }: FAQSectionProps) {
  if (faqs.length === 0) return null;

  return (
    <>
      <JsonLd
        data={faqSchema({ faqs, url, headline })}
      />
      <Panel title={title} className="mb-4">
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="group border border-rule rounded-lg"
            >
              <summary className="cursor-pointer list-none rounded-lg px-4 py-3 text-sm font-semibold text-navy hover:bg-navy-50 transition-colors flex items-center justify-between">
                <span>{faq.question}</span>
                <svg
                  className="h-4 w-4 shrink-0 text-ink-muted transition-transform group-open:rotate-180"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </summary>
              <div className="px-4 pb-3 text-sm leading-relaxed text-ink-muted">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </Panel>
    </>
  );
}
