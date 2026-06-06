/**
 * Transform a FundDetail API response into a NewFund DB row.
 * Per PRODUCT.md §6 field mapping.
 */

import type { FundDetail } from "@scripts/sync/kuvera/schemas";
import type { NewFund } from "@drizzle/schema";

/**
 * Parse fund_managers: Kuvera sends semicolon-separated string.
 * Split, trim, filter empty → JSON array.
 */
function parseFundManagers(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Compute 1-day return from current and previous NAV.
 * returns_1d = (current_nav - t1_nav) / t1_nav * 100
 */
function computeReturns1d(currentNav: number | null, t1Nav: number | null): string | null {
  if (currentNav === null || t1Nav === null || t1Nav === 0) return null;
  return (((currentNav - t1Nav) / t1Nav) * 100).toFixed(4);
}

function parseReturn(val: number | null | undefined): string | null {
  if (val === null || val === undefined || val === 0) return null;
  return val.toFixed(4);
}

export function transformFundDetail(detail: FundDetail): NewFund {
  const currentNav = detail.nav?.nav ?? null;
  const t1Nav = detail.last_nav?.nav ?? null;
  const aumCrore = detail.aum !== null && detail.aum !== undefined
    ? (detail.aum / 10).toFixed(2)
    : null;

  return {
    kuveraCode: detail.code,
    schemeName: detail.name,
    isin: detail.ISIN ?? null,
    fundHouse: detail.fund_house ?? null,
    fundHouseName: detail.fund_name ?? null,
    fundCategory: detail.fund_category ?? null,
    fundType: detail.fund_type ?? null,
    lumpAvailable: detail.lump_available ?? null,
    lumpMin: detail.lump_min?.toFixed(2) ?? null,
    sipAvailable: detail.sip_available ?? null,
    sipMin: detail.sip_min?.toFixed(2) ?? null,
    lockInPeriod: detail.lock_in_period ?? null,
    currentNav: currentNav?.toFixed(5) ?? null,
    currentNavDate: detail.nav?.date ?? null,
    t1Nav: t1Nav?.toFixed(5) ?? null,
    t1NavDate: detail.last_nav?.date ?? null,
    returns1d: computeReturns1d(currentNav, t1Nav),
    returns1w: parseReturn(detail.returns?.week_1),
    returns1y: parseReturn(detail.returns?.year_1),
    returns3y: parseReturn(detail.returns?.year_3),
    returns5y: parseReturn(detail.returns?.year_5),
    returnsInception: parseReturn(detail.returns?.inception),
    returnsDate: detail.returns?.date ?? null,
    startDate: detail.start_date ?? null,
    expenseRatio: detail.expense_ratio?.toFixed(2) ?? null,
    expenseRatioDate: detail.expense_ratio_date ?? null,
    fundManagers: parseFundManagers(detail.fund_managers),
    investmentObjective: detail.investment_objective ?? null,
    volatility: detail.volatility?.toFixed(4) ?? null,
    portfolioTurnover: detail.portfolio_turnover?.toFixed(4) ?? null,
    aum: aumCrore,
    fundRating: detail.fund_rating ?? null,
    fundRatingDate: detail.fund_rating_date ?? null,
    crisilRating: detail.crisil_rating ?? null,
    totalScore: null,
    scoreUpdated: null,
  };
}
