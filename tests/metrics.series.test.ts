import { describe, test, expect } from "vitest";
import {
  parseNavDate,
  cleanSeries,
  valueAt,
  cagr,
  minusMonths,
  minusYears,
  monthlyReturns,
  maxDrawdown,
  categoryIndex,
  settledDate,
  DAY_MS,
  type Point,
} from "../src/lib/metrics/series";

const d = (iso: string) => Date.parse(iso + "T00:00:00Z");
/** Daily series from a start date with a value per day. */
const daily = (startIso: string, values: number[]): Point[] =>
  values.map((v, i) => ({ t: d(startIso) + i * DAY_MS, v }));

describe("parseNavDate", () => {
  test("reads mfapi and ISO formats", () => {
    expect(parseNavDate("27-10-2026")).toBe(d("2026-10-27"));
    expect(parseNavDate("2026-10-27")).toBe(d("2026-10-27"));
  });
  test("rejects impossible and malformed dates instead of rolling them over", () => {
    expect(parseNavDate("31-02-2026")).toBeNaN();
    expect(parseNavDate("29-02-2025")).toBeNaN();
    expect(parseNavDate("29-02-2024")).toBe(d("2024-02-29"));
    expect(parseNavDate("")).toBeNaN();
    expect(parseNavDate("2026/10/27")).toBeNaN();
    expect(parseNavDate("7-4-2013")).toBeNaN();
  });
});

describe("cleanSeries", () => {
  test("drops zero, negative, missing, non-numeric and infinite NAVs and bad dates", () => {
    const { series, report } = cleanSeries([
      { date: "01-01-2020", nav: "10" },
      { date: "02-01-2020", nav: "0.00000" },
      { date: "03-01-2020", nav: "-5" },
      { date: "04-01-2020", nav: null },
      { date: "05-01-2020", nav: "abc" },
      { date: "06-01-2020", nav: "Infinity" },
      { date: "31-02-2020", nav: "11" },
      { date: "07-01-2020", nav: "" },
      { date: "08-01-2020", nav: 10.5 },
    ]);
    expect(series.map((p) => p.v)).toEqual([10, 10.5]);
    expect(report.dropped).toBe(7);
  });

  test("sorts by date and keeps the later row for a repeated date", () => {
    const { series, report } = cleanSeries([
      { date: "03-01-2020", nav: "12" },
      { date: "01-01-2020", nav: "10" },
      { date: "02-01-2020", nav: "11" },
      { date: "02-01-2020", nav: "11.2" },
    ]);
    expect(series.map((p) => p.v)).toEqual([10, 11.2, 12]);
    expect(report.duplicates).toBe(1);
  });

  test("removes a one-day spike that reverses (data error) but keeps a real crash and recovery", () => {
    const spike = cleanSeries([
      { date: "01-01-2020", nav: "10" },
      { date: "02-01-2020", nav: "18" },
      { date: "03-01-2020", nav: "10.1" },
    ]);
    expect(spike.series.map((p) => p.v)).toEqual([10, 10.1]);
    expect(spike.report.spikes).toBe(1);

    // a 13% fall that stays down is a market move, not a spike
    const crash = cleanSeries([
      { date: "20-03-2020", nav: "100" },
      { date: "23-03-2020", nav: "87" },
      { date: "24-03-2020", nav: "86" },
      { date: "25-03-2020", nav: "90" },
    ]);
    expect(crash.series).toHaveLength(4);
    expect(crash.report.spikes).toBe(0);
  });

  test("a spike at the very start or end has no neighbour on one side and is kept", () => {
    const { series } = cleanSeries([
      { date: "01-01-2020", nav: "10" },
      { date: "02-01-2020", nav: "18" },
    ]);
    expect(series).toHaveLength(2);
  });

  test("empty and all-invalid input give an empty series, never a throw", () => {
    expect(cleanSeries([]).series).toEqual([]);
    expect(cleanSeries([{ date: "x", nav: "0" }]).series).toEqual([]);
  });
});

describe("valueAt", () => {
  const s = daily("2020-01-01", [10, 11, 12]);
  test("exact day, carried over a short gap, null when stale or before the series", () => {
    expect(valueAt(s, d("2020-01-02"))).toBe(11);
    expect(valueAt(s, d("2020-01-05"))).toBe(12); // 2 days after the last price
    expect(valueAt(s, d("2020-01-20"))).toBeNull(); // 17 days stale
    expect(valueAt(s, d("2019-12-31"))).toBeNull(); // before the first price
    expect(valueAt([], d("2020-01-01"))).toBeNull();
  });
});

describe("cagr", () => {
  test("annualises growth, including losses", () => {
    expect(cagr(100, 121, 2 * 365.25)!).toBeCloseTo(10, 6);
    expect(cagr(100, 81, 2 * 365.25)!).toBeCloseTo(-10, 6);
    expect(cagr(100, 100, 365)).toBe(0);
  });
  test("refuses zero, negative or missing values and sub-day spans instead of returning Infinity or NaN", () => {
    expect(cagr(0, 100, 365)).toBeNull();
    expect(cagr(100, 0, 365)).toBeNull();
    expect(cagr(-1, 100, 365)).toBeNull();
    expect(cagr(NaN, 100, 365)).toBeNull();
    expect(cagr(100, 110, 0)).toBeNull();
    expect(cagr(100, 110, -5)).toBeNull();
  });
});

