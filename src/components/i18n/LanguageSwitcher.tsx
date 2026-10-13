"use client";

import { useState } from "react";

import { LANG_COOKIE, isLang, type Lang } from "@/lib/i18n";

/**
 * Language switcher (Phase 4F). Writes the lang cookie and flips
 * documentElement.dataset.lang, which the CSS uses to show one language.
 * No router refresh and no layout shift: both strings are already in the DOM.
 *
 * The initial value is read lazily from the DOM (the pre-paint script in the
 * layout has already set data-lang) rather than in an effect, which keeps the
 * label correct on first render and avoids a cascading setState.
 */
export function LanguageSwitcher() {
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof document === "undefined") return "en";
    const current = document.documentElement.dataset.lang;
    return isLang(current) ? current : "en";
  });

  function toggle() {
    const next: Lang = lang === "en" ? "hi" : "en";
    document.documentElement.dataset.lang = next;
    document.documentElement.setAttribute("lang", next === "hi" ? "hi-IN" : "en-IN");
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    setLang(next);

    // The search field is a single input (two inputs would submit twice), so
    // swap its placeholder instead of rendering a second one.
    const search = document.querySelector<HTMLInputElement>('input[name="q"]');
    if (search) {
      search.placeholder =
        next === "hi"
          ? (search.dataset.placeholderHi ?? search.placeholder)
          : (search.dataset.placeholderEn ?? search.placeholder);
    }
  }

  const label = lang === "en" ? "हिंदी" : "English";
  const title =
    lang === "en"
      ? "Switch the interface to Hindi"
      : "Switch the interface to English";

  return (
    <button
      type="button"
      onClick={toggle}
      title={title}
      aria-label={title}
      className="shrink-0 rounded-sm border border-navy-400 px-2 py-0.5 text-xs font-semibold text-white hover:bg-navy-800"
    >
      {label}
    </button>
  );
}