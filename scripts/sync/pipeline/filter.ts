/**
 * Stage 2 — Detail fetch + filter.
 * Per PRODUCT.md §7 Stage 2.
 */

import type { FundDetail } from "@scripts/sync/kuvera/schemas";
import { logger } from "@scripts/sync/shared/logger";

interface FilterResult {
  passed: FundDetail[];
  rejections: {
    staleNav: number;
    notDirect: number;
    notGrowth: number;
    notOpenEnded: number;
    lowAum: number;
    missingData: number;
    niftyExcluded: number;
  };
}

/**
 * Apply all Stage 2 filters to detailed fund data.
 * Per PRODUCT.md §7:
 * 1. current_nav_date >= today - 14 days
 * 2. direct === 'Y'
 * 3. plan === 'GROWTH'
 * 4. maturity_type === 'Open Ended'
 * 5. aum / 10 >= 10 (stored AUM >= 10 crore)
 * 6. code and name non-empty
 * 7. Name does not contain 'Nifty' (redundant defensive check)
 */
export function filterFunds(funds: FundDetail[]): FilterResult {
  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const rejections = {
    staleNav: 0,
    notDirect: 0,
    notGrowth: 0,
    notOpenEnded: 0,
    lowAum: 0,
    missingData: 0,
    niftyExcluded: 0,
  };

  const passed: FundDetail[] = [];

  for (const fund of funds) {
    // Filter 6: data integrity
    if (!fund.code || !fund.name) {
      rejections.missingData++;
      continue;
    }

    // Filter 1: NAV freshness
    const navDateStr = fund.nav?.date;
    if (!navDateStr) {
      rejections.staleNav++;
      continue;
    }
    const navDate = new Date(navDateStr);
    if (navDate < fourteenDaysAgo) {
      rejections.staleNav++;
      continue;
    }

    // Filter 2: direct plan only
    if (fund.direct !== "Y") {
      rejections.notDirect++;
      continue;
    }

    // Filter 3: growth option
    if (fund.plan !== "GROWTH") {
      rejections.notGrowth++;
      continue;
    }

    // Filter 4: open-ended
    if (fund.maturity_type !== "Open Ended") {
      rejections.notOpenEnded++;
      continue;
    }

    // Filter 5: AUM >= 10 crore (Kuvera ships in tens of lakhs)
    const aumCrore = (fund.aum ?? 0) / 10;
    if (aumCrore < 10) {
      rejections.lowAum++;
      continue;
    }

    // Filter 7: Nifty exclusion (redundant defensive check)
    if (/nifty/i.test(fund.name)) {
      rejections.niftyExcluded++;
      continue;
    }

    passed.push(fund);
  }

  logger.info("Filtering complete", {
    input: funds.length,
    passed: passed.length,
    rejections,
  });

  return { passed, rejections };
}
