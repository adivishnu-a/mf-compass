/**
 * Compass Score: how a fund compares with the rest of its category, from its NAV history.
 * Pure: no DB, no fetch, no Date.now(). Everything is measured against the category's own direct-plan
 * index (see categoryIndex) over the same dates, so markets rising or falling never move a score by
 * themselves; only beating or trailing peers does.
 *
 * Four parts, each ranked within the category, then combined:
 *   returns      median rolling 3-year return over the category, in percentage points
 *   consistency  share of rolling 3-year windows in which the fund beat the category
 *   downside     how much of the category's falling months it took (downside capture) and its worst
 *                fall against the category's worst fall over the same dates
 *   cost         expense ratio (lower is better)
 */
import {
  type Point,
  DAY_MS,
  cagr,
  maxDrawdown,
  minusYears,
  monthlyReturns,
  valueAt,
} from "./series";

export const COMPASS = {
  /** Track record needed to be rated at all (Morningstar uses 3 years too). */
  minYears: 3,
  /**
   * Window end dates span the last 3 years, so the score reads 3-year periods across roughly the last
   * 6 years of history. Chosen on agreement with analysts and stability (scripts/research/evaluate.ts).
   */
  lookbackYears: 3,
  windowYears: 3,
  stepDays: 7,
  /**
   * Shrinkage: a fund with few windows is pulled toward "no better or worse than its category" in
   * proportion to how little evidence it has. 26 weekly windows = half a year of window ends.
   */
  priorWindows: 26,
  /** Fewest 3-year windows (one a week) needed to rate a fund: about a month of them. */
  minWindows: 4,
  /**
   * Recent windows count for more: a window ending this many years ago has half the weight of one ending
   * today. null = all windows equal.
   */
  halfLifeYears: null as number | null,
  /** Downside capture needs at least this many falling category months to mean anything. */
  minDownMonths: 6,
  weights: { returns: 0.35, consistency: 0.25, downside: 0.3, cost: 0.1 },
  /** Categories with fewer rated funds than this get no scores (percentiles of 3 funds mean nothing). */
  minRatedPeers: 5,
};

export type CompassConfig = typeof COMPASS;

export interface FundInput {
  code: string;
  series: readonly Point[];
  expenseRatio: number | null;
}

export interface FundMetrics {
  code: string;
  /** Years of NAV history up to asOf. */
  historyYears: number;
  rated: boolean;
  /** Why it isn't rated, in plain words. */
  unratedReason: string | null;
  windows: number;
  /** Median rolling 3Y return minus the category's, percentage points, after shrinkage. */
  excessReturn: number | null;
  /** Raw (unshrunk) median for display. */
  excessReturnRaw: number | null;
  /** Share of windows beating the category, 0..1, after shrinkage. */
  consistency: number | null;
  consistencyRaw: number | null;
  /** Fund's average move in the category's falling months as a % of the category's (100 = fell as much). */
  downsideCapture: number | null;
  /** Fund's and category's worst fall over the same dates, negative percent. */
  maxDrawdown: number | null;
  categoryMaxDrawdown: number | null;
  expenseRatio: number | null;
}

/** Weighted median: the value where half the total weight lies on each side (midpoint on an exact split). */
export function weightedMedian(
  xs: readonly number[],
  ws: readonly number[],
): number {
  const pairs = xs
    .map((x, i) => [x, ws[i]] as const)
    .sort((a, b) => a[0] - b[0]);
  const total = pairs.reduce((s, p) => s + p[1], 0);
  let acc = 0;
  for (let i = 0; i < pairs.length; i++) {
    acc += pairs[i][1];
    if (Math.abs(acc - total / 2) < 1e-12 && i + 1 < pairs.length)
      return (pairs[i][0] + pairs[i + 1][0]) / 2;
    if (acc > total / 2) return pairs[i][0];
  }
  return pairs[pairs.length - 1][0];
}

