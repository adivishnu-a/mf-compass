import { ImageResponse } from "next/og";
import { ogColors, ogFonts, ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "MF Compass: Indian mutual funds ranked by outperformance";

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: ogColors.blue,
          color: ogColors.paper,
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 28, fontWeight: 500, color: ogColors.muted }}>MF Compass</div>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05, letterSpacing: -3, maxWidth: 1000 }}>
            Indian mutual funds ranked by outperformance
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 30, fontWeight: 500 }}>
          <div style={{ maxWidth: 760, lineHeight: 1.3 }}>
            Scored against the category average, not raw returns. Direct growth plans only. Free, anonymous, refreshed daily.
          </div>
          <div style={{ color: ogColors.muted }}>mf-compass.vercel.app</div>
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() }
  );
}
