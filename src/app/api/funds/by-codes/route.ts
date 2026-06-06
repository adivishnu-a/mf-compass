import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { funds } from "@drizzle/schema";
import { inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const codesParam = searchParams.get("codes");

    if (!codesParam) {
      return NextResponse.json(
        { success: false, error: "Missing 'codes' query parameter" },
        { status: 400 }
      );
    }

    const codes = codesParam
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    if (codes.length === 0) {
      return NextResponse.json(
        { success: false, error: "Empty 'codes' query parameter" },
        { status: 400 }
      );
    }

    if (codes.length > 10) {
      return NextResponse.json(
        { success: false, error: "Cannot request more than 10 codes" },
        { status: 400 }
      );
    }

    // Fetch from database
    const dbFunds = await db.query.funds.findMany({
      where: inArray(funds.kuveraCode, codes),
    });

    // Map to preserve order and keep only valid found ones
    const data = codes
      .map((code) => dbFunds.find((f) => f.kuveraCode === code))
      .filter((f): f is typeof dbFunds[number] => !!f);

    const response = NextResponse.json({
      success: true,
      data,
    });

    // Cache-Control: public, s-maxage=300, stale-while-revalidate=600
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600"
    );

    return response;
  } catch (error: any) {
    console.error("Error fetching funds by codes:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
