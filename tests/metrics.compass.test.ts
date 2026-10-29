import { describe, test, expect } from "vitest";
import { DAY_MS, type Point } from "../src/lib/metrics/series";
import {
  COMPASS,
  fundMetrics,
  compassScores,
  percentiles,
  weightedMedian,
  type FundMetrics,
} from "../src/lib/metrics/compass";

const d = (iso: string) => Date.parse(iso + "T00:00:00Z");
const AS_OF = d("2026-10-27");

/**
 * Daily series ending at AS_OF growing at an annual rate, with optional monthly wobble so there are
 * falling months. rate in % per year; wobble is a fraction (0.03 = ±3% alternating months).
 */
function grow(years: number, rate: number, wobble = 0, endT = AS_OF): Point[] {
  const out: Point[] = [];
  const days = Math.round(years * 365.25);
  for (let i = days; i >= 0; i--) {
    const t = endT - i * DAY_MS;
    const yrs = (days - i) / 365.25;
    const month = new Date(t).getUTCMonth();
    const w = wobble ? 1 + (month % 2 === 0 ? -wobble : wobble) : 1;
    out.push({ t, v: 100 * Math.pow(1 + rate / 100, yrs) * w });
  }
  return out;
}

describe("weightedMedian", () => {
  test("plain and weighted, odd and even, unsorted input", () => {
    expect(weightedMedian([3, 1, 2], [1, 1, 1])).toBe(2);
    expect(weightedMedian([1, 2, 3, 4], [1, 1, 1, 1])).toBe(2.5);
    expect(weightedMedian([1, 2, 3], [1, 1, 10])).toBe(3);
    expect(weightedMedian([-5, -1, 0], [1, 1, 1])).toBe(-1);
  });
});

describe("percentiles", () => {
  test("mid-rank: ties share a value, best is under 100, worst over 0, nulls stay null", () => {
    const p = percentiles([10, 20, 20, null, 30], true);
    expect(p[0]).toBeCloseTo(12.5);
    expect(p[1]).toBe(p[2]);
    expect(p[3]).toBeNull();
    expect(p[4]).toBeCloseTo(87.5);
    expect(Math.max(...(p.filter((x) => x !== null) as number[]))).toBeLessThan(
      100,
    );
  });
  test("lower-is-better flips the order; all equal gives everyone 50", () => {
    expect(percentiles([1, 2], false)).toEqual([75, 25]);
    expect(percentiles([5, 5, 5], true)).toEqual([50, 50, 50]);
  });
  test("NaN and Infinity are treated as missing, not ranked", () => {
    expect(percentiles([NaN, 1, Infinity], true)).toEqual([null, 50, null]);
    expect(percentiles([], true)).toEqual([]);
  });
});

describe("fundMetrics: who gets rated", () => {
  const index = grow(10, 12, 0.03);
  test("under 3 years of history is unrated with a plain reason", () => {
    const m = fundMetrics(
      { code: "new", series: grow(2.5, 30, 0.03), expenseRatio: 0.5 },
      index,
      AS_OF,
    );
    expect(m.rated).toBe(false);
    expect(m.unratedReason).toBe("Less than 3 years of history");
    expect(m.excessReturn).toBeNull();
  });
  test("exactly at the third birthday is still unrated (under a month of windows)", () => {
    const m = fundMetrics(
      { code: "edge", series: grow(3.0, 12, 0.03), expenseRatio: 0.5 },
      index,
      AS_OF,
    );
    expect(m.rated).toBe(false);
  });
  test("no prices, or one price, is unrated", () => {
    expect(
      fundMetrics({ code: "x", series: [], expenseRatio: null }, index, AS_OF)
        .unratedReason,
    ).toBe("No price history yet");
    expect(
      fundMetrics(
        { code: "x", series: [{ t: AS_OF, v: 10 }], expenseRatio: null },
        index,
        AS_OF,
      ).rated,
    ).toBe(false);
  });
  test("a fund that stopped reporting is not rated on a frozen record", () => {
    const stale = grow(8, 15, 0.03, AS_OF - 30 * DAY_MS);
    expect(
      fundMetrics({ code: "s", series: stale, expenseRatio: 1 }, index, AS_OF)
        .unratedReason,
    ).toBe("No recent prices");
  });
  test("only data up to the as-of date is used (no look-ahead)", () => {
    const s = grow(10, 12, 0.03);
    const past = d("2024-10-27");
    const m = fundMetrics(
      { code: "f", series: s, expenseRatio: 1 },
      index,
      past,
    );
    expect(m.historyYears).toBeCloseTo(8, 0);
  });
});

