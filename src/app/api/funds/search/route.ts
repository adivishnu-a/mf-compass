import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { funds } from "@drizzle/schema";
import Fuse from "fuse.js";

// Cache the search universe in-memory to keep response times under 5ms
let cachedSearchFunds: any[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL = 60 * 1000 * 5; // 5 minutes

async function getSearchFunds() {
  const now = Date.now();
  if (cachedSearchFunds && now - lastCacheTime < CACHE_TTL) {
    return cachedSearchFunds;
  }

  // Fetch minimal columns for searching
  const data = await db.query.funds.findMany({
    columns: {
      id: true,
      kuveraCode: true,
      schemeName: true,
      fundHouseName: true,
      fundCategory: true,
      totalScore: true,
    },
  });

  cachedSearchFunds = data;
  lastCacheTime = now;
  return data;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";

    if (q.length < 2 || q.length > 64) {
      return NextResponse.json(
        { success: true, data: [] },
        {
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          },
        }
      );
    }

    const searchUniverse = await getSearchFunds();

    const fuse = new Fuse(searchUniverse, {
      keys: [
        { name: "schemeName", weight: 0.7 },
        { name: "fundHouseName", weight: 0.3 },
      ],
      threshold: 0.4,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });

    const results = fuse.search(q).slice(0, 20).map((r) => r.item);

    const response = NextResponse.json({
      success: true,
      data: results,
    });

    // Cache-Control: public, s-maxage=300, stale-while-revalidate=600
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600"
    );

    return response;
  } catch (error: any) {
    console.error("Error searching funds:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
