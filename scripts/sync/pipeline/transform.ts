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
 * Kuvera's trailing returns. We keep only what verifying a merged fund's joined history needs (docs/DATA.md);
 * every return shown on the site is computed from NAV history instead.
 */
export function cleanReturns(
  returns:
    | {
        year_3?: number | null;
        year_5?: number | null;
        inception?: number | null;
      }
    | null
    | undefined,
) {
  const fixed = (v: number | null | undefined) =>
    v === null || v === undefined ? null : v.toFixed(4);
  return {
    returns3y: fixed(returns?.year_3),
    returns5y: fixed(returns?.year_5),
    returnsInception: fixed(returns?.inception),
  };
}

type CleanedReturns = ReturnType<typeof cleanReturns>;

const PERIOD_DAYS = {
  returns3y: 3 * 365,
  returns5y: 5 * 365,
} as const;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Kuvera sends 0 for a period a fund has not lived through. Stored as "0.0000", that read as a real 0% return.
 * A period counts only if the fund existed for all of it (a few days' slack for weekends and NAV lag). When the
 * start date is unknown, an exact zero is taken as missing; a true 0.0000% over three years doesn't happen.
 */
export function maskUnearnedReturns(
  cleaned: CleanedReturns,
  startDate: string | null | undefined,
  asOf: string | null | undefined,
): CleanedReturns {
  const result = { ...cleaned };
  const start = startDate ? Date.parse(startDate) : NaN;
  const end = asOf ? Date.parse(asOf) : NaN;
  const ageDays =
    Number.isFinite(start) && Number.isFinite(end)
      ? (end - start) / DAY_MS
      : null;

  for (const key of Object.keys(PERIOD_DAYS) as (keyof typeof PERIOD_DAYS)[]) {
    const value = result[key];
    if (value === null) continue;
    const tooYoung = ageDays !== null && ageDays < PERIOD_DAYS[key] - 5;
    const zeroMarker = ageDays === null && Number(value) === 0;
    if (tooYoung || zeroMarker) result[key] = null;
  }
  return result;
}

export function transformFundDetail(detail: FundDetail): NewFund {
  const cleaned = maskUnearnedReturns(
    cleanReturns(detail.returns),
    detail.start_date,
    detail.returns?.date ?? detail.nav?.date,
  );

  return {
    kuveraCode: detail.code,
    schemeName: detail.name,
    shortName: detail.short_name ?? null,
    isin: detail.ISIN ?? null,
    fundHouse: detail.fund_house ?? null,
    fundHouseName: detail.fund_name ?? null,
    fundCategory: detail.fund_category ?? null,
    sipMin: detail.sip_min?.toFixed(2) ?? null,
    lockInPeriod: detail.lock_in_period ?? null,
    currentNav: detail.nav?.nav?.toFixed(5) ?? null,
    currentNavDate: detail.nav?.date ?? null,
    returns3y: cleaned.returns3y,
    returns5y: cleaned.returns5y,
    returnsInception: cleaned.returnsInception,
    returnsDate: detail.returns?.date ?? null,
    startDate: detail.start_date ?? null,
    expenseRatio: detail.expense_ratio?.toFixed(2) ?? null,
    fundManagers: parseFundManagers(detail.fund_manager),
    investmentObjective: detail.investment_objective ?? null,
    aum:
      detail.aum !== null && detail.aum !== undefined
        ? (detail.aum / 10).toFixed(2)
        : null,
    crisilRating: detail.crisil_rating ?? null,
  };
}
