/**
 * NAV history and Compass Score jobs, one at a time or together (see scripts/sync/nav/jobs.ts).
 *   npm run sync:navs -- backfill | daily | reconcile | compute
 * daily.ts and weekly.ts call the same functions; this is for first setup and manual runs.
 */
import * as dotenv from "dotenv";
dotenv.config({
  path: ".env.local",
  quiet: true,
} as dotenv.DotenvConfigOptions);
dotenv.config({ quiet: true } as dotenv.DotenvConfigOptions);
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@drizzle/schema";
import { logger } from "@scripts/sync/shared/logger";
import {
  appendDailyNavs,
  backfillNavs,
  computeScores,
  reconcileNavs,
} from "./nav/jobs";

async function main() {
  const job = process.argv[2];
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL environment variable is not set");
  const db = drizzle(neon(dbUrl), { schema });
  const started = Date.now();
  if (job === "backfill") await backfillNavs(db);
  else if (job === "daily") await appendDailyNavs(db);
  else if (job === "reconcile") await reconcileNavs(db);
  else if (job === "compute") await computeScores(db);
  else
    throw new Error(
      "Usage: sync:navs -- backfill | daily | reconcile | compute",
    );
  logger.info("Done", {
    job,
    seconds: Math.round((Date.now() - started) / 1000),
  });
}

main().catch((err) => {
  logger.error("NAV job failed", {
    error: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});
