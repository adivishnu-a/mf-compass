/**
 * J-002 — Weekly full rebuild.
 * Per PRODUCT.md §9.
 *
 * Steps:
 * 1. Discover eligible funds across all 9 categories (§7 Stage 1)
 * 2. Batch fetch details (§6)
 * 3. Apply Stage 2 filters (§7 Stage 2)
 * 4. Refresh category averages from Kuvera
 * 5. Compute synthetic benchmarks where needed
 * 6. Upsert all surviving funds
 * 7. Hard-delete funds absent from this run
 * 8. Recompute + normalize scores
 *
 * Target runtime: under 3 minutes.
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, notInArray, sql } from "drizzle-orm";
import * as schema from "@drizzle/schema";
import { funds, categoryAverages } from "@drizzle/schema";
import type { NewFund, NewCategoryAverage } from "@drizzle/schema";
import { fetchFundList, fetchFundDetailsBatched, fetchCategoryAverages } from "@scripts/sync/kuvera/client";
import type { FundDetail } from "@scripts/sync/kuvera/schemas";
import { discoverAllFunds } from "@scripts/sync/pipeline/discovery";
import { filterFunds } from "@scripts/sync/pipeline/filter";
import { transformFundDetail, cleanReturns } from "@scripts/sync/pipeline/transform";
import { computeRawScore, normalizeScores, computeSyntheticBenchmark } from "@/lib/scoring";
import { FUND_CATEGORIES, SYNTHETIC_BENCHMARK_CATEGORY } from "@/lib/kuvera/categories";
import { logger } from "@scripts/sync/shared/logger";

const BATCH_WRITE_SIZE = 25;

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
    fundsInserted: 0,
    fundsDeleted: 0,
    syntheticBenchmarksApplied: 0,
    errors: 0,
    durationMs: 0,
  };

  try {
    // Step 1: Fetch fund universe
    logger.info("Starting weekly full rebuild");
    const allFunds = await fetchFundList();

    // Step 2: Discover eligible fund codes per category
    const categoryCodeMap = discoverAllFunds(allFunds);

    // Flatten all eligible codes
    const allEligibleCodes: string[] = [];
    for (const codes of categoryCodeMap.values()) {
      allEligibleCodes.push(...codes);
    }
    logger.info("Total eligible codes after discovery", { count: allEligibleCodes.length });

    // Step 3: Batch fetch details
    const fundDetails = await fetchFundDetailsBatched(allEligibleCodes);
    logger.info("Fund details fetched", { count: fundDetails.length });

    // Step 4: Apply Stage 2 filters
    const { passed: filteredFunds } = filterFunds(fundDetails);

    // Step 5: Refresh category averages from Kuvera
    const kuveraCategoryAverages = await fetchCategoryAverages();

    // Upsert category averages
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
            isSynthetic: false,
            sourceCount: null,
            updatedAt: sql`NOW()`,
          },
        });

      summary.categoriesSynced++;
    }

    // Step 6: Compute synthetic benchmark for Multi Asset Allocation
    const multiAssetFunds: FundDetail[] = filteredFunds.filter(
      (f: FundDetail) => f.fund_category === SYNTHETIC_BENCHMARK_CATEGORY
    );

    if (multiAssetFunds.length > 0) {
      const fundReturns = multiAssetFunds.map((f: FundDetail) => {
        const cleaned = cleanReturns(f.returns);
        return {
          returns1w: cleaned.returns1w ? parseFloat(cleaned.returns1w) : null,
          returns1y: cleaned.returns1y ? parseFloat(cleaned.returns1y) : null,
          returns3y: cleaned.returns3y ? parseFloat(cleaned.returns3y) : null,
          returns5y: cleaned.returns5y ? parseFloat(cleaned.returns5y) : null,
        };
      });

      const synthetic = computeSyntheticBenchmark(fundReturns);

      const maxReturnsDate = multiAssetFunds
        .map((f: FundDetail) => f.returns?.date)
        .filter((d): d is string => d !== null && d !== undefined)
        .sort()
        .pop();

      const syntheticRow: NewCategoryAverage = {
        categoryName: SYNTHETIC_BENCHMARK_CATEGORY,
        reportDate: maxReturnsDate ?? new Date().toISOString().split("T")[0],
        returns1w: synthetic.returns1w?.toFixed(4) ?? null,
        returns1y: synthetic.returns1y?.toFixed(4) ?? null,
        returns3y: synthetic.returns3y?.toFixed(4) ?? null,
        returns5y: synthetic.returns5y?.toFixed(4) ?? null,
        returnsInception: null,
        isSynthetic: true,
        sourceCount: multiAssetFunds.length,
      };

      await db
        .insert(categoryAverages)
        .values(syntheticRow)
        .onConflictDoUpdate({
          target: categoryAverages.categoryName,
          set: {
            reportDate: syntheticRow.reportDate,
            returns1w: syntheticRow.returns1w,
            returns1y: syntheticRow.returns1y,
            returns3y: syntheticRow.returns3y,
            returns5y: syntheticRow.returns5y,
            returnsInception: syntheticRow.returnsInception,
            isSynthetic: true,
            sourceCount: multiAssetFunds.length,
            updatedAt: sql`NOW()`,
          },
        });

      summary.syntheticBenchmarksApplied++;

      if (multiAssetFunds.length < 5) {
        logger.warn("Synthetic benchmark source count below threshold, falling back to absolute returns", {
          category: SYNTHETIC_BENCHMARK_CATEGORY,
          sourceCount: multiAssetFunds.length,
        });
      }
    }

    // Step 7: Transform and upsert funds in batches
    const transformedFunds = filteredFunds.map(transformFundDetail);
    const allUpsertedCodes: string[] = [];

    for (let i = 0; i < transformedFunds.length; i += BATCH_WRITE_SIZE) {
      const batch = transformedFunds.slice(i, i + BATCH_WRITE_SIZE);

      for (const fund of batch) {
        try {
          const existing = await db
            .select({ id: funds.id })
            .from(funds)
            .where(eq(funds.kuveraCode, fund.kuveraCode))
            .limit(1);

          if (existing.length > 0) {
            await db
              .update(funds)
              .set({ ...fund, lastUpdated: sql`NOW()` })
              .where(eq(funds.kuveraCode, fund.kuveraCode));
            summary.fundsUpdated++;
          } else {
            await db.insert(funds).values(fund);
            summary.fundsInserted++;
          }

          allUpsertedCodes.push(fund.kuveraCode);
        } catch (err) {
          summary.errors++;
          logger.error("Fund upsert failed", {
            code: fund.kuveraCode,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }

    // Step 8: Hard-delete absent funds
    if (allUpsertedCodes.length > 0) {
      const deleted = await db
        .delete(funds)
        .where(notInArray(funds.kuveraCode, allUpsertedCodes))
        .returning({ kuveraCode: funds.kuveraCode });

      summary.fundsDeleted = deleted.length;
      if (deleted.length > 0) {
        logger.info("Deleted absent funds", {
          count: deleted.length,
          codes: deleted.map((d) => d.kuveraCode),
        });
      }
    }

    // Step 9: Recompute and normalize scores per category
    const categoryAvgRows = await db.select().from(categoryAverages);
    const categoryAvgMap = new Map(categoryAvgRows.map((r) => [r.categoryName, r]));

    for (const category of FUND_CATEGORIES) {
      const catAvg = categoryAvgMap.get(category);
      if (!catAvg) {
        logger.warn("No category average found, skipping scoring", { category });
        continue;
      }

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

      for (let i = 0; i < categoryFunds.length; i++) {
        await db
          .update(funds)
          .set({
            totalScore: normalized[i].toFixed(2),
            scoreUpdated: sql`NOW()`,
          })
          .where(eq(funds.id, categoryFunds[i].id));
      }

      logger.info("Scores computed", {
        category,
        funds: categoryFunds.length,
        scoreRange: {
          min: Math.min(...normalized),
          max: Math.max(...normalized),
        },
      });
    }

    summary.durationMs = Date.now() - startTime;
    logger.info("Weekly full rebuild complete", summary);
  } catch (err) {
    summary.durationMs = Date.now() - startTime;
    summary.errors++;
    logger.error("Weekly full rebuild failed", {
      ...summary,
      error: err instanceof Error ? err.message : String(err),
    });
    process.exit(1);
  }
}

main();
