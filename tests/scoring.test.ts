import { describe, test, expect } from "vitest";
import {
  computeOutperformance,
  computeRawScore,
  normalizeScores,
  computeSyntheticBenchmark,
} from "../src/lib/scoring";

describe("Scoring Unit Tests", () => {
  describe("computeOutperformance", () => {
    test("standard positive outperformance", () => {
      // fund = 15, category = 10 -> outperf = (15 - 10) / 10 = 0.5
      expect(computeOutperformance(15, 10)).toBeCloseTo(0.5);
    });

    test("zero category average guard", () => {
      // fund = 5, category = 0 -> denom = max(|0|, 1) = 1 -> outperf = (5 - 0) / 1 = 5
      expect(computeOutperformance(5, 0)).toBeCloseTo(5);
    });

    test("very small category average guard", () => {
      // fund = 2, category = 0.5 -> denom = max(|0.5|, 1) = 1 -> outperf = (2 - 0.5) / 1 = 1.5
      expect(computeOutperformance(2, 0.5)).toBeCloseTo(1.5);
    });

    test("negative absolute fund returns gets 1.5x penalty", () => {
      // fund = -5, category = -2 -> denom = max(|-2|, 2) = 2
      // outperf = ((-5) - (-2)) / 2 = -3 / 2 = -1.5
      // since fund < 0, outperf = -1.5 * 1.5 = -2.25
      expect(computeOutperformance(-5, -2)).toBeCloseTo(-2.25);
    });

    test("negative fund return but positive outperformance (recovery)", () => {
      // fund = -1, category = -5 -> denom = max(|-5|, 1) = 5
      // outperf = (-1 - (-5)) / 5 = 4 / 5 = 0.8
      // since fund < 0, outperf = 0.8 * 1.5 = 1.2
      expect(computeOutperformance(-1, -5)).toBeCloseTo(1.2);
    });
  });

  describe("computeRawScore", () => {
    test("empty returns handles null/missing return values gracefully", () => {
      const fund = {
        returns1w: null,
        returns1y: null,
        returns3y: null,
        returns5y: null,
      };
      const category = {
        returns1w: 1,
        returns1y: 10,
        returns3y: 12,
        returns5y: 15,
      };
      expect(computeRawScore(fund, category)).toBe(0);
    });

    test("single return period present scales weight to 1.0", () => {
      const fund = {
        returns1w: null,
        returns1y: 15, // outperformance: (15 - 10)/10 = 0.5
        returns3y: null,
        returns5y: null,
      };
      const category = {
        returns1w: 1,
        returns1y: 10,
        returns3y: 12,
        returns5y: 15,
      };
      // Only 1y returns available -> total available weight = 0.3499.
      // Adjusted weight = 0.3499 / 0.3499 = 1.0.
      // Score = 1.0 * outperf = 1.0 * 0.5 = 0.5.
      expect(computeRawScore(fund, category)).toBeCloseTo(0.5);
    });

    test("multiple return periods available are weighted dynamically", () => {
      const fund = {
        returns1w: 2,   // outperf = (2 - 1) / 1 = 1
        returns1y: 15,  // outperf = (15 - 10) / 10 = 0.5
        returns3y: null,
        returns5y: null,
      };
      const category = {
        returns1w: 1,
        returns1y: 10,
        returns3y: 12,
        returns5y: 15,
      };
      // Available periods: 1w (wt: 0.0003), 1y (wt: 0.3499).
      // Total weight = 0.3502.
      // Adjusted 1w weight = 0.0003 / 0.3502 = 0.00085665
      // Adjusted 1y weight = 0.3499 / 0.3502 = 0.99914334
      // Expected Score = (1 * 0.0003/0.3502) + (0.5 * 0.3499/0.3502)
      // = (0.0003 + 0.17495) / 0.3502 = 0.17525 / 0.3502 = 0.500428
      const expected = (1 * 0.0003 + 0.5 * 0.3499) / 0.3502;
      expect(computeRawScore(fund, category)).toBeCloseTo(expected);
    });
  });

  describe("normalizeScores", () => {
    test("empty scores returns empty array", () => {
      expect(normalizeScores([])).toEqual([]);
    });

    test("max score is less than or equal to zero yields 50 for all", () => {
      expect(normalizeScores([-1.5, -0.2, -3.0])).toEqual([50, 50, 50]);
      expect(normalizeScores([0, 0, 0])).toEqual([50, 50, 50]);
    });

    test("max score equals min score yields 100 for all", () => {
      expect(normalizeScores([1.5, 1.5, 1.5])).toEqual([100, 100, 100]);
    });

    test("single positive fund in category normalizes to 100", () => {
      expect(normalizeScores([2.5])).toEqual([100]);
    });

    test("single negative fund in category normalizes to 50", () => {
      expect(normalizeScores([-2.5])).toEqual([50]);
    });

    test("normal scaling between 50 and 100", () => {
      // min = 1, max = 5
      // 1 -> ((1-1)/4)*50 + 50 = 50
      // 3 -> ((3-1)/4)*50 + 50 = 75
      // 5 -> ((5-1)/4)*50 + 50 = 100
      expect(normalizeScores([1, 3, 5])).toEqual([50, 75, 100]);
    });

    test("scores are rounded to 2 decimal places", () => {
      // min = 0.1, max = 0.7
      // value = 0.3 -> ((0.3-0.1)/0.6)*50 + 50 = (0.2/0.6)*50 + 50 = 16.6666... + 50 = 66.67
      expect(normalizeScores([0.1, 0.3, 0.7])).toEqual([50, 66.67, 100]);
    });
  });

  describe("computeSyntheticBenchmark", () => {
    test("average is computed ignoring null values", () => {
      const funds = [
        {
          returns1w: 2,
          returns1y: null,
          returns3y: 12,
          returns5y: 15,
        },
        {
          returns1w: 4,
          returns1y: 10,
          returns3y: null,
          returns5y: 25,
        },
        {
          returns1w: null,
          returns1y: 20,
          returns3y: 18,
          returns5y: null,
        },
      ];

      const benchmark = computeSyntheticBenchmark(funds);
      // returns1w mean: (2 + 4) / 2 = 3
      // returns1y mean: (10 + 20) / 2 = 15
      // returns3y mean: (12 + 18) / 2 = 15
      // returns5y mean: (15 + 25) / 2 = 20
      expect(benchmark.returns1w).toBeCloseTo(3);
      expect(benchmark.returns1y).toBeCloseTo(15);
      expect(benchmark.returns3y).toBeCloseTo(15);
      expect(benchmark.returns5y).toBeCloseTo(20);
    });

    test("all null values for a period results in null benchmark period", () => {
      const funds = [
        {
          returns1w: null,
          returns1y: null,
          returns3y: null,
          returns5y: null,
        },
      ];
      const benchmark = computeSyntheticBenchmark(funds);
      expect(benchmark.returns1w).toBeNull();
      expect(benchmark.returns1y).toBeNull();
      expect(benchmark.returns3y).toBeNull();
      expect(benchmark.returns5y).toBeNull();
    });
  });
});
