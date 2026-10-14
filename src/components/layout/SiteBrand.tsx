import Image from "next/image";

/**
 * Site brand mark: the app icon (public/icon.svg -> generated PNGs) next to the
 * wordmark rendered as real HTML text.
 *
 * Why the wordmark is HTML text and not part of the SVG: the old
 * `logo-full.svg` used <text> with a webfont stack (Poppins/Arial), so the word
 * rendered in a fallback font or not at all depending on the machine — that is
 * what made the header logo look broken. Rendering "SarkaariNaukri" as text
 * means it always uses the site's own loaded font, stays selectable for screen
 * readers, and cannot drift from the real brand name.
 *
 * Both the header and the footer sit on navy, so `tone="light"` is the default
 * (white wordmark). `tone="dark"` is for light backgrounds.
 */
export function SiteBrand({
  size = 38,
  tone = "light",
  tagline,
  className = "",
}: {
  /** Icon size in px. 36-40 reads best at the current header scale. */
  size?: number;
  tone?: "light" | "dark";
  /** Optional small line under the wordmark (header only). */
  tagline?: string;
  className?: string;
}) {
  const word = tone === "light" ? "text-white" : "text-navy";
  const sub = tone === "light" ? "text-navy-200" : "text-ink-muted";

  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <Image
        src="/icon-192.png"
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        className="shrink-0 rounded-[7px]"
        style={{ width: size, height: size }}
      />
      <span className="flex min-w-0 flex-col leading-none">
        <span className={`text-[1.0625rem] font-bold tracking-tight ${word}`}>
          Sarkaari
          <span className="text-saffron">Naukri</span>
        </span>
        {tagline ? (
          <span className={`mt-1 truncate text-[0.6875rem] font-medium ${sub}`}>
            {tagline}
          </span>
        ) : null}
      </span>
    </span>
  );
}
