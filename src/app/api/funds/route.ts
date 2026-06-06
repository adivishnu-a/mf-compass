import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { funds } from "@drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { FUND_CATEGORIES } from "@/lib/kuvera/categories";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    // Query filters
    let queryFilter = undefined;
    if (category && category !== "all") {
      const isValid = FUND_CATEGORIES.includes(category as any);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: `Invalid category: ${category}` },
          { status: 400 }
        );
      }
      queryFilter = eq(funds.fundCategory, category);
    }

    // Projection fields (excluding heavy fields to keep payload small)
    const data = await db.query.funds.findMany({
      columns: {
        id: true,
        kuveraCode: true,
        schemeName: true,
        isin: true,
        fundHouse: true,
        fundHouseName: true,
        fundCategory: true,
        fundType: true,
        lumpAvailable: true,
        lumpMin: true,
        sipAvailable: true,
        sipMin: true,
        lockInPeriod: true,
        currentNavDate: true,
        t1NavDate: true,
        returns1d: true,
        returns1w: true,
        returns1y: true,
        returns3y: true,
        returns5y: true,
        returnsInception: true,
        returnsDate: true,
        startDate: true,
        expenseRatio: true,
        expenseRatioDate: true,
        aum: true,
        fundRating: true,
        fundRatingDate: true,
        totalScore: true,
        scoreUpdated: true,
        lastUpdated: true,
        createdAt: true,
      },
      where: queryFilter,
      orderBy: [desc(funds.totalScore)],
    });

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
  } catch (error: any) {
    console.error("Error fetching funds:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
