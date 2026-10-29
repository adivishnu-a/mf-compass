// Research: compare score variants on the three criteria that matter for a track-record score.
//   agreement  average percentile of "good" funds minus that of "weak" funds (Adi's priors + analyst consensus)
//   stability  rank correlation of each fund's score now vs 3 and 6 months ago (good funds shouldn't flip)
//   predictive rank correlation with the next 2–3 years vs the category (reported, not decisive: ~noise)
// Run: npx tsx scripts/research/evaluate.ts
import {
  categoryIndex,
  valueAt,
  cagr,
  minusMonths,
  minusYears,
  DAY_MS,
  type Point,
} from "@/lib/metrics/series";
import {
  COMPASS,
  fundMetrics,
  compassScores,
  percentiles,
  type CompassConfig,
} from "@/lib/metrics/compass";
import { load } from "./load";

const GOOD: Record<string, string[]> = {
  "Mid Cap Fund": [
    "Whiteoak",
    "Edelweiss",
    "Invesco",
    "HDFC",
    "ICICI",
    "Nippon",
    "HSBC",
  ],
  "Small Cap Fund": [
    "Bandhan",
    "Invesco",
    "ITI",
    "Nippon",
    "ICICI",
    "HDFC",
    "HSBC",
  ],
  "Large Cap Fund": [
    "Nippon",
    "Invesco",
    "Whiteoak",
    "Bandhan",
    "Baroda",
    "ICICI",
  ],
  "Flexi Cap Fund": ["Parag", "HDFC", "ICICI", "Bank Of India", "ABSL", "JM"],
};
const BAD: Record<string, string[]> = {
  "Mid Cap Fund": ["Motilal"],
  "Small Cap Fund": ["Tata", "LIC"],
  "Large Cap Fund": ["Mirae", "Taurus"],
  "Flexi Cap Fund": ["Samco"],
};

function spearman(a: (number | null)[], b: (number | null)[]) {
  const pairs = a
    .map((x, i) => [x, b[i]])
    .filter(([x, y]) => x !== null && y !== null) as [number, number][];
  if (pairs.length < 4) return NaN;
  const ra = percentiles(
    pairs.map((p) => p[0]),
    true,
  ) as number[];
  const rb = percentiles(
    pairs.map((p) => p[1]),
    true,
  ) as number[];
  const n = pairs.length,
    ma = ra.reduce((s, x) => s + x, 0) / n,
    mb = rb.reduce((s, x) => s + x, 0) / n;
  let num = 0,
    da = 0,
    db = 0;
  for (let i = 0; i < n; i++) {
    num += (ra[i] - ma) * (rb[i] - mb);
    da += (ra[i] - ma) ** 2;
    db += (rb[i] - mb) ** 2;
  }
  return num / Math.sqrt(da * db);
}
const mean = (xs: number[]) =>
  xs.filter(Number.isFinite).reduce((s, x) => s + x, 0) /
  xs.filter(Number.isFinite).length;

type Scorer = (
  inputs: { code: string; series: Point[]; expenseRatio: number | null }[],
  index: Point[],
  asOf: number,
) => (number | null)[];

const compass =
  (cfg: CompassConfig): Scorer =>
  (inputs, index, asOf) => {
    const idx = index.filter((p) => p.t <= asOf);
    return compassScores(
      inputs.map((f) => fundMetrics(f, idx, asOf, cfg)),
      cfg,
    ).map((s) => s.score);
  };

/** The live method rebuilt from NAVs (fake zeros and the 1.5x on wins included), for comparison. */
const oldMethod =
  (fixed: boolean): Scorer =>
  (inputs, index, asOf) => {
    const trail = (s: Point[], y: number) => {
      const from = y === 0 ? asOf - 7 * DAY_MS : minusYears(asOf, y);
      const a = valueAt(s, from),
        b = valueAt(s, asOf);
      if (a === null || b === null || s[0].t > from + 7 * DAY_MS)
        return fixed ? null : 0;
      return y <= 1 ? (b / a - 1) * 100 : cagr(a, b, (asOf - from) / DAY_MS);
    };
    const idx = index.filter((p) => p.t <= asOf);
    const W: Record<number, number> = {
      0: 0.0003,
      1: 0.3499,
      3: 0.3999,
      5: 0.2499,
    };
    const cat = Object.fromEntries([0, 1, 3, 5].map((y) => [y, trail(idx, y)]));
    return inputs.map(({ series }) => {
      const s = series.filter((p) => p.t <= asOf);
      if (s.length < 2) return null;
      if (fixed && trail(s, 3) === null) return null;
      let sum = 0,
        tw = 0;
      for (const y of [0, 1, 3, 5]) {
        const f = trail(s, y),
          c = cat[y];
        if (f === null || c === null) continue;
        let o = (f - c) / Math.max(Math.abs(c), 1);
        if (f < 0 && (!fixed || o < 0)) o *= 1.5;
        sum += o * W[y];
        tw += W[y];
      }
      return tw ? sum / tw : 0;
    });
  };

