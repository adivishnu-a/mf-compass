/**
 * J-001 — Daily incremental sync.
 * Per PRODUCT.md §9.
 *
 * Steps:
 * 1. Refresh category_averages from Kuvera.
 * 2. For each fund in DB, refetch detail. Update volatile columns only.
 * 3. Recompute synthetic benchmarks.
 * 4. Recompute and renormalize all scores.
 * 5. Write in batched transactions of 25.
 *
 * Does NOT: discover new funds, delete missing funds, touch non-volatile columns.
 * Target runtime: under 90 seconds.
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import * as fs from "fs";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, sql } from "drizzle-orm";
import * as schema from "@drizzle/schema";
import { funds, categoryAverages } from "@drizzle/schema";
import type { NewCategoryAverage } from "@drizzle/schema";
import { fetchFundDetail, fetchCategoryAverages } from "@scripts/sync/kuvera/client";
import { cleanReturns } from "@scripts/sync/pipeline/transform";
import { computeRawScore, normalizeScores, computeSyntheticBenchmark } from "@/lib/scoring";
import { FUND_CATEGORIES, SYNTHETIC_BENCHMARK_CATEGORY } from "@/lib/kuvera/categories";
import { logger } from "@scripts/sync/shared/logger";

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 100;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}



async function main(): Promise<void> {
  const startTime = Date.now();

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const sqlClient = neon(dbUrl);
  const db = drizzle(sqlClient, { schema });

  const summary = {
    categoriesSynced: 0,
    fundsUpdated: 0,
    syntheticBenchmarksApplied: 0,
    errors: 0,
    durationMs: 0,
  };

  try {
    logger.info("Starting daily incremental sync");

    // Step 1: Refresh category averages
    const kuveraCategoryAverages = await fetchCategoryAverages();

    for (const cat of kuveraCategoryAverages) {
      const matchingCategory = FUND_CATEGORIES.find((c) => c === cat.category_name);
      if (!matchingCategory) continue;

      const row: NewCategoryAverage = {
        categoryName: cat.category_name,
        reportDate: cat.report_date ?? new Date().toISOString().split("T")[0],
        returns1w: cat.week_1?.toFixed(4) ?? null,
        returns1y: cat.year_1?.toFixed(4) ?? null,
        returns3y: cat.year_3?.toFixed(4) ?? null,
        returns5y: cat.year_5?.toFixed(4) ?? null,
        returnsInception: cat.inception?.toFixed(4) ?? null,
        isSynthetic: false,
        sourceCount: null,
      };

      await db
        .insert(categoryAverages)
        .values(row)
        .onConflictDoUpdate({
          target: categoryAverages.categoryName,
          set: {
            reportDate: row.reportDate,
            returns1w: row.returns1w,
            returns1y: row.returns1y,
            returns3y: row.returns3y,
            returns5y: row.returns5y,
            returnsInception: row.returnsInception,
            updatedAt: sql`NOW()`,
          },
        });

      summary.categoriesSynced++;
    }

    // Step 2: Refetch detail for each fund currently in DB — volatile columns only
    const existingFunds = await db
      .select({ kuveraCode: funds.kuveraCode })
      .from(funds);

    const codes = existingFunds.map((f) => f.kuveraCode);
    logger.info("Refreshing existing funds", { count: codes.length });

    const pendingUpdates: { code: string; data: any }[] = [];

    for (let i = 0; i < codes.length; i += BATCH_SIZE) {
      const batch = codes.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map((code) => fetchFundDetail(code))
      );

      for (const result of results) {
        if (result.status !== "fulfilled" || result.value === null) continue;

        const detail = result.value;
        const currentNav = detail.nav?.nav ?? null;
        const t1Nav = detail.last_nav?.nav ?? null;

        let returns1d: string | null = null;
        if (currentNav !== null && t1Nav !== null && t1Nav !== 0) {
          returns1d = (((currentNav - t1Nav) / t1Nav) * 100).toFixed(4);
        }

        const cleaned = cleanReturns(detail.returns);

        pendingUpdates.push({
          code: detail.code,
          data: {
            currentNav: currentNav?.toFixed(5) ?? null,
            currentNavDate: detail.nav?.date ?? null,
            t1Nav: t1Nav?.toFixed(5) ?? null,
            t1NavDate: detail.last_nav?.date ?? null,
            returns1d,
            returns1w: cleaned.returns1w,
            returns1y: cleaned.returns1y,
            returns3y: cleaned.returns3y,
            returns5y: cleaned.returns5y,
            returnsInception: cleaned.returnsInception,
            returnsDate: detail.returns?.date ?? null,
            aum: detail.aum !== null && detail.aum !== undefined
              ? (detail.aum / 10).toFixed(2)
              : null,
            expenseRatio: detail.expense_ratio?.toFixed(2) ?? null,
            expenseRatioDate: detail.expense_ratio_date ?? null,
            fundRating: detail.fund_rating ?? null,
            fundRatingDate: detail.fund_rating_date ?? null,
            crisilRating: detail.crisil_rating ?? null,
            volatility: detail.volatility?.toFixed(4) ?? null,
            portfolioTurnover: detail.portfolio_turnover?.toFixed(4) ?? null,
          }
        });
      }

      if (i + BATCH_SIZE < codes.length) {
        await delay(BATCH_DELAY_MS);
      }
    }

    // Now write the accumulated updates in transactions of 25
    logger.info("Flushing daily updates to DB in transactional batches of 25", { total: pendingUpdates.length });
    const BATCH_WRITE_SIZE = 25;
    for (let i = 0; i < pendingUpdates.length; i += BATCH_WRITE_SIZE) {
      const batch = pendingUpdates.slice(i, i + BATCH_WRITE_SIZE);
      try {
        const queries = batch.map((item) =>
          db
            .update(funds)
            .set({ ...item.data, lastUpdated: sql`NOW()` })
            .where(eq(funds.kuveraCode, item.code))
        );
        if (queries.length > 0) {
          await db.batch(queries as [any, ...any[]]);
          summary.fundsUpdated += batch.length;
        }
      } catch (err) {
        summary.errors += batch.length;
        logger.error("Batch update failed", {
          batchStart: i,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // Step 3: Recompute synthetic benchmarks
    const multiAssetFunds = await db
      .select()
      .from(funds)
      .where(eq(funds.fundCategory, SYNTHETIC_BENCHMARK_CATEGORY));

    if (multiAssetFunds.length > 0) {
      const fundReturns = multiAssetFunds.map((f) => {
        let r1w = f.returns1w ? parseFloat(f.returns1w) : null;
        let r1y = f.returns1y ? parseFloat(f.returns1y) : null;
        let r3y = f.returns3y ? parseFloat(f.returns3y) : null;
        let r5y = f.returns5y ? parseFloat(f.returns5y) : null;

        let hasNonZero = false;
        if (r5y === 0 && !hasNonZero) r5y = null; else if (r5y !== null && r5y !== 0) hasNonZero = true;
        if (r3y === 0 && !hasNonZero) r3y = null; else if (r3y !== null && r3y !== 0) hasNonZero = true;
        if (r1y === 0 && !hasNonZero) r1y = null; else if (r1y !== null && r1y !== 0) hasNonZero = true;
        if (r1w === 0 && !hasNonZero) r1w = null; else if (r1w !== null && r1w !== 0) hasNonZero = true;

        return {
          returns1w: r1w,
          returns1y: r1y,
          returns3y: r3y,
          returns5y: r5y,
        };
      });

      const synthetic = computeSyntheticBenchmark(fundReturns);

      await db
        .insert(categoryAverages)
        .values({
          categoryName: SYNTHETIC_BENCHMARK_CATEGORY,
          reportDate: new Date().toISOString().split("T")[0],
          returns1w: synthetic.returns1w?.toFixed(4) ?? null,
          returns1y: synthetic.returns1y?.toFixed(4) ?? null,
          returns3y: synthetic.returns3y?.toFixed(4) ?? null,
          returns5y: synthetic.returns5y?.toFixed(4) ?? null,
          returnsInception: null,
          isSynthetic: true,
          sourceCount: multiAssetFunds.length,
        })
        .onConflictDoUpdate({
          target: categoryAverages.categoryName,
          set: {
            returns1w: synthetic.returns1w?.toFixed(4) ?? null,
            returns1y: synthetic.returns1y?.toFixed(4) ?? null,
            returns3y: synthetic.returns3y?.toFixed(4) ?? null,
            returns5y: synthetic.returns5y?.toFixed(4) ?? null,
            isSynthetic: true,
            sourceCount: multiAssetFunds.length,
            updatedAt: sql`NOW()`,
          },
        });

      summary.syntheticBenchmarksApplied++;
    }

    // Step 4: Recompute and normalize scores per category
    const categoryAvgRows = await db.select().from(categoryAverages);
    const categoryAvgMap = new Map(categoryAvgRows.map((r) => [r.categoryName, r]));

    for (const category of FUND_CATEGORIES) {
      const catAvg = categoryAvgMap.get(category);
      if (!catAvg) continue;

      const categoryFunds = await db
        .select()
        .from(funds)
        .where(eq(funds.fundCategory, category));

      if (categoryFunds.length === 0) continue;

      const catReturns = {
        returns1w: catAvg.returns1w ? parseFloat(catAvg.returns1w) : null,
        returns1y: catAvg.returns1y ? parseFloat(catAvg.returns1y) : null,
        returns3y: catAvg.returns3y ? parseFloat(catAvg.returns3y) : null,
        returns5y: catAvg.returns5y ? parseFloat(catAvg.returns5y) : null,
      };

      const rawScores = categoryFunds.map((f) =>
        computeRawScore(
          {
            returns1w: f.returns1w ? parseFloat(f.returns1w) : null,
            returns1y: f.returns1y ? parseFloat(f.returns1y) : null,
            returns3y: f.returns3y ? parseFloat(f.returns3y) : null,
            returns5y: f.returns5y ? parseFloat(f.returns5y) : null,
          },
          catReturns
        )
      );

      const normalized = normalizeScores(rawScores);

      for (let k = 0; k < categoryFunds.length; k += BATCH_WRITE_SIZE) {
        const batch = categoryFunds.slice(k, k + BATCH_WRITE_SIZE);
        const batchNormalized = normalized.slice(k, k + BATCH_WRITE_SIZE);
        try {
          const queries = batch.map((fund, idx) =>
            db
              .update(funds)
              .set({
                totalScore: batchNormalized[idx].toFixed(2),
                scoreUpdated: sql`NOW()`,
              })
              .where(eq(funds.id, fund.id))
          );
          if (queries.length > 0) {
            await db.batch(queries as [any, ...any[]]);
          }
        } catch (err) {
          summary.errors += batch.length;
          logger.error("Batch score update failed", {
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }

    summary.durationMs = Date.now() - startTime;
    logger.info("Daily incremental sync complete", summary);
    fs.writeFileSync("summary.json", JSON.stringify(summary, null, 2));
  } catch (err) {
    summary.durationMs = Date.now() - startTime;
    summary.errors++;
    logger.error("Daily incremental sync failed", {
      ...summary,
      error: err instanceof Error ? err.message : String(err),
    });
    fs.writeFileSync("summary.json", JSON.stringify({ ...summary, error: err instanceof Error ? err.message : String(err) }, null, 2));
    process.exit(1);
  }
}

main();
