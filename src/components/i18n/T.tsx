import { t, type MsgKey } from "@/lib/i18n";

/**
 * Bilingual UI label (Phase 4F).
 *
 * Renders the English and Hindi strings into the static HTML and lets CSS
 * show exactly one of them, chosen by `documentElement.dataset.lang`, which an
 * inline script sets from the cookie BEFORE first paint.
 *
 * Why not read the cookie on the server? That would force every page out of
 * ISR into dynamic rendering — far too expensive for this site. Why not do it
 * after hydration? That flashes the wrong language. This keeps pages static,
 * keeps the switch instant, and adds no client bundle beyond the switcher.
 *
 * Only chrome is bilingual. Job titles, departments and eligibility stay in
 * the language the notification used — we never translate official content.
 */
export function T({ k }: { k: MsgKey }) {
  return (
    <>
      <span lang="en" className="lang-en">
        {t("en", k)}
      </span>
      <span lang="hi" className="lang-hi">
        {t("hi", k)}
      </span>
    </>
  );
}