describe("fundMetrics: the numbers", () => {
  const index = grow(10, 12, 0.03);
  test("a fund that tracks its category exactly is dead average: 0 excess, 50% consistency", () => {
    const m = fundMetrics(
      { code: "same", series: index, expenseRatio: 1 },
      index,
      AS_OF,
    );
    expect(m.rated).toBe(true);
    expect(m.excessReturnRaw).toBeCloseTo(0, 6);
    expect(m.consistencyRaw).toBeCloseTo(0.5, 6); // every window is a tie, counted as half a win
    expect(m.downsideCapture).toBeCloseTo(100, 6);
  });
  test("steadily ahead: positive excess, beats every window; shrinkage pulls toward neutral but keeps the sign", () => {
    const m = fundMetrics(
      { code: "up", series: grow(10, 15, 0.03), expenseRatio: 1 },
      index,
      AS_OF,
    );
    expect(m.excessReturnRaw!).toBeGreaterThan(2.5);
    expect(m.consistencyRaw).toBe(1);
    expect(m.excessReturn!).toBeGreaterThan(0);
    expect(m.excessReturn!).toBeLessThan(m.excessReturnRaw!);
    expect(m.consistency!).toBeLessThan(1);
    expect(m.consistency!).toBeGreaterThan(0.5);
  });
  test("losing money in a falling market but losing less than the category scores as ahead", () => {
    const falling = grow(10, -8, 0.03);
    const m = fundMetrics(
      { code: "less-bad", series: grow(10, -4, 0.02), expenseRatio: 1 },
      falling,
      AS_OF,
    );
    expect(m.excessReturnRaw!).toBeGreaterThan(0);
    expect(m.consistencyRaw).toBe(1);
    expect(m.downsideCapture!).toBeLessThan(100);
  });
  test("negative excess when behind, and a short record is shrunk less than a long one is trusted", () => {
    const behind = fundMetrics(
      { code: "behind", series: grow(10, 9, 0.03), expenseRatio: 1 },
      index,
      AS_OF,
    );
    expect(behind.excessReturn!).toBeLessThan(0);
    const young = fundMetrics(
      { code: "young", series: grow(3.2, 9, 0.03), expenseRatio: 1 },
      index,
      AS_OF,
    );
    // same raw shortfall, fewer windows -> pulled closer to 0
    expect(Math.abs(young.excessReturn!)).toBeLessThan(
      Math.abs(behind.excessReturn!),
    );
  });
  test("a fund that never falls in the category's falling months has downside capture at or below 0", () => {
    const steady = grow(10, 10, 0);
    const m = fundMetrics(
      { code: "steady", series: steady, expenseRatio: 1 },
      index,
      AS_OF,
    );
    expect(m.downsideCapture!).toBeLessThanOrEqual(0.0001);
  });
  test("no falling months in the category: downside capture is unavailable, not divided by zero", () => {
    const smooth = grow(10, 12, 0);
    const m = fundMetrics(
      { code: "f", series: grow(10, 13, 0.03), expenseRatio: 1 },
      smooth,
      AS_OF,
    );
    expect(m.downsideCapture).toBeNull();
    expect(Number.isFinite(m.excessReturn!)).toBe(true);
  });
  test("missing or invalid expense ratio becomes null", () => {
    expect(
      fundMetrics({ code: "f", series: index, expenseRatio: NaN }, index, AS_OF)
        .expenseRatio,
    ).toBeNull();
    expect(
      fundMetrics(
        { code: "f", series: index, expenseRatio: null },
        index,
        AS_OF,
      ).expenseRatio,
    ).toBeNull();
  });
  test("every number a rated fund reports is finite", () => {
    const m = fundMetrics(
      { code: "f", series: grow(10, 14, 0.05), expenseRatio: 0.7 },
      index,
      AS_OF,
    );
    for (const v of [
      m.excessReturn,
      m.excessReturnRaw,
      m.consistency,
      m.consistencyRaw,
      m.downsideCapture,
      m.maxDrawdown,
      m.categoryMaxDrawdown,
    ])
      expect(Number.isFinite(v)).toBe(true);
  });
});

