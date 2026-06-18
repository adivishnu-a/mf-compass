/**
 * Typed Kuvera API client.
 * Per PRODUCT.md §6: no auth, batches of 10, 100ms delay, 15s timeout.
 */

import {
  fundListResponseSchema,
  fundListItemRawSchema,
  fundDetailSchema,
  categoryAveragesResponseSchema,
  type FundListItem,
  type FundDetail,
  type CategoryAverageItem,
} from "@scripts/sync/kuvera/schemas";
import { logger } from "@scripts/sync/shared/logger";

const BASE_URL = "https://api.kuvera.in/mf/api";
const HEADERS = {
  "User-Agent": "MF-Compass",
  Accept: "application/json",
};
const TIMEOUT_MS = 15_000;
const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 100;

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: HEADERS,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Fetch the full fund universe from list.json. */
export async function fetchFundList(): Promise<FundListItem[]> {
  const url = `${BASE_URL}/v4/fund_schemes/list.json`;
  logger.info("Fetching fund universe", { url });

  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new Error(`Fund list fetch failed: ${response.status} ${response.statusText}`);
  }

  const raw = await response.json();
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Invalid response from fund list API: expected object");
  }

  const flattened: unknown[] = [];
  for (const assetClass of Object.keys(raw)) {
    const categoriesObj = (raw as Record<string, unknown>)[assetClass] as Record<string, unknown>;
    if (!categoriesObj || typeof categoriesObj !== "object") continue;

    for (const categoryName of Object.keys(categoriesObj)) {
      const fundHousesObj = categoriesObj[categoryName] as Record<string, unknown>;
      if (!fundHousesObj || typeof fundHousesObj !== "object") continue;

      for (const fundHouseName of Object.keys(fundHousesObj)) {
        const fundsList = fundHousesObj[fundHouseName];
        if (!Array.isArray(fundsList)) continue;

        for (const rawFund of fundsList) {
          const parsedFund = fundListItemRawSchema.safeParse(rawFund);
          if (!parsedFund.success) {
            continue;
          }

          const fund = parsedFund.data;
          flattened.push({
            code: fund.c,
            name: fund.n,
            fund_category: categoryName,
            fund_house: fundHouseName,
            re: fund.re,
          });
        }
      }
    }
  }

  const parsed = fundListResponseSchema.safeParse(flattened);

  if (!parsed.success) {
    throw new Error(`Fund list schema validation failed: ${parsed.error.message}`);
  }

  logger.info("Fund universe fetched and flattened", { count: parsed.data.length });
  return parsed.data;
}

/** Fetch detail for a single fund. Returns null on failure (log + skip). */
export async function fetchFundDetail(code: string): Promise<FundDetail | null> {
  const url = `${BASE_URL}/v5/fund_schemes/${code}.json`;

  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      logger.warn("Fund detail fetch failed", { code, status: response.status });
      return null;
    }

    const raw = await response.json();
    const detailObj = Array.isArray(raw) ? raw[0] : raw;
    const parsed = fundDetailSchema.safeParse(detailObj);

    if (!parsed.success) {
      logger.warn("Fund detail schema validation failed", {
        code,
        errors: parsed.error.issues.map((i) => i.message),
      });
      return null;
    }

    return parsed.data;
  } catch (err) {
    logger.warn("Fund detail fetch error", {
      code,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/** Fetch details for multiple funds in batches of 10 with 100ms delay. */
export async function fetchFundDetailsBatched(codes: string[]): Promise<FundDetail[]> {
  const results: FundDetail[] = [];
  const totalBatches = Math.ceil(codes.length / BATCH_SIZE);

  for (let i = 0; i < codes.length; i += BATCH_SIZE) {
    const batch = codes.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    logger.info("Fetching batch", {
      batch: batchNum,
      total: totalBatches,
      codes: batch.length,
    });

    const batchResults = await Promise.allSettled(
      batch.map((code) => fetchFundDetail(code))
    );

    for (const result of batchResults) {
      if (result.status === "fulfilled" && result.value !== null) {
        results.push(result.value);
      }
    }

    if (i + BATCH_SIZE < codes.length) {
      await delay(BATCH_DELAY_MS);
    }
  }

  return results;
}

/** Fetch category averages from Kuvera. */
export async function fetchCategoryAverages(): Promise<CategoryAverageItem[]> {
  const url = `${BASE_URL}/v4/fund_categories.json`;
  logger.info("Fetching category averages", { url });

  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new Error(`Category averages fetch failed: ${response.status} ${response.statusText}`);
  }

  const raw = await response.json();
  const parsed = categoryAveragesResponseSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error(`Category averages schema validation failed: ${parsed.error.message}`);
  }

  logger.info("Category averages fetched", { count: parsed.data.length });
  return parsed.data;
}
