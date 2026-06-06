/**
 * DB flush utility.
 * Part of J-003 Manual Operations.
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@drizzle/schema";
import { funds, categoryAverages } from "@drizzle/schema";
import { logger } from "@scripts/sync/shared/logger";

async function main(): Promise<void> {
  logger.info("⚠️ Starting MF Compass database flush operation");

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    logger.error("DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  // Verify confirmation
  const confirmation = process.env.CONFIRM_FLUSH;
  if (confirmation !== "FLUSH") {
    logger.error("Aborting flush: CONFIRM_FLUSH environment variable must be set to 'FLUSH' to run this operation");
    process.exit(1);
  }

  try {
    logger.info("Connecting to Database...");
    const sqlClient = neon(dbUrl);
    const db = drizzle(sqlClient, { schema });

    logger.info("Dropping all records from funds table...");
    await db.delete(funds);
    logger.info("✅ funds table flushed");

    logger.info("Dropping all records from category_averages table...");
    await db.delete(categoryAverages);
    logger.info("✅ category_averages table flushed");

    logger.info("✅ Database flush completed successfully.");
    process.exit(0);
  } catch (error) {
    logger.error("❌ Flush operation failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

main();