describe("minusMonths / minusYears", () => {
  test("clamps to the end of shorter months and handles leap days", () => {
    expect(minusMonths(d("2026-03-31"), 1)).toBe(d("2026-02-28"));
    expect(minusMonths(d("2024-03-31"), 1)).toBe(d("2024-02-29"));
    expect(minusYears(d("2024-02-29"), 1)).toBe(d("2023-02-28"));
    expect(minusYears(d("2026-10-27"), 3)).toBe(d("2023-10-27"));
    expect(minusMonths(d("2026-01-15"), 1)).toBe(d("2025-12-15"));
  });
});

describe("monthlyReturns", () => {
  test("uses each month's last NAV and skips across a missing month", () => {
    const s: Point[] = [
      { t: d("2020-01-31"), v: 100 },
      { t: d("2020-02-28"), v: 110 },
      // March missing entirely
      { t: d("2020-04-30"), v: 99 },
      { t: d("2020-05-29"), v: 99 },
    ];
    const r = monthlyReturns(s, d("2020-01-01"), d("2020-12-31"));
    expect([...r.keys()]).toEqual(["2020-1", "2020-4"]); // Feb vs Jan, May vs Apr; Apr vs Feb skipped
    expect(r.get("2020-1")).toBeCloseTo(0.1);
    expect(r.get("2020-4")).toBe(0);
  });
});

describe("maxDrawdown", () => {
  test("depth, peak, trough and recovery date", () => {
    const s = daily("2020-01-01", [100, 120, 90, 60, 80, 121, 110]);
    const dd = maxDrawdown(s, d("2020-01-01"), d("2020-12-31"))!;
    expect(dd.depth).toBeCloseTo(-50);
    expect(dd.peakT).toBe(d("2020-01-02"));
    expect(dd.troughT).toBe(d("2020-01-04"));
    expect(dd.recoveredT).toBe(d("2020-01-06"));
  });
  test("never fell: depth 0; never recovered: null recovery; too few points: null", () => {
    expect(
      maxDrawdown(daily("2020-01-01", [1, 2, 3]), 0, d("2030-01-01"))!.depth,
    ).toBe(0);
    expect(
      maxDrawdown(daily("2020-01-01", [10, 5, 6]), 0, d("2030-01-01"))!
        .recoveredT,
    ).toBeNull();
    expect(
      maxDrawdown(daily("2020-01-01", [10]), 0, d("2030-01-01")),
    ).toBeNull();
    expect(maxDrawdown([], 0, d("2030-01-01"))).toBeNull();
  });
});

describe("categoryIndex", () => {
  test("averages members' moves and needs the minimum number of members", () => {
    const a = daily("2020-01-01", [100, 110, 121]);
    const b = daily("2020-01-01", [50, 50, 50]);
    const idx = categoryIndex([a, b], 2);
    expect(idx.map((p) => p.v)).toEqual([100, 105, expect.closeTo(110.25, 6)]);
    expect(categoryIndex([a, b], 3)).toEqual([]);
  });
  test("a new member joins without moving the level on its first day", () => {
    const a = daily("2020-01-01", [100, 100, 100]);
    const b = daily("2020-01-02", [10, 20]); // launches on day 2, doubles on day 3
    const idx = categoryIndex([a, b], 1);
    expect(idx.map((p) => p.v)).toEqual([100, 100, 150]); // day 3: average of 0% and +100%
  });
  test("a sparse day loses no market move: it carries into the next step", () => {
    const members = [0, 1, 2].map(() => daily("2020-01-01", [100, 110, 121]));
    // drop day 2 from two members, so day 2 has only 1 member and is skipped at minMembers 2
    members[1] = [members[1][0], members[1][2]];
    members[2] = [members[2][0], members[2][2]];
    const idx = categoryIndex(members, 2);
    expect(idx.map((p) => p.v)).toEqual([100, expect.closeTo(121, 6)]);
  });
  test("a member with a stale previous price sits that step out", () => {
    const a = daily("2020-01-01", [100, 100]);
    const b: Point[] = [
      { t: d("2019-12-01"), v: 10 },
      { t: d("2020-01-02"), v: 30 },
    ];
    // index days: 1 Dec (b), 1 Jan, 2 Jan; b's 2 Jan price would be +200% on a month-old price, so it sits out
    expect(categoryIndex([a, b], 1).map((p) => p.v)).toEqual([100, 100, 100]);
  });
});

describe("settledDate", () => {
  test("the latest day most funds have a price, not the latest day any fund has one", () => {
    const full = (n: number) => daily("2020-01-01", Array(n).fill(10));
    const members = [...Array.from({ length: 9 }, () => full(3)), full(4)]; // only 1 of 10 has day 4
    expect(settledDate(members)).toBe(d("2020-01-03"));
    expect(settledDate(members, 0.1)).toBe(d("2020-01-04"));
  });
  test("empty members or no qualifying day give null", () => {
    expect(settledDate([])).toBeNull();
    expect(settledDate([[], []])).toBeNull();
  });
});
