import { ImageResponse } from "next/og";
import { getFundDetail } from "@/lib/data";
import { rankOf } from "@/lib/format";
import { ogColors as c, ogFonts, ogSize } from "@/lib/og";

export const alt = "A fund's Compass Score on MF Compass";
export const size = ogSize;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const detail = await getFundDetail(decodeURIComponent((await params).code));
  const fund = detail?.fund;
  const board = detail?.board;
  const peers =
    board?.funds
      .filter((f) => f.score !== null && f.code !== fund?.code)
      .map((f) => f.score!) ?? [];
  const W = 1056;

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
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <svg width={48} height={48} viewBox="0 0 32 32">
          <rect width="32" height="32" rx="7.2" fill={c.peacock} />
          <polygon points="23.5,8.5 18.8,18.8 13.2,13.2" fill={c.marigold} />
          <polygon points="8.5,23.5 13.2,13.2 18.8,18.8" fill="#FFFFFF" />
        </svg>
        <span style={{ fontSize: 30, fontWeight: 700 }}>MF Compass</span>
        <span
          style={{
            fontSize: 30,
            fontWeight: 500,
            color: c.text2,
            marginLeft: 8,
          }}
        >
          {board?.info.label ?? ""} funds
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.05 }}>
          {fund?.name ?? "Fund not found"}
        </span>
        {fund && board && fund.score !== null ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 20,
                marginTop: 20,
              }}
            >
              <span style={{ fontSize: 120, fontWeight: 700, lineHeight: 1 }}>
                {fund.score.toFixed(1)}
              </span>
              <span style={{ fontSize: 36, fontWeight: 500, color: c.peacock }}>
                Compass Score · {rankOf(fund.rank!, board.rated).toLowerCase()}{" "}
                {board.info.plural}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                position: "relative",
                width: W,
                height: 40,
                marginTop: 28,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 18,
                  width: W,
                  height: 4,
                  borderRadius: 2,
                  background: c.track,
                }}
              />
              {peers.map((p, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: (p / 100) * W - 6,
                    top: 14,
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    background: c.peer,
                  }}
                />
              ))}
              <div
                style={{
                  position: "absolute",
                  left: (fund.score / 100) * W - 20,
                  top: 0,
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  background: c.peacock,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    background: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      background: c.marigold,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <span
            style={{
              fontSize: 36,
              fontWeight: 500,
              color: c.text2,
              marginTop: 20,
            }}
          >
            {fund ? "Too new to rate: a score needs 3 years of prices." : ""}
          </span>
        )}
      </div>
    </div>,
    { ...size, fonts: await ogFonts() },
  );
}
