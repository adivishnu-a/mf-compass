/**
 * Stage 1 — Universe discovery from list.json.
 * Per PRODUCT.md §7 Stage 1.
 */

import type { FundListItem } from "@scripts/sync/kuvera/schemas";
import { FUND_CATEGORIES, type FundCategory } from "@/lib/kuvera/categories";
import { logger } from "@scripts/sync/shared/logger";

interface DiscoveryResult {
  codes: string[];
  rejections: {
    notGrowthPlan: number;
    invalidReinvestment: number;
    niftyExcluded: number;
    categoryMismatch: number;
  };
}

/**
 * Filter the fund universe to eligible codes for a given category.
 * 1. Keep only codes ending with '-GR' (direct + growth).
 * 2. Keep only re ∈ {'Y', 'Z'} (reinvestment flag).
 * 3. Drop names containing 'Nifty' (case-insensitive) — index fund exclusion.
 */
export function discoverFundsForCategory(
  allFunds: FundListItem[],
  category: FundCategory
): DiscoveryResult {
  const rejections = {
    notGrowthPlan: 0,
    invalidReinvestment: 0,
    niftyExcluded: 0,
    categoryMismatch: 0,
  };

  const categoryFunds = allFunds.filter((f) => {
    if (f.fund_category !== category) {
      return false;
    }
    return true;
  });

  const codes: string[] = [];

  for (const fund of categoryFunds) {
    if (!fund.code.endsWith("-GR")) {
      rejections.notGrowthPlan++;
      continue;
    }

    if (fund.re !== "Y" && fund.re !== "Z") {
      rejections.invalidReinvestment++;
      continue;
    }

    if (fund.name && /nifty/i.test(fund.name)) {
      rejections.niftyExcluded++;
      continue;
    }

    codes.push(fund.code);
  }

  return { codes, rejections };
}

/**
 * Run discovery across all 9 categories.
 * Returns a map of category → eligible fund codes.
 */
export function discoverAllFunds(
  allFunds: FundListItem[]
): Map<FundCategory, string[]> {
  const result = new Map<FundCategory, string[]>();

  for (const category of FUND_CATEGORIES) {
    const { codes, rejections } = discoverFundsForCategory(allFunds, category);

    logger.info("Discovery complete", {
      category,
      eligible: codes.length,
      rejections,
    });

    result.set(category, codes);
  }

  return result;
}
