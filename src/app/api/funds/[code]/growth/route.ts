import { NextResponse } from "next/server";
import { getFundDetail } from "@/lib/data";
import { rebase } from "@/lib/growth";

/** Five years of weekly growth of ₹100 for a fund and its category (the rankings preview chart). */
export async function GET(
  _: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const detail = await getFundDetail(decodeURIComponent((await params).code));
    if (!detail)
      return NextResponse.json({ error: "No such fund" }, { status: 404 });
    const last = detail.weekly.fund.at(-1)?.[0];
    if (last === undefined)
      return NextResponse.json({ fund: [], category: [] });
    const d = new Date(last * 86_400_000);
    d.setUTCFullYear(d.getUTCFullYear() - 5);
    const from = Math.max(
      Math.round(d.getTime() / 86_400_000),
      detail.weekly.fund[0][0],
    );
    const round = (s: [number, number][]) =>
      s.map(([day, v]) => [day, Math.round(v * 100) / 100]);
    return NextResponse.json(
      {
        fund: round(rebase(detail.weekly.fund, from)),
        category: round(rebase(detail.weekly.category, from)),
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    console.error("Error building fund growth:", error);
    return NextResponse.json({ error: "Growth unavailable" }, { status: 500 });
  }
}
