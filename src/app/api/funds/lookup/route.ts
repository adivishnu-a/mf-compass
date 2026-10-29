import { NextResponse } from "next/server";
import { getLookup } from "@/lib/data";

/** Every fund in a compact form for in-browser search, the compare tray and saved funds. */
export async function GET() {
  try {
    return NextResponse.json(await getLookup(), {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Error building fund lookup:", error);
    return NextResponse.json(
      { error: "Fund list unavailable" },
      { status: 500 },
    );
  }
}
