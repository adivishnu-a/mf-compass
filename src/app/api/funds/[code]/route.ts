import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { funds } from "@drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!code) {
      return NextResponse.json(
        { success: false, error: "Kuvera code is required" },
        { status: 400 }
      );
    }

    const data = await db.query.funds.findFirst({
      where: eq(funds.kuveraCode, code),
    });

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Fund not found" },
        { status: 404 }
      );
    }

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
    console.error("Error fetching fund details:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
