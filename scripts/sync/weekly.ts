/**
 * J-002 — Weekly full rebuild.
 * Per PRODUCT.md §9.
 *
 * Steps:
 * 1. Discover eligible funds across all 9 categories (§7 Stage 1)
 * 2. Batch fetch details (§6)
 * 3. Apply Stage 2 filters (§7 Stage 2)
 * 4. Upsert all surviving funds
 * 5. Hard-delete funds absent from this run
 * 6. NAV history (backfill new funds, heal the last 120 days), then Compass Scores
 *
 * Target runtime: under 3 minutes.
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import * as fs from "fs";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, notInArray, sql } from "drizzle-orm";
import * as schema from "@drizzle/schema";
import { funds } from "@drizzle/schema";
import {
  fetchFundList,
  fetchFundDetailsBatched,
} from "@scripts/sync/kuvera/client";
import { discoverAllFunds } from "@scripts/sync/pipeline/discovery";
import { filterFunds } from "@scripts/sync/pipeline/filter";
import { transformFundDetail } from "@scripts/sync/pipeline/transform";
import { logger } from "@scripts/sync/shared/logger";
import {
  backfillNavs,
  reconcileNavs,
  computeScores,
} from "@scripts/sync/nav/jobs";

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
    fundsUpdated: 0,
    fundsInserted: 0,
    fundsDeleted: 0,
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
    logger.info("Total eligible codes after discovery", {
      count: allEligibleCodes.length,
    });

    // Step 3: Batch fetch details
    const fundDetails = await fetchFundDetailsBatched(allEligibleCodes);
    logger.info("Fund details fetched", { count: fundDetails.length });

    // Step 4: Apply Stage 2 filters
    const { passed: filteredFunds } = filterFunds(fundDetails);

    // Step 5: Transform and upsert funds in transactional batches of 25
    const transformedFunds = filteredFunds.map(transformFundDetail);
    const allUpsertedCodes: string[] = [];

    for (let i = 0; i < transformedFunds.length; i += BATCH_WRITE_SIZE) {
      const batch = transformedFunds.slice(i, i + BATCH_WRITE_SIZE);

      try {
        const selectQueries = batch.map((fund) =>
          db
            .select({ id: funds.id })
            .from(funds)
            .where(eq(funds.kuveraCode, fund.kuveraCode))
            .limit(1),
        );

        const selectResults = (await db.batch(
          selectQueries as unknown as [never, ...never[]],
        )) as unknown as { id: number }[][];

        const writeQueries = batch.map((fund, idx) => {
          const existing = selectResults[idx];
          if (existing && existing.length > 0) {
            summary.fundsUpdated++;
            return db
              .update(funds)
              .set({ ...fund, lastUpdated: sql`NOW()` })
              .where(eq(funds.kuveraCode, fund.kuveraCode));
          } else {
            summary.fundsInserted++;
            return db.insert(funds).values(fund);
          }
        });

        if (writeQueries.length > 0) {
          await db.batch(writeQueries as unknown as [never, ...never[]]);
        }

        for (const fund of batch) {
          allUpsertedCodes.push(fund.kuveraCode);
        }
      } catch (err) {
        summary.errors += batch.length;
        logger.error("Batch upsert failed", {
          batchStart: i,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // Step 6: Hard-delete absent funds
    if (allUpsertedCodes.length > 0 && summary.errors === 0) {
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

    // Step 7: NAV history (backfill new funds, heal the last 120 days), then Compass Scores (docs/SCORE.md).
    try {
      await backfillNavs(db);
      await reconcileNavs(db);
      await computeScores(db);
    } catch (err) {
      summary.errors++;
      process.exitCode = 1; // the run shows as failed in Actions; the data written above stays
      logger.error("NAV history or scoring failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    summary.durationMs = Date.now() - startTime;
    logger.info("Weekly full rebuild complete", summary);
    fs.writeFileSync("summary.json", JSON.stringify(summary, null, 2));
  } catch (err) {
    summary.durationMs = Date.now() - startTime;
    summary.errors++;
    logger.error("Weekly full rebuild failed", {
      ...summary,
      error: err instanceof Error ? err.message : String(err),
    });
    fs.writeFileSync(
      "summary.json",
      JSON.stringify(
        { ...summary, error: err instanceof Error ? err.message : String(err) },
        null,
        2,
      ),
    );
    process.exit(1);
  }
}

main();
