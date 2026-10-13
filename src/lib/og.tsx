import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/**
 * Branded Open Graph image (Phase 2) — navy background, saffron rule,
 * serif headline. Rendered at the edge by next/og; no binary assets needed.
 */
export function brandOg({
  badge,
  title,
  subtitle,
}: {
  badge?: string;
  title: string;
  subtitle?: string;
}) {
  const headlineSize = title.length > 52 ? 56 : title.length > 34 ? 66 : 76;
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundColor: "#0B3D6E",
          padding: "64px",
        }}
      >
        {badge ? (
          <div
            style={{
              display: "flex",
              fontSize: 26,
              color: "#FF9933",
              fontFamily: "sans-serif",
              fontWeight: 700,
              letterSpacing: 3,
              marginBottom: 20,
            }}
          >
            {badge}
          </div>
        ) : null}
        <div
          style={{
            display: "flex",
            fontSize: headlineSize,
            fontWeight: 700,
            color: "white",
            fontFamily: "serif",
            lineHeight: 1.15,
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              display: "flex",
              marginTop: 26,
              fontSize: 34,
              color: "#CBD5E1",
              fontFamily: "sans-serif",
            }}
          >
            {subtitle}
          </div>
        ) : null}
        <div
          style={{
            display: "flex",
            marginTop: 46,
            height: 12,
            width: 380,
            backgroundColor: "#FF9933",
            borderRadius: 6,
          }}
        />
        <div
          style={{
            display: "flex",
            marginTop: 38,
            fontSize: 30,
            color: "#94A3B8",
            fontFamily: "sans-serif",
          }}
        >
          SarkaariNaukri.online — Sarkari Naukri, Admit Card, Result &amp; Yojana
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
