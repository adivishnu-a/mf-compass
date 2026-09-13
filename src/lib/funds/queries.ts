import { cache } from "react";
import { unstable_cache } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { funds } from "@drizzle/schema";

/** Columns the leaderboard needs; heavy text fields stay out of the payload. */
const leaderboardColumns = {
  id: true,
  kuveraCode: true,
  schemeName: true,
  shortName: true,
  smallScreenName: true,
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
} as const;

const toIso = (value: Date | null) => (value ? value.toISOString() : null);

async function queryLeaderboard(category: string | null) {
  const rows = await db.query.funds.findMany({
    columns: leaderboardColumns,
    where: category ? eq(funds.fundCategory, category) : undefined,
    orderBy: [desc(funds.totalScore)],
  });
  // Timestamps become strings so cached (JSON) and fresh results have one shape.
  return rows.map((row) => ({
    ...row,
    scoreUpdated: toIso(row.scoreUpdated),
    lastUpdated: toIso(row.lastUpdated),
    createdAt: toIso(row.createdAt),
  }));
}

export type LeaderboardFund = Awaited<
  ReturnType<typeof queryLeaderboard>
>[number];

/** Category leaderboard, cached for five minutes per category (null = all funds). */
export const getLeaderboard = unstable_cache(
  queryLeaderboard,
  ["leaderboard"],
  {
    revalidate: 300,
    tags: ["funds"],
  },
);

/** One fund by Kuvera code, deduplicated across metadata, page and share card within a request. */
export const getFund = cache(async (code: string) =>
  db.query.funds.findFirst({ where: eq(funds.kuveraCode, code) }),
);
