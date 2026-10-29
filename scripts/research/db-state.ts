// Research: read-only database state (size, tables, applied migrations).
import * as dotenv from "dotenv";
dotenv.config({
  path: ".env.local",
  quiet: true,
} as dotenv.DotenvConfigOptions);
import { neon } from "@neondatabase/serverless";

(async () => {
  const sql = neon(process.env.DATABASE_URL!);
  console.log(
    await sql`select pg_size_pretty(pg_database_size(current_database())) size, current_setting('server_version') v`,
  );
  console.log(
    await sql`select table_schema, table_name from information_schema.tables where table_schema not in ('pg_catalog','information_schema') order by 1,2`,
  );
  try {
    console.log(
      await sql`select id, hash, created_at from drizzle.__drizzle_migrations`,
    );
  } catch (e) {
    console.log("no drizzle migrations table:", (e as Error).message);
  }
})();
