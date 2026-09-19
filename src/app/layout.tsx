import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Noto_Sans, PT_Serif } from "next/font/google";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SITE } from "@/lib/site";

import "./globals.css";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  display: "swap",
});

const ptSerif = PT_Serif({
  variable: "--font-pt-serif",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://sarkaarinaukri.online"),
  title: {
    default: `${SITE.name} — Sarkari Naukri, Admit Card, Result 2026`,
    template: `%s | ${SITE.shortName}`,
  },
  description:
    "Latest Sarkari Naukri 2026: central & state government jobs, Bihar vacancies (BPSC, BSSC, Bihar Police, TRE), admit cards, results, answer keys, syllabus and Sarkari Yojana — updated daily.",
  keywords: [
    "sarkari naukri",
    "government jobs 2026",
    "bihar govt jobs",
    "bpsc",
    "bssc",
    "admit card",
    "sarkari result",
    "sarkari yojana",
  ],
  robots: { index: true, follow: true },
  other: { monetag: "0b94690020c4d73b3027549ddfa9878e" },
  openGraph: {
    type: "website",
    locale: SITE.locale,
    siteName: SITE.name,
    title: `${SITE.name} — Sarkari Naukri, Admit Card, Result 2026`,
    description:
      "Latest central & state government jobs, Bihar vacancies, admit cards, results and Sarkari Yojana updates.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B3D6E",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-IN"
      className={`${notoSans.variable} ${ptSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* Skip link — first focusable element on every page */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-1 focus:left-1 focus:z-50 focus:bg-saffron focus:px-3 focus:py-1.5 focus:text-sm focus:font-bold focus:text-navy"
        >
          Skip to main content
        </a>

        <Header />

        <div id="main-content" className="flex-1">
          {children}
        </div>

        <Footer />
        <Script id="monetag-ad-script" strategy="afterInteractive">
          {`(function(s){s.dataset.zone='11839114',s.src='https://nap5k.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))`}
        </Script>
        <Script id="monetag-popunder-script" strategy="afterInteractive">
          {`(function(s){s.dataset.zone='11839131',s.src='https://al5sm.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))`}
        </Script>
        <Script
          id="monetag-push-script"
          src="https://5gvci.com/act/files/tag.min.js?z=11839138"
          data-cfasync="false"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
