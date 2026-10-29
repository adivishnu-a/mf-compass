import { describe, expect, it } from "vitest";
import { aum, day, fall, inr, month, pct, rankOf, span } from "@/lib/format";
import {
  firstOnOrAfter,
  lumpSum,
  rebase,
  sip,
  xirr,
  type Series,
} from "@/lib/growth";
import { categoryByName } from "@/lib/categories";
import {
  median,
  partNotes,
  plainWords,
  summaryLine,
  worstFallWords,
} from "@/lib/verdict";

describe("format", () => {
  it("signs percents with a typographic minus and drops the sign at zero", () => {
    expect(pct(15.7085)).toBe("+15.7%");
    expect(pct(-2.4817)).toBe("−2.5%");
    expect(pct(-0.04)).toBe("0.0%");
    expect(pct(null)).toBe("—");
    expect(pct(Number.NaN)).toBe("—");
    expect(fall(-39.51)).toBe("−39.5%");
  });
  it("writes rupees in lakh and crore", () => {
    expect(inr(5000)).toBe("₹5,000");
    expect(inr(601234)).toBe("₹6.01 lakh");
    expect(inr(12000000)).toBe("₹1.20 crore");
    expect(aum(101856)).toBe("₹1.02 lakh Cr");
    expect(aum(19250.4)).toBe("₹19,250 Cr");
    expect(aum(0)).toBe("—");
  });
  it("formats dates and ranks", () => {
    expect(day("2026-10-28")).toBe("28 Oct 2026");
    expect(month("2020-11-19")).toBe("Nov 2020");
    expect(rankOf(1, 29)).toBe("Best of 29");
    expect(rankOf(2, 29)).toBe("2nd of 29");
    expect(rankOf(11, 29)).toBe("11th of 29");
    expect(rankOf(23, 29)).toBe("23rd of 29");
    expect(span("2020-03-23", "2020-11-20")).toBe("7 months");
    expect(span("2018-01-08", "2020-11-20")).toBe("2 years 10 months");
    expect(span("2020-03-23", "2020-03-30")).toBe("under a month");
  });
});

// A fund doubling steadily over 2 years: 1 Jan 2020 (day 18262) onwards, one point a month.
const start = 18262;
const monthly: Series = Array.from({ length: 25 }, (_, i) => [
  start + Math.round(i * 30.4375),
  100 * 2 ** (i / 24),
]);

describe("growth", () => {
  it("finds the first point on or after a day", () => {
    expect(firstOnOrAfter(monthly, start - 5)).toBe(0);
    expect(firstOnOrAfter(monthly, start + 1)).toBe(1);
    expect(firstOnOrAfter(monthly, start + 99999)).toBe(-1);
  });
  it("rebases to 100 from the first available point", () => {
    const r = rebase(monthly, start + 1);
    expect(r[0][1]).toBeCloseTo(100);
    expect(r.at(-1)![1]).toBeCloseTo(100 * 2 ** (23 / 24), 6);
    expect(rebase(monthly, start + 99999)).toEqual([]);
  });
  it("values a one-time sum and annualises it", () => {
    const out = lumpSum(monthly, monthly, start, 100000)!;
    expect(out.value).toBeCloseTo(200000, 0);
    expect(out.perYear).toBeCloseTo(41.4, 0);
  });
  it("values a SIP at the latest price and solves its XIRR", () => {
    const out = sip(monthly, monthly, start, 5000)!;
    expect(out.invested).toBe(5000 * 25); // one instalment per monthly price, this month included
    expect(out.value).toBeGreaterThan(out.invested);
    // Each instalment grows at 41.4% a year, so the money-weighted return is the same.
    expect(out.perYear).toBeCloseTo(41.4, 0);
  });
  it("refuses empty or nonsensical input", () => {
    expect(sip(monthly, monthly, start, 0)).toBeNull();
    expect(sip([], monthly, start, 5000)).toBeNull();
    expect(lumpSum(monthly, monthly, start + 99999, 5000)).toBeNull();
    expect(xirr([{ day: 0, amount: -100 }])).toBeNull();
  });
  it("does not annualise under a year", () => {
    expect(
      lumpSum(monthly, monthly.slice(0, 6), start, 1000)!.perYear,
    ).toBeNull();
  });
});

describe("verdict", () => {
  const mid = categoryByName("Mid Cap Fund")!;
  const hdfc = {
    excess: 3.99,
    consistency: 0.9745,
    downCapture: 86.98,
    fall: -16.96,
    categoryFall: -20.48,
    fallFrom: "2020-10-27",
    expense: 0.76,
    r1y: -2.48,
  };
  it("says the record plainly with real numbers (mock wording)", () => {
    expect(plainWords(hdfc, mid, -1.3, 0.8)).toEqual([
      "Beat the average mid cap in 97% of 3-year periods, by about 4% a year.",
      "Fell less when markets fell: −17% at worst since 2020, against −20% for its category.",
      "Costs 0.76% a year, less than most mid caps.",
      "Over the past year it's down 2.5%, a little worse than the average mid cap (−1.3%).",
    ]);
  });
  it("handles a trailing fund and missing parts", () => {
    const words = plainWords(
      {
        ...hdfc,
        excess: -1.2,
        consistency: 0.3,
        fall: null,
        expense: null,
        r1y: null,
      },
      mid,
      null,
      null,
    );
    expect(words).toEqual([
      "Trailed the average mid cap by about 1.2% a year, and was ahead in only 30% of 3-year periods.",
    ]);
    expect(summaryLine({ excess: -1.2, consistency: 0.3 })).toBe(
      "Behind by 1.2% a year · beat it 30% of the time",
    );
    expect(summaryLine({ excess: 3.6, consistency: 1 })).toBe(
      "Ahead by 3.6% a year · beat it every time",
    );
    expect(summaryLine({ excess: null, consistency: null })).toBeNull();
  });
  it("writes part notes", () => {
    expect(partNotes(hdfc)).toEqual({
      returns: "About 4% a year ahead",
      consistency: "Ahead in 97% of periods",
      downside: "Fell 13% less than peers",
      cost: "0.76% a year",
    });
  });
  it("describes the worst fall and its recovery", () => {
    expect(
      worstFallWords({
        peak: "2018-01-08",
        trough: "2020-03-23",
        recovered: "2020-11-20",
      }),
    ).toBe(
      "From its peak in Jan 2018 to its low in Mar 2020. It was back at its old high by Nov 2020, 7 months after the bottom.",
    );
    expect(
      worstFallWords({
        peak: "2024-09-01",
        trough: "2025-03-01",
        recovered: null,
      }),
    ).toBe(
      "From its peak in Sep 2024 to its low in Mar 2025. It hasn't yet climbed back to that high.",
    );
  });
  it("takes medians ignoring nulls", () => {
    expect(median([3, null, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
    expect(median([null])).toBeNull();
  });
});
