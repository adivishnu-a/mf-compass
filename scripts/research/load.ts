// Research helper: funds from the DB plus cleaned NAV series from .cache, with verified pre-merger lineage
// (scripts/research/stitch.ts) joined on. Read-only.
import * as dotenv from "dotenv";
dotenv.config({
  path: ".env.local",
  quiet: true,
} as dotenv.DotenvConfigOptions);
import * as fs from "fs";
import { neon } from "@neondatabase/serverless";
import { cleanSeries, type Point } from "@/lib/metrics/series";

export type FundRow = {
  kuvera_code: string;
  short_name: string;
  fund_category: string;
  expense_ratio: string | null;
  aum: string;
};

export async function load() {
  const sql = neon(process.env.DATABASE_URL!);
  const rows =
    (await sql`select kuvera_code, short_name, fund_category, expense_ratio, aum from funds`) as FundRow[];
  const lineage = fs.existsSync(".cache/lineage.json")
    ? JSON.parse(fs.readFileSync(".cache/lineage.json", "utf8"))
    : {};
  const series = new Map<string, Point[]>();
  for (const r of rows) {
    let s = cleanSeries(
      JSON.parse(fs.readFileSync(`.cache/navs/${r.kuvera_code}.json`, "utf8"))
        .data,
    ).series;
    const l = lineage[r.kuvera_code];
    if (l) {
      const pred = cleanSeries(
        JSON.parse(
          fs.readFileSync(`.cache/navs-pred/${l.predecessor}.json`, "utf8"),
        ).data,
      ).series;
      s = [
        ...pred
          .filter((p) => p.t < s[0].t)
          .map((p) => ({ t: p.t, v: p.v * l.scale })),
        ...s,
      ];
    }
    series.set(r.kuvera_code, s);
  }
  return { rows, series, lineage };
}
