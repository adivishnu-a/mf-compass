/* eslint-disable @typescript-eslint/no-explicit-any -- research script reads loosely-typed SQL rows */
// Research: the stored Compass Scores (computed from nav_history) must equal the research run on the cache.
import * as dotenv from "dotenv";
dotenv.config({
  path: ".env.local",
  quiet: true,
} as dotenv.DotenvConfigOptions);
import { neon } from "@neondatabase/serverless";
import { categoryIndex } from "@/lib/metrics/series";
import { fundMetrics, compassScores } from "@/lib/metrics/compass";
import { load } from "./load";

(async () => {
  const sql = neon(process.env.DATABASE_URL!);
  const stored = new Map(
    (
      (await sql`select f.kuvera_code, m.score, m.rated, m.as_of::text from fund_metrics m join funds f on f.id = m.fund_id`) as any[]
    ).map((r) => [r.kuvera_code, r]),
  );
  const { rows, series } = await load();
  let same = 0,
    diff = 0,
    asOf = "";
  for (const cat of [...new Set(rows.map((r) => r.fund_category))]) {
    const members = rows.filter((r) => r.fund_category === cat);
    const inputs = members.map((r) => ({
      code: r.kuvera_code,
      series: series.get(r.kuvera_code)!,
      expenseRatio: r.expense_ratio === null ? null : Number(r.expense_ratio),
    }));
    const index = categoryIndex(inputs.map((i) => i.series));
    const t = Date.parse(
      stored.get(members[0].kuvera_code).as_of + "T00:00:00Z",
    );
    asOf = stored.get(members[0].kuvera_code).as_of;
    const sc = compassScores(inputs.map((f) => fundMetrics(f, index, t)));
    sc.forEach((s, i) => {
      const db = stored.get(members[i].kuvera_code).score;
      const a = s.score === null ? null : s.score.toFixed(1);
      if (a === db) same++;
      else {
        diff++;
        console.log("diff", members[i].short_name, "research", a, "db", db);
      }
    });
  }
  console.log({ asOf, same, diff });
  console.log(
    await sql`select count(*) filter (where rated)::int rated, count(*) filter (where not rated)::int unrated from fund_metrics`,
  );
  console.log(
    await sql`select category, count(*)::int points, min(point_date)::text from category_index group by 1 order by 1`,
  );
})();
