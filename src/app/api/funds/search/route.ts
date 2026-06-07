import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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
      shortName: true,
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
    const query = q.toLowerCase().trim();
    const queryTokens = query.split(/\s+/).filter(Boolean);

    if (queryTokens.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const scored = searchUniverse.map((fund) => {
      const schemeName = (fund.schemeName || "").toLowerCase();
      const shortName = (fund.shortName || "").toLowerCase();
      const fundHouseName = (fund.fundHouseName || "").toLowerCase();
      const fundCategory = (fund.fundCategory || "").toLowerCase();

      // Words in the fund's name and details
      const schemeWords = schemeName.split(/[\s\-]+/);
      const shortWords = shortName.split(/[\s\-]+/);
      const houseWords = fundHouseName.split(/[\s\-]+/);
      const categoryWords = fundCategory.split(/[\s\-]+/);

      let matchedTokensCount = 0;
      let scoreBonus = 0;

      for (const token of queryTokens) {
        let isTokenMatched = false;

        // 1. Check shortName words (highest priority)
        for (const word of shortWords) {
          if (word.startsWith(token)) {
            scoreBonus += 150;
            if (word === token) scoreBonus += 100;
            isTokenMatched = true;
          } else if (word.includes(token)) {
            scoreBonus += 40;
            isTokenMatched = true;
          }
        }

        // 2. Check schemeName words
        for (const word of schemeWords) {
          if (word.startsWith(token)) {
            scoreBonus += 100;
            if (word === token) scoreBonus += 50;
            isTokenMatched = true;
          } else if (word.includes(token)) {
            scoreBonus += 30;
            isTokenMatched = true;
          }
        }

        // 3. Check houseName words
        for (const word of houseWords) {
          if (word.startsWith(token)) {
            scoreBonus += 50;
            isTokenMatched = true;
          } else if (word.includes(token)) {
            scoreBonus += 15;
            isTokenMatched = true;
          }
        }

        // 4. Check category words
        for (const word of categoryWords) {
          if (word.startsWith(token)) {
            scoreBonus += 40;
            isTokenMatched = true;
          } else if (word.includes(token)) {
            scoreBonus += 10;
            isTokenMatched = true;
          }
        }

        // 5. Fallback substring search
        if (!isTokenMatched) {
          if (schemeName.includes(token) || shortName.includes(token)) {
            scoreBonus += 10;
            isTokenMatched = true;
          }
        }

        if (isTokenMatched) {
          matchedTokensCount++;
        }
      }

      // Prefix match on the entire query (e.g. search "moti" matches "Motilal...")
      if (shortName.startsWith(query)) {
        scoreBonus += 1000;
      } else if (schemeName.startsWith(query)) {
        scoreBonus += 500;
      }

      // Tie-breaker: prefer funds with higher totalScore
      const totalScoreNum = parseFloat(fund.totalScore || "0");
      const finalScore = matchedTokensCount * 10000 + scoreBonus + totalScoreNum;

      return {
        fund,
        matchedTokensCount,
        finalScore,
      };
    });

    // We prioritize funds that match more query tokens.
    const results = scored
      .filter((item) => item.matchedTokensCount > 0)
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 20)
      .map((item) => item.fund);

    const response = NextResponse.json({
      success: true,
      data: results,
    });

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