async function main() {
  const { rows, series } = await load();
  const today = Math.max(...[...series.values()].map((s) => s[s.length - 1].t));
  const v3 = { ...COMPASS, lookbackYears: 3, halfLifeYears: null };
  const variants: Record<string, Scorer> = {
    "old (live)": oldMethod(false),
    "old, bugs fixed": oldMethod(true),
    "compass 3y 35/25/30/10": compass(v3),
    "compass 3y 45/25/20/10": compass({
      ...v3,
      weights: { returns: 0.45, consistency: 0.25, downside: 0.2, cost: 0.1 },
    }),
    "compass 3y 40/30/25/5": compass({
      ...v3,
      weights: { returns: 0.4, consistency: 0.3, downside: 0.25, cost: 0.05 },
    }),
    "compass 3y 30/30/30/10": compass({
      ...v3,
      weights: { returns: 0.3, consistency: 0.3, downside: 0.3, cost: 0.1 },
    }),
    "compass 3y prior 52": compass({ ...v3, priorWindows: 52 }),
    "compass 3y prior 13": compass({ ...v3, priorWindows: 13 }),
  };
  const cats = [...new Set(rows.map((r) => r.fund_category))].sort();
  console.log(
    "variant                     agree(good-weak)  good%  weak%   stab3m  stab6m   pred3y  pred2y",
  );
  for (const [name, scorer] of Object.entries(variants)) {
    const goodP: number[] = [],
      weakP: number[] = [],
      st3: number[] = [],
      st6: number[] = [],
      p3: number[] = [],
      p2: number[] = [];
    for (const cat of cats) {
      const members = rows.filter((r) => r.fund_category === cat);
      const inputs = members.map((r) => ({
        code: r.kuvera_code,
        series: series.get(r.kuvera_code)!,
        expenseRatio: r.expense_ratio === null ? null : Number(r.expense_ratio),
      }));
      const index = categoryIndex(inputs.map((i) => i.series));
      const now = scorer(inputs, index, today);
      const pct = percentiles(now, true);
      members.forEach((r, i) => {
        if (pct[i] === null) return;
        if ((GOOD[cat] ?? []).some((g) => r.short_name.startsWith(g)))
          goodP.push(pct[i]!);
        if ((BAD[cat] ?? []).some((b) => r.short_name.startsWith(b)))
          weakP.push(pct[i]!);
      });
      st3.push(spearman(now, scorer(inputs, index, minusMonths(today, 3))));
      st6.push(spearman(now, scorer(inputs, index, minusMonths(today, 6))));
      for (const [yb, arr] of [
        [3, p3],
        [2, p2],
      ] as const) {
        const t0 = minusYears(today, yb);
        const fwd = inputs.map((f) => {
          const a = valueAt(f.series, t0),
            b = valueAt(f.series, today),
            ca = valueAt(index, t0),
            cb = valueAt(index, today);
          return a === null || b === null || ca === null || cb === null
            ? null
            : cagr(a, b, (today - t0) / DAY_MS)! -
                cagr(ca, cb, (today - t0) / DAY_MS)!;
        });
        arr.push(spearman(scorer(inputs, index, t0), fwd));
      }
    }
    const g = mean(goodP),
      w = mean(weakP);
    console.log(
      `${name.padEnd(28)} ${(g - w).toFixed(1).padStart(8)}        ${g.toFixed(0).padStart(4)}  ${w.toFixed(0).padStart(5)}   ${mean(st3).toFixed(2).padStart(6)}  ${mean(st6).toFixed(2).padStart(6)}   ${mean(p3).toFixed(2).padStart(6)}  ${mean(p2).toFixed(2).padStart(6)}`,
    );
  }
}
main();