/** Metrics for one fund as of a date, using only data on or before that date. */
export function fundMetrics(
  fund: FundInput,
  index: readonly Point[],
  asOf: number,
  config: CompassConfig = COMPASS,
): FundMetrics {
  const C = config;
  const series = fund.series.filter((p) => p.t <= asOf);
  const base: FundMetrics = {
    code: fund.code,
    historyYears: 0,
    rated: false,
    unratedReason: null,
    windows: 0,
    excessReturn: null,
    excessReturnRaw: null,
    consistency: null,
    consistencyRaw: null,
    downsideCapture: null,
    maxDrawdown: null,
    categoryMaxDrawdown: null,
    expenseRatio:
      fund.expenseRatio !== null && Number.isFinite(fund.expenseRatio)
        ? fund.expenseRatio
        : null,
  };
  if (series.length < 2)
    return { ...base, unratedReason: "No price history yet" };
  const first = series[0].t;
  const last = series[series.length - 1].t;
  base.historyYears = (last - first) / (365.25 * DAY_MS);
  // a fund that stopped reporting prices is not rated on a frozen record
  if (asOf - last > 14 * DAY_MS)
    return { ...base, unratedReason: "No recent prices" };
  if (minusYears(asOf, C.minYears) < first - 7 * DAY_MS)
    return {
      ...base,
      unratedReason: `Less than ${C.minYears} years of history`,
    };

  // Rolling 3-year windows ending each week over the lookback, where both fund and category have prices
  // at both ends (within a week). Each window: fund's annualised return minus the category's, same dates.
  const excesses: number[] = [];
  const weights: number[] = [];
  const earliestEnd = Math.max(minusYears(asOf, C.lookbackYears), first);
  for (let end = asOf; end >= earliestEnd; end -= C.stepDays * DAY_MS) {
    const start = minusYears(end, C.windowYears);
    if (start < first - 7 * DAY_MS) break;
    const f0 = valueAt(series, start);
    const f1 = valueAt(series, end);
    const c0 = valueAt(index, start);
    const c1 = valueAt(index, end);
    if (f0 === null || f1 === null || c0 === null || c1 === null) continue;
    const days = (end - start) / DAY_MS;
    const fr = cagr(f0, f1, days);
    const cr = cagr(c0, c1, days);
    if (fr === null || cr === null) continue;
    excesses.push(fr - cr);
    const ageYears = (asOf - end) / (365.25 * DAY_MS);
    weights.push(
      C.halfLifeYears ? Math.pow(0.5, ageYears / C.halfLifeYears) : 1,
    );
  }
  // Under a month of 3-year windows (a fund right at its third birthday, or with gaps at both ends) is not
  // a track record yet; it reads the same to a user as being under 3 years old.
  if (excesses.length < C.minWindows)
    return {
      ...base,
      unratedReason: `Less than ${C.minYears} years of history`,
    };
  const totalW = weights.reduce((a, b) => a + b, 0);
  // effective number of windows (Kish): weighting old windows down means less evidence, not more
  const w = (totalW * totalW) / weights.reduce((a, b) => a + b * b, 0);
  const k = C.priorWindows;
  const rawMedian = weightedMedian(excesses, weights);
  let beatW = 0;
  excesses.forEach(
    (x, i) => (beatW += x > 0 ? weights[i] : x === 0 ? weights[i] / 2 : 0),
  );
  const rawConsistency = beatW / totalW;

  // Downside, over the same span as the windows (up to lookback + window years), fund vs category.
  const from = Math.max(
    minusYears(asOf, C.lookbackYears + C.windowYears),
    first,
  );
  const fm = monthlyReturns(series, from, asOf);
  const cm = monthlyReturns(index, from, asOf);
  const down: { f: number; c: number }[] = [];
  for (const [key, c] of cm) {
    const f = fm.get(key);
    if (f !== undefined && c < 0) down.push({ f, c });
  }
  let downsideCapture: number | null = null;
  if (down.length >= C.minDownMonths) {
    const cAvg = down.reduce((s, d) => s + d.c, 0) / down.length;
    const fAvg = down.reduce((s, d) => s + d.f, 0) / down.length;
    downsideCapture = (fAvg / cAvg) * 100;
  }
  const fdd = maxDrawdown(series, from, asOf);
  const cdd = maxDrawdown(index, from, asOf);

  return {
    ...base,
    rated: true,
    windows: excesses.length,
    excessReturnRaw: rawMedian,
    excessReturn: (rawMedian * w) / (w + k),
    consistencyRaw: rawConsistency,
    consistency: (rawConsistency * w + 0.5 * k) / (w + k),
    downsideCapture,
    maxDrawdown: fdd?.depth ?? null,
    categoryMaxDrawdown: cdd?.depth ?? null,
  };
}

