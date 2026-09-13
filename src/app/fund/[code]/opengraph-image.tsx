import { ImageResponse } from "next/og";
import { getFund } from "@/lib/funds/queries";
import { ogColors, ogFonts, ogSize } from "@/lib/og";

export const revalidate = 300;
export const size = ogSize;
export const contentType = "image/png";

export default async function OpenGraphImage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const fund = await getFund(code);
  if (!fund) return new Response("Not found", { status: 404 });

  const score = fund.totalScore ? Number(fund.totalScore).toFixed(1) : null;
  const titleSize = fund.schemeName.length > 48 ? 56 : 68;

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
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 26, fontWeight: 500, color: ogColors.muted }}>
            {[fund.fundHouseName, fund.fundCategory].filter(Boolean).join("  ·  ")}
          </div>
          <div style={{ fontSize: titleSize, fontWeight: 800, lineHeight: 1.08, letterSpacing: -2, maxWidth: 1040 }}>
            {fund.schemeName}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          {score ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 24, fontWeight: 500, color: ogColors.muted }}>Outperformance score</div>
              <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1, letterSpacing: -3 }}>{score}</div>
            </div>
          ) : (
            <div />
          )}
          <div style={{ fontSize: 28, fontWeight: 500, color: ogColors.muted }}>MF Compass</div>
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() }
  );
}
