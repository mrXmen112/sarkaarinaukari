import { ImageResponse } from "next/og";

export const alt = "SarkaariNaukri.online — Sarkari Naukri, Admit Card, Result & Yojana Portal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default Open Graph image (Phase 2) — generated, no binary asset needed. */
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          backgroundColor: "#0B3D6E",
          padding: "72px",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 84,
            fontWeight: 700,
            color: "white",
            fontFamily: "serif",
          }}
        >
          SarkaariNaukri<span style={{ color: "#FF9933" }}>.online</span>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 40,
            color: "#CBD5E1",
            fontFamily: "sans-serif",
          }}
        >
          Sarkari Naukri, Admit Card, Result &amp; Yojana
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 44,
            height: 12,
            width: 420,
            backgroundColor: "#FF9933",
            borderRadius: 6,
          }}
        />
        <div
          style={{
            display: "flex",
            marginTop: 40,
            fontSize: 30,
            color: "#94A3B8",
            fontFamily: "sans-serif",
          }}
        >
          Latest Government Jobs 2026 &middot; Bihar Bharti Updates
        </div>
      </div>
    ),
    { ...size },
  );
}
