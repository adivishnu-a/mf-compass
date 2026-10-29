/* eslint-disable @typescript-eslint/no-explicit-any -- research scripts read loosely-typed JSON and SQL rows */
// Research: find pre-merger predecessors for funds whose AMFI history starts after their real launch, and
// accept a stitch only if (1) the predecessor's last NAV continues into the fund's first NAV and (2) the
// stitched series reproduces Kuvera's own 3Y and 5Y returns within 1 percentage point.
// Writes .cache/lineage.json. Read-only against the database.
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import * as fs from "fs";
import { neon } from "@neondatabase/serverless";
import {
  cleanSeries,
  valueAt,
  cagr,
  minusYears,
  DAY_MS,
  type Point,
} from "@/lib/metrics/series";

const STOP = new Set([
  "fund",
  "direct",
  "plan",
  "growth",
  "option",
  "the",
  "india",
  "-",
  "&",
  "and",
  "of",
  "mf",
  "mutual",
  "regular",
]);
// "mid cap", "mid-cap" and "midcap" are the same word for matching
const words = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9& ]/g, " ")
    .replace(/\b(mid|small|large|multi|flexi|blue)\s+(cap|chip)\b/g, "$1$2")
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w));
// Fund houses that took over other AMCs' schemes; predecessors carry the old brand in their name.
const FAMILY: Record<string, string[]> = {
  hsbc: ["l&t", "hsbc"],
  lic: ["idbi", "lic"],
  sundaram: ["principal", "sundaram"],
  baroda: ["bnp", "baroda"],
  edelweiss: ["jpmorgan", "jp morgan", "edelweiss"],
  pgim: ["pramerica", "dhfl", "pgim"],
  hdfc: ["hdfc"],
  sbi: ["sbi"],
  absl: ["birla", "aditya"],
};

async function fetchSeries(code: string): Promise<Point[] | null> {
  const file = `.cache/navs-pred/${code}.json`;
  if (!fs.existsSync(file)) {
    for (let i = 0; i < 3; i++) {
      try {
        const r = await fetch(`https://api.mfapi.in/mf/${code}`, {
          signal: AbortSignal.timeout(30_000),
        });
        if (r.ok) {
          fs.writeFileSync(file, JSON.stringify(await r.json()));
          break;
        }
      } catch {}
      await new Promise((res) => setTimeout(res, 1500));
    }
  }
  if (!fs.existsSync(file)) return null;
  return cleanSeries(JSON.parse(fs.readFileSync(file, "utf8")).data ?? [])
    .series;
}