describe("compassScores", () => {
  const rated = (
    code: string,
    ex: number,
    con: number,
    cap: number | null,
    dd: number | null,
    er: number | null,
  ): FundMetrics => ({
    code,
    historyYears: 10,
    rated: true,
    unratedReason: null,
    windows: 150,
    excessReturn: ex,
    excessReturnRaw: ex,
    consistency: con,
    consistencyRaw: con,
    downsideCapture: cap,
    maxDrawdown: dd,
    categoryMaxDrawdown: dd === null ? null : -20,
    expenseRatio: er,
  });
  const unrated = (code: string): FundMetrics => ({
    ...rated(code, 0, 0.5, 100, -20, 1),
    rated: false,
    unratedReason: "Less than 3 years of history",
  });

  test("better on every part scores higher; scores stay inside 0..100; nobody is forced to 100", () => {
    const ms = [
      rated("a", 4, 0.9, 85, -15, 0.5),
      rated("b", 1, 0.6, 95, -19, 0.8),
      rated("c", -1, 0.4, 105, -22, 1.0),
      rated("d", -3, 0.2, 115, -26, 1.5),
      rated("e", 0, 0.5, 100, -20, 1.0),
    ];
    const s = compassScores(ms);
    const byCode = Object.fromEntries(s.map((x) => [x.code, x.score!]));
    expect(byCode.a).toBeGreaterThan(byCode.b);
    expect(byCode.b).toBeGreaterThan(byCode.c);
    expect(byCode.c).toBeGreaterThan(byCode.d);
    for (const x of s) {
      expect(x.score!).toBeGreaterThan(0);
      expect(x.score!).toBeLessThan(100);
    }
  });
  test("unrated funds get no score and don't affect the others' percentiles", () => {
    const base = [1, 2, 3, 4, 5].map((i) =>
      rated(String(i), i, i / 10, 100 - i, -20 + i, 1),
    );
    const withUnrated = compassScores([...base, unrated("new")]);
    const without = compassScores(base);
    expect(withUnrated.find((x) => x.code === "new")!.score).toBeNull();
    expect(
      withUnrated.filter((x) => x.code !== "new").map((x) => x.score),
    ).toEqual(without.map((x) => x.score));
  });
  test("fewer than the minimum rated peers: nobody in the category is scored", () => {
    const few = Array.from({ length: COMPASS.minRatedPeers - 1 }, (_, i) =>
      rated(String(i), i, 0.5, 100, -20, 1),
    );
    expect(compassScores(few).every((x) => x.score === null)).toBe(true);
  });
  test("a missing part re-weights the rest instead of counting as zero", () => {
    const ms = [
      rated("a", 2, 0.7, null, null, null),
      rated("b", 1, 0.6, 95, -19, 0.8),
      rated("c", 0, 0.5, 100, -20, 1),
      rated("d", -1, 0.4, 105, -21, 1.2),
      rated("e", -2, 0.3, 110, -22, 1.4),
    ];
    const a = compassScores(ms).find((x) => x.code === "a")!;
    expect(a.parts.downside).toBeNull();
    expect(a.parts.cost).toBeNull();
    // top on returns and consistency -> top-of-range score, not dragged down by missing parts
    expect(a.score!).toBeCloseTo(90, 0);
  });
  test("identical funds get identical scores", () => {
    const ms = [1, 2, 3, 4, 5].map((i) =>
      rated(String(i), 1, 0.6, 95, -19, 0.8),
    );
    const s = compassScores(ms).map((x) => x.score);
    expect(new Set(s).size).toBe(1);
    expect(s[0]).toBe(50);
  });
});
