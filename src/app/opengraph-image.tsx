import { ImageResponse } from "next/og";
import { ogColors as c, ogFonts, ogSize } from "@/lib/og";

export const alt =
  "MF Compass: which mutual funds have really beaten their peers";
export const size = ogSize;
export const contentType = "image/png";

const Mark = ({ size: s }: { size: number }) => (
  <svg width={s} height={s} viewBox="0 0 32 32">
    <rect width="32" height="32" rx="7.2" fill={c.peacock} />
    <polygon points="23.5,8.5 18.8,18.8 13.2,13.2" fill={c.marigold} />
    <polygon points="8.5,23.5 13.2,13.2 18.8,18.8" fill="#FFFFFF" />
  </svg>
);

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: c.paper,
        fontFamily: "Anek Latin",
        color: c.ink,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <Mark size={72} />
        <span style={{ fontSize: 44, fontWeight: 700 }}>MF Compass</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span
          style={{
            fontSize: 76,
            fontWeight: 700,
            lineHeight: 1.05,
            maxWidth: 900,
          }}
        >
          Which funds have really beaten their peers?
        </span>
        <span
          style={{
            fontSize: 32,
            fontWeight: 500,
            color: c.text2,
            marginTop: 24,
          }}
        >
          Every direct mutual fund, compared with its own kind. Free, no
          sign-up.
        </span>
      </div>
    </div>,
    { ...size, fonts: await ogFonts() },
  );
}
