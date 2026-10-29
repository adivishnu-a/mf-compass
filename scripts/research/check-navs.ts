/* eslint-disable @typescript-eslint/no-explicit-any -- research scripts read loosely-typed JSON and SQL rows */
// Research: quality checks on the cached NAV histories before any metric is built on them.
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import * as fs from "fs";
import { neon } from "@neondatabase/serverless";

const parseDate = (d: string) => {
  const [dd, mm, yy] = d.split("-").map(Number);
  return Date.UTC(yy, mm - 1, dd);
};

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = new Map(
    (
      (await sql`select kuvera_code, short_name, start_date::text sd, current_nav, current_nav_date::text cd from funds`) as any[]
    ).map((r) => [r.kuvera_code, r]),
  );
  const issues: Record<string, string[]> = {};
  const add = (k: string, m: string) => (issues[k] ??= []).push(m);
  let spikes = 0;
  for (const file of fs.readdirSync(".cache/navs")) {
    const j = JSON.parse(fs.readFileSync(`.cache/navs/${file}`, "utf8"));
    const f = db.get(j.kuveraCode);
    const name = f.short_name;
    if (j.metaIsin && j.metaIsin !== j.isin)
      add(name, `ISIN mismatch ${j.metaIsin} vs ${j.isin}`);
    const pts = (j.data as { date: string; nav: string }[]).map((p) => ({
      t: parseDate(p.date),
      v: Number(p.nav),
      raw: p,
    }));
    const bad = pts.filter(
      (p) => !Number.isFinite(p.t) || !Number.isFinite(p.v) || p.v <= 0,
    );
    if (bad.length)
      add(name, `${bad.length} bad points e.g. ${JSON.stringify(bad[0].raw)}`);
    const good = pts
      .filter((p) => Number.isFinite(p.t) && p.v > 0)
      .sort((a, b) => a.t - b.t);
    const dupDates = good.length - new Set(good.map((p) => p.t)).size;
    if (dupDates) add(name, `${dupDates} duplicate dates`);
    for (let i = 1; i < good.length; i++) {
      const gapDays = (good[i].t - good[i - 1].t) / 864e5;
      if (gapDays > 20)
        add(
          name,
          `gap ${gapDays.toFixed(0)}d before ${new Date(good[i].t).toISOString().slice(0, 10)}`,
        );
      const r = good[i].v / good[i - 1].v - 1;
      // a one-day move over 15% that reverses next day is a data error, not a market move
      if (Math.abs(r) > 0.15 && i + 1 < good.length) {
        const back = good[i + 1].v / good[i].v - 1;
        if (Math.sign(back) !== Math.sign(r) && Math.abs(back) > 0.1) {
          spikes++;
          add(
            name,
            `spike ${(r * 100).toFixed(1)}% then ${(back * 100).toFixed(1)}% on ${new Date(good[i].t).toISOString().slice(0, 10)}`,
          );
        }
      }
    }
    const last = good[good.length - 1];
    const navDiff = Math.abs(last.v / Number(f.current_nav) - 1);
    const lastDate = new Date(last.t).toISOString().slice(0, 10);
    if (lastDate < f.cd || (navDiff > 0.002 && lastDate === f.cd))
      add(name, `latest ${lastDate} ${last.v} vs db ${f.cd} ${f.current_nav}`);
    const first = new Date(good[0].t).toISOString().slice(0, 10);
    if (Math.abs(good[0].t - Date.parse(f.sd)) / 864e5 > 45)
      add(name, `history starts ${first}, db start_date ${f.sd}`);
  }
  const keys = Object.keys(issues);
  console.log(`funds with issues: ${keys.length}, reverting spikes: ${spikes}`);
  for (const k of keys)
    console.log(
      " -",
      k,
      "|",
      issues[k].slice(0, 4).join("; "),
      issues[k].length > 4 ? `(+${issues[k].length - 4})` : "",
    );
}
main();
