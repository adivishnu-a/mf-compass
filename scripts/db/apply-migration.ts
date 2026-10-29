/**
 * Apply one SQL migration file from drizzle/migrations in a single transaction.
 *
 * The production database was created with `drizzle-kit push`, so it has no drizzle migration history and
 * `drizzle-kit migrate` would try to re-run 0000 (creating `funds` again). This applies a later, additive
 * migration directly instead, guarded so it is safe to run twice:
 *   - every table the file creates already exists  -> nothing to do
 *   - some exist, some don't                        -> stop, a human looks (half-applied state)
 *   - none exist                                    -> run every statement in one transaction
 *
 * Usage: npx tsx scripts/db/apply-migration.ts drizzle/migrations/0001_nav_history_and_metrics.sql
 */
import * as dotenv from "dotenv";
dotenv.config({
  path: ".env.local",
  quiet: true,
} as dotenv.DotenvConfigOptions);
dotenv.config({ quiet: true } as dotenv.DotenvConfigOptions);
import * as fs from "fs";
import { neon } from "@neondatabase/serverless";

async function main() {
  const file = process.argv[2];
  if (!file || !fs.existsSync(file))
    throw new Error("Pass the migration file path");
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL environment variable is not set");
  const sql = neon(dbUrl);

  const text = fs.readFileSync(file, "utf8");
  const statements = text
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);
  const creates = [...text.matchAll(/CREATE TABLE "([a-z_]+)"/g)].map(
    (m) => m[1],
  );

  const existing = (await sql.query(
    `select table_name from information_schema.tables where table_schema = 'public' and table_name = any($1)`,
    [creates],
  )) as { table_name: string }[];
  const present = new Set(existing.map((r) => r.table_name));

  if (creates.length > 0 && creates.every((t) => present.has(t))) {
    console.log(`Already applied: ${creates.join(", ")} exist. Nothing to do.`);
    return;
  }
  if (present.size > 0) {
    throw new Error(
      `Half-applied: ${[...present].join(", ")} exist but ${creates.filter((t) => !present.has(t)).join(", ")} don't. Not touching it.`,
    );
  }

  await sql.transaction(statements.map((s) => sql.query(s)));
  console.log(
    `Applied ${statements.length} statements from ${file}: created ${creates.join(", ")}.`,
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
