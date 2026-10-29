/**
 * J-001 — Daily incremental sync.
 * Per PRODUCT.md §9.
 *
 * Steps:
 * 1. For each fund in DB, refetch detail. Update volatile columns only, in batched transactions of 25.
 * 2. Append today's NAVs from AMFI, then recompute Compass Scores from NAV history.
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
import { funds } from "@drizzle/schema";
import { fetchFundDetail } from "@scripts/sync/kuvera/client";
import {
  cleanReturns,
  maskUnearnedReturns,
} from "@scripts/sync/pipeline/transform";
import { logger } from "@scripts/sync/shared/logger";
import { appendDailyNavs, computeScores } from "@scripts/sync/nav/jobs";

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
    fundsUpdated: 0,
    errors: 0,
    durationMs: 0,
  };

  try {
    logger.info("Starting daily incremental sync");

    // Step 1: Refetch detail for each fund currently in DB — volatile columns only
    const existingFunds = await db
      .select({ kuveraCode: funds.kuveraCode })
      .from(funds);

    const codes = existingFunds.map((f) => f.kuveraCode);
    logger.info("Refreshing existing funds", { count: codes.length });

    const pendingUpdates: { code: string; data: Record<string, unknown> }[] =
      [];

    for (let i = 0; i < codes.length; i += BATCH_SIZE) {
      const batch = codes.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map((code) => fetchFundDetail(code)),
      );

      for (const result of results) {
        if (result.status !== "fulfilled" || result.value === null) continue;

        const detail = result.value;

        const cleaned = maskUnearnedReturns(
          cleanReturns(detail.returns),
          detail.start_date,
          detail.returns?.date ?? detail.nav?.date,
        );

        pendingUpdates.push({
          code: detail.code,
          data: {
            currentNav: detail.nav?.nav?.toFixed(5) ?? null,
            currentNavDate: detail.nav?.date ?? null,
            returns3y: cleaned.returns3y,
            returns5y: cleaned.returns5y,
            returnsInception: cleaned.returnsInception,
            returnsDate: detail.returns?.date ?? null,
            aum:
              detail.aum !== null && detail.aum !== undefined
                ? (detail.aum / 10).toFixed(2)
                : null,
            expenseRatio: detail.expense_ratio?.toFixed(2) ?? null,
            crisilRating: detail.crisil_rating ?? null,
          },
        });
      }

      if (i + BATCH_SIZE < codes.length) {
        await delay(BATCH_DELAY_MS);
      }
    }

    // Now write the accumulated updates in transactions of 25
    logger.info("Flushing daily updates to DB in transactional batches of 25", {
      total: pendingUpdates.length,
    });
    const BATCH_WRITE_SIZE = 25;
    for (let i = 0; i < pendingUpdates.length; i += BATCH_WRITE_SIZE) {
      const batch = pendingUpdates.slice(i, i + BATCH_WRITE_SIZE);
      try {
        const queries = batch.map((item) =>
          db
            .update(funds)
            .set({ ...item.data, lastUpdated: sql`NOW()` })
            .where(eq(funds.kuveraCode, item.code)),
        );
        if (queries.length > 0) {
          await db.batch(queries as unknown as [never, ...never[]]);
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

    // Step 2: Append today's NAVs (one AMFI download, one upsert), then Compass Scores from NAV history.
    // A failure here marks the run failed but never undoes the Kuvera updates above.
    try {
      await appendDailyNavs(db);
      await computeScores(db);
    } catch (err) {
      summary.errors++;
      process.exitCode = 1; // the run shows as failed in Actions; the data written above stays
      logger.error("NAV append or scoring failed", {
        error: err instanceof Error ? err.message : String(err),
      });
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
