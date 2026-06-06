/**
 * Exact Kuvera category strings — match verbatim per PRODUCT.md §5.
 * Do not correct capitalization or spelling.
 */
export const FUND_CATEGORIES = [
  "Large Cap Fund",
  "Mid Cap Fund",
  "Small Cap Fund",
  "Flexi Cap Fund",
  "Multi Cap Fund",
  "Large & Mid Cap fund",
  "Dynamic Asset Allocation or Balanced Advantage",
  "Aggressive Hybrid Fund",
  "Multi Asset Allocation",
] as const;

export type FundCategory = (typeof FUND_CATEGORIES)[number];

export const EQUITY_CATEGORIES: FundCategory[] = [
  "Large Cap Fund",
  "Mid Cap Fund",
  "Small Cap Fund",
  "Flexi Cap Fund",
  "Multi Cap Fund",
  "Large & Mid Cap fund",
];

export const HYBRID_CATEGORIES: FundCategory[] = [
  "Dynamic Asset Allocation or Balanced Advantage",
  "Aggressive Hybrid Fund",
  "Multi Asset Allocation",
];

/** Category that requires a synthetic benchmark (no natural Kuvera benchmark). */
export const SYNTHETIC_BENCHMARK_CATEGORY: FundCategory = "Multi Asset Allocation";