async function main() {
  fs.mkdirSync(".cache/navs-pred", { recursive: true });
  const sql = neon(process.env.DATABASE_URL!);
  const rows =
    (await sql`select kuvera_code, short_name, scheme_name, fund_category, start_date::text sd, returns_3y, returns_5y, returns_inception, returns_date::text rd from funds`) as any[];
  const list = JSON.parse(fs.readFileSync(".cache/mf-list.json", "utf8")) as {
    schemeCode: number;
    schemeName: string;
  }[];
  const candidatesPool = list.filter(
    (x) =>
      /direct/i.test(x.schemeName) &&
      /growth/i.test(x.schemeName) &&
      !/idcw|dividend|bonus|nifty|index|etf|sensex/i.test(x.schemeName),
  );
  const lineage: Record<string, unknown> = {};
  const report: string[] = [];

  for (const r of rows) {
    const own = JSON.parse(
      fs.readFileSync(`.cache/navs/${r.kuvera_code}.json`, "utf8"),
    );
    const s = cleanSeries(own.data).series;
    const gapDays = (s[0].t - Date.parse(r.sd)) / DAY_MS;
    if (gapDays <= 45) continue;
    // candidates: share the fund's distinctive words (minus the brand), best overlap first
    const target = words(r.scheme_name).slice(1);
    const brands = FAMILY[r.short_name.split(" ")[0].toLowerCase()] ?? [];
    const scored = candidatesPool
      .filter((c) => String(c.schemeCode) !== own.schemeCode)
      .map((c) => {
        const name = c.schemeName.toLowerCase();
        const overlap =
          target.filter((w) => words(c.schemeName).includes(w)).length /
          Math.max(target.length, 1);
        // same family of brands: any predecessor brand is a candidate; continuity and Kuvera decide
        const family = brands.some(
          (b) => name.startsWith(b) || name.includes(" " + b),
        );
        return { c, overlap, family };
      })
      .filter((x) => x.overlap >= 0.5 || x.family)
      .sort(
        (a, b) => Number(b.family) - Number(a.family) || b.overlap - a.overlap,
      )
      .slice(0, 80);
    let accepted: string | null = null;
    const tried: string[] = [];
    for (const { c } of scored) {
      const p = await fetchSeries(String(c.schemeCode));
      if (!p || p.length < 30) continue;
      const lastP = p[p.length - 1];
      // the predecessor must end within 10 days before (or on) the fund's first price
      if (lastP.t > s[0].t || s[0].t - lastP.t > 10 * DAY_MS) continue;
      const cont = s[0].v / lastP.v - 1;
      tried.push(
        `${c.schemeName.slice(0, 50)} cont ${(cont * 100).toFixed(2)}%`,
      );
      if (Math.abs(cont) > 0.02) continue;
      // stitch: predecessor scaled onto the fund's level, then the fund
      const scale = s[0].v / lastP.v;
      const stitched = [
        ...p
          .filter((x) => x.t < s[0].t)
          .map((x) => ({ t: x.t, v: x.v * scale })),
        ...s,
      ];
      const asOf = Date.parse(r.rd);
      const check = (years: number, kuvera: string | null) => {
        if (kuvera === null || Number(kuvera) === 0) return "n/a";
        const a = valueAt(stitched, minusYears(asOf, years)),
          b = valueAt(stitched, asOf);
        if (a === null || b === null) return "missing";
        const mine = cagr(a, b, (asOf - minusYears(asOf, years)) / DAY_MS)!;
        return Math.abs(mine - Number(kuvera)) <= 1
          ? "ok"
          : `off ${mine.toFixed(2)} vs ${Number(kuvera).toFixed(2)}`;
      };
      const c3 = check(3, r.returns_3y),
        c5 = check(5, r.returns_5y);
      // The decisive check covers the joined part: the predecessor must begin near the fund's real launch,
      // and the joined series must reproduce Kuvera's since-launch return. 3Y/5Y must not contradict it.
      const launch = Date.parse(r.sd);
      const startsAtLaunch = Math.abs(stitched[0].t - launch) <= 60 * DAY_MS;
      let inception = "missing";
      if (startsAtLaunch && r.returns_inception !== null) {
        const a = stitched[0].v,
          b = valueAt(stitched, asOf);
        if (b !== null) {
          const mine = cagr(a, b, (asOf - stitched[0].t) / DAY_MS)!;
          inception =
            Math.abs(mine - Number(r.returns_inception)) <= 0.75
              ? "ok"
              : `off ${mine.toFixed(2)} vs ${Number(r.returns_inception).toFixed(2)}`;
        }
      }
      tried.push(
        `  starts ${new Date(stitched[0].t).toISOString().slice(0, 10)}, inception ${inception}, 3Y ${c3}, 5Y ${c5}`,
      );
      if (
        inception === "ok" &&
        !c3.startsWith("off") &&
        !c5.startsWith("off")
      ) {
        accepted = String(c.schemeCode);
        lineage[r.kuvera_code] = {
          predecessor: accepted,
          predecessorName: c.schemeName,
          scale,
          joinedAt: new Date(s[0].t).toISOString().slice(0, 10),
          check3y: c3,
          check5y: c5,
          checkInception: inception,
        };
        break;
      }
    }
    report.push(
      `${r.short_name.padEnd(36)} history starts ${new Date(s[0].t).toISOString().slice(0, 10)} (launch ${r.sd}) -> ${accepted ? "STITCHED with " + (lineage[r.kuvera_code] as any).predecessorName : "not stitched"}${
        "\n      " +
        tried
          .filter(
            (x) =>
              !x.includes(" cont ") ||
              Math.abs(parseFloat(x.split(" cont ")[1])) <= 2,
          )
          .slice(0, 6)
          .join("\n      ")
      }`,
    );
  }
  fs.writeFileSync(".cache/lineage.json", JSON.stringify(lineage, null, 2));
  console.log(report.join("\n"));
}
main();
