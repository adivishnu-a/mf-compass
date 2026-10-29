/* eslint-disable @typescript-eslint/no-explicit-any -- research script reads loosely-typed SQL rows */
// Research: check the stored NAV history against the research cache (row counts, joins, last values).
import * as dotenv from "dotenv";
dotenv.config({
  path: ".env.local",
  quiet: true,
} as dotenv.DotenvConfigOptions);
import * as fs from "fs";
import { neon } from "@neondatabase/serverless";

(async () => {
  const sql = neon(process.env.DATABASE_URL!);
  console.log(
    await sql`select count(*)::int rows, count(distinct fund_id)::int funds, min(nav_date)::text first, max(nav_date)::text last, pg_size_pretty(pg_total_relation_size('nav_history')) size from nav_history`,
  );
  const joined =
    (await sql`select f.kuvera_code, f.short_name, s.predecessor_amfi_code from fund_sources s join funds f on f.id = s.fund_id where s.predecessor_amfi_code is not null`) as any[];
  const research = JSON.parse(fs.readFileSync(".cache/lineage.json", "utf8"));
  const db = new Map(joined.map((r) => [r.kuvera_code, r]));
  for (const [code, l] of Object.entries<any>(research)) {
    const r = db.get(code);
    console.log(
      r
        ? r.predecessor_amfi_code === l.predecessor
          ? "same   "
          : "DIFFERS"
        : "MISSING",
      code,
      l.predecessorName,
      r ? "" : "",
    );
  }
  for (const r of joined)
    if (!research[r.kuvera_code])
      console.log("EXTRA  ", r.short_name, r.predecessor_amfi_code);
  console.log(
    await sql`select f.short_name, s.amfi_code, count(n.*)::int n from fund_sources s join funds f on f.id = s.fund_id left join nav_history n on n.fund_id = f.id where s.amfi_code = '119654' group by 1,2`,
  );
  console.log(
    "funds with < 250 rows:",
    await sql`select f.short_name, count(n.*)::int n, f.start_date::text from funds f left join nav_history n on n.fund_id = f.id group by f.id order by n limit 5`,
  );
})();
