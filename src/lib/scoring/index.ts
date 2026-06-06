/**
 * Pure scoring functions — no DB, no fetch, no Date.now().
 * Shared between sync scripts and webapp.
 * Per PRODUCT.md §8.
 */

/** Base weights for each return period. */
const WEIGHTS = {
  returns1y: 0.3499,
  returns3y: 0.3999,
  returns5y: 0.2499,
  returns1w: 0.0003,
} as const;

type ReturnPeriod = keyof typeof WEIGHTS;

interface FundReturns {
  returns1w: number | null;
  returns1y: number | null;
  returns3y: number | null;
  returns5y: number | null;
}

interface CategoryReturns {
  returns1w: number | null;
  returns1y: number | null;
  returns3y: number | null;
  returns5y: number | null;
}

/**
 * Compute outperformance for a single return period.
 * denom = max(|category_return|, 1)
 * outperf = (fund_return - category_return) / denom
 * If fund_return < 0: outperf *= 1.5 (asymmetric penalty)
 */
export function computeOutperformance(
  fundReturn: number,
  categoryReturn: number
): number {
  const denom = Math.max(Math.abs(categoryReturn), 1);
  let outperf = (fundReturn - categoryReturn) / denom;
  if (fundReturn < 0) {
    outperf = outperf * 1.5;
  }
  return outperf;
}

/**
 * Compute raw score for a fund against its category averages.
 * Adjusts weights dynamically based on available data periods.
 * Returns 0 if no data available.
 */
export function computeRawScore(
  fund: FundReturns,
  category: CategoryReturns
): number {
  const periods: ReturnPeriod[] = ["returns1y", "returns3y", "returns5y", "returns1w"];

  const available: { period: ReturnPeriod; fundVal: number; catVal: number }[] = [];

  for (const period of periods) {
    const fundVal = fund[period];
    const catVal = category[period];
    if (fundVal !== null && catVal !== null) {
      available.push({ period, fundVal, catVal });
    }
  }

  if (available.length === 0) {
    return 0;
  }

  const totalAvailableWeight = available.reduce(
    (sum, { period }) => sum + WEIGHTS[period],
    0
  );

  let rawScore = 0;
  for (const { period, fundVal, catVal } of available) {
    const adjustedWeight = WEIGHTS[period] / totalAvailableWeight;
    const outperf = computeOutperformance(fundVal, catVal);
    rawScore += outperf * adjustedWeight;
  }

  return rawScore;
}

/**
 * Normalize raw scores within a category to 50–100 range.
 * - If max_score <= 0: all funds get 50
 * - If max == min: all funds get 100
 * - Else: normalized = ((score - min) / (max - min)) * 50 + 50
 * Rounds to 2 decimal places.
 */
export function normalizeScores(rawScores: number[]): number[] {
  if (rawScores.length === 0) return [];

  const max = Math.max(...rawScores);
  const min = Math.min(...rawScores);

  if (max <= 0) {
    return rawScores.map(() => 50);
  }

  if (max === min) {
    return rawScores.map(() => 100);
  }

  return rawScores.map((score) => {
    const normalized = ((score - min) / (max - min)) * 50 + 50;
    return Math.round(normalized * 100) / 100;
  });
}

/**
 * Compute a synthetic benchmark from an array of fund returns.
 * Arithmetic mean of each period, ignoring nulls.
 */
export function computeSyntheticBenchmark(
  funds: FundReturns[]
): CategoryReturns {
  const periods: (keyof FundReturns)[] = ["returns1w", "returns1y", "returns3y", "returns5y"];

  function meanForPeriod(period: keyof FundReturns): number | null {
    const values = funds
      .map((f) => f[period])
      .filter((v): v is number => v !== null);
    return values.length > 0
      ? values.reduce((sum, v) => sum + v, 0) / values.length
      : null;
  }

  return {
    returns1w: meanForPeriod("returns1w"),
    returns1y: meanForPeriod("returns1y"),
    returns3y: meanForPeriod("returns3y"),
    returns5y: meanForPeriod("returns5y"),
  };
}