/**
 * Percentile of each value among the others, 0..100, higher = better. Mid-rank for ties, so equal values
 * get equal percentiles, and the scale is (rank - 0.5) / n: the best of n is just under 100, the worst
 * just over 0, and nobody is forced to exactly 100. nulls stay null.
 */
export function percentiles(
  values: (number | null)[],
  higherIsBetter: boolean,
): (number | null)[] {
  const present = values.filter(
    (v): v is number => v !== null && Number.isFinite(v),
  );
  const n = present.length;
  return values.map((v) => {
    if (v === null || !Number.isFinite(v) || n === 0) return null;
    let below = 0;
    let equal = 0;
    for (const x of present) {
      if (x === v) equal++;
      else if (higherIsBetter ? x < v : x > v) below++;
    }
    return ((below + equal / 2) / n) * 100;
  });
}

export interface CompassScore {
  code: string;
  score: number | null;
  parts: {
    returns: number | null;
    consistency: number | null;
    downside: number | null;
    cost: number | null;
  };
}

/**
 * Scores for one category. Each part is a percentile among the category's rated funds; the score is the
 * weighted average of the parts a fund has (weights re-normalised when a part is missing, but at least
 * returns and consistency are required). The score is 0..100 and reads as "on balance, better than this
 * share of its peers". Unrated funds, and every fund in a category with too few rated peers, get null.
 */
export function compassScores(
  metrics: readonly FundMetrics[],
  config: CompassConfig = COMPASS,
): CompassScore[] {
  const C = config;
  const rated = metrics.filter((m) => m.rated);
  if (rated.length < C.minRatedPeers)
    return metrics.map((m) => ({
      code: m.code,
      score: null,
      parts: { returns: null, consistency: null, downside: null, cost: null },
    }));

  const ret = percentiles(
    rated.map((m) => m.excessReturn),
    true,
  );
  const con = percentiles(
    rated.map((m) => m.consistency),
    true,
  );
  // downside: lower capture is better; a shallower worst fall than the category is better
  const cap = percentiles(
    rated.map((m) => m.downsideCapture),
    false,
  );
  const ddRel = percentiles(
    rated.map((m) =>
      m.maxDrawdown !== null && m.categoryMaxDrawdown !== null
        ? m.maxDrawdown - m.categoryMaxDrawdown
        : null,
    ),
    true,
  );
  const cost = percentiles(
    rated.map((m) => m.expenseRatio),
    false,
  );

  const byCode = new Map<string, CompassScore>();
  rated.forEach((m, i) => {
    const downside =
      cap[i] !== null && ddRel[i] !== null
        ? 0.6 * cap[i]! + 0.4 * ddRel[i]!
        : (cap[i] ?? ddRel[i]);
    const parts = {
      returns: ret[i],
      consistency: con[i],
      downside,
      cost: cost[i],
    };
    let score: number | null = null;
    if (parts.returns !== null && parts.consistency !== null) {
      let sum = 0;
      let weight = 0;
      for (const key of Object.keys(C.weights) as (keyof typeof C.weights)[]) {
        if (parts[key] === null) continue;
        sum += parts[key]! * C.weights[key];
        weight += C.weights[key];
      }
      score = Math.round((sum / weight) * 10) / 10;
    }
    byCode.set(m.code, { code: m.code, score, parts });
  });
  return metrics.map(
    (m) =>
      byCode.get(m.code) ?? {
        code: m.code,
        score: null,
        parts: { returns: null, consistency: null, downside: null, cost: null },
      },
  );
}
