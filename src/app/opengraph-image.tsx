import fs from "node:fs";
import path from "node:path";

import { ImageResponse } from "next/og";

export const alt = "SarkaariNaukri.online — Sarkari Naukri, Admit Card, Result & Yojana Portal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The brand icon, inlined as a data URI so the OG image is self-contained.
 *
 * `next/og` runs on the Node runtime here (no `export const runtime = "edge"`),
 * so fs is available. Reading the generated icon keeps the OG card locked to the
 * same artwork as the favicon set — if the file is ever missing we degrade to
 * the wordmark alone rather than throwing during the build.
 */
function brandIconDataUri(): string | null {
  try {
    const file = path.join(process.cwd(), "public", "icon-192.png");
    const buf = fs.readFileSync(file);
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

/** Default Open Graph image (Phase 2) — generated, no binary asset needed. */
export default function Image() {
  const icon = brandIconDataUri();

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
        <div style={{ display: "flex", alignItems: "center" }}>
          {icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={icon}
              alt=""
              width={112}
              height={112}
              style={{ borderRadius: 24, marginRight: 28 }}
            />
          ) : null}
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
