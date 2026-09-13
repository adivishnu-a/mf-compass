import { NextRequest, NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/funds/queries";
import { FUND_CATEGORIES } from "@/lib/kuvera/categories";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    if (category && category !== "all" && !(FUND_CATEGORIES as readonly string[]).includes(category)) {
      return NextResponse.json(
        { success: false, error: `Invalid category: ${category}` },
        { status: 400 }
      );
    }

    const data = await getLeaderboard(category && category !== "all" ? category : null);

    const response = NextResponse.json({
      success: true,
      data,
      count: data.length,
    });

    // Cache-Control: public, s-maxage=300, stale-while-revalidate=600
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600"
    );

    return response;
  } catch (error) {
    console.error("Error fetching funds:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
