/**
 * DB & API connection test utility.
 * Part of J-003 Manual Operations.
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import * as schema from "@drizzle/schema";
import { funds, navHistory } from "@drizzle/schema";
import { fetchFundDetail } from "@scripts/sync/kuvera/client";
import { logger } from "@scripts/sync/shared/logger";

async function main(): Promise<void> {
  logger.info("🔧 Starting MF Compass connection test and health check");

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    logger.error("DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  try {
    // 1. Database Connection check
    logger.info("Connecting to Database...");
    const sqlClient = neon(dbUrl);
    const db = drizzle(sqlClient, { schema });

    // Test simple ping query
    const dbPing = await db.execute(sql`SELECT NOW() as now`);
    logger.info("✅ Database connection successful", {
      time: JSON.stringify(dbPing),
    });

    // Count rows in funds
    const fundsCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(funds);
    const fundsCount = Number(fundsCountResult[0]?.count ?? 0);

    // Count stored NAVs
    const navCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(navHistory);
    const navCount = Number(navCountResult[0]?.count ?? 0);

    logger.info("✅ Database schemas and row counts audited", {
      fundsCount,
      navCount,
    });

    // 2. Kuvera API connectivity check: one fund we already track
    const [sample] = await db
      .select({ code: funds.kuveraCode })
      .from(funds)
      .limit(1);
    if (sample) {
      logger.info("Pinging Kuvera API (one fund)...", { code: sample.code });
      const detail = await fetchFundDetail(sample.code);
      if (!detail)
        throw new Error(`Kuvera returned nothing for ${sample.code}`);
      logger.info("✅ Kuvera API is reachable", { fund: detail.name });
    }

    logger.info("✅ All systems healthy. MF Compass is ready.");
    process.exit(0);
  } catch (error) {
    logger.error("❌ Health check failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

main();
