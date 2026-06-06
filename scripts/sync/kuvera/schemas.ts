import { z } from "zod";

/** Schema for a raw fund entry in the nested list.json response. */
export const fundListItemRawSchema = z.object({
  c: z.string(),
  n: z.string().optional().default(""),
  re: z.string().optional().default(""),
  v: z.coerce.number().optional().nullable(),
  kc: z.string().optional().default(""),
});

export type FundListItemRaw = z.infer<typeof fundListItemRawSchema>;

/** Schema for a single fund entry in the list.json response. */
export const fundListItemSchema = z.object({
  code: z.string(),
  name: z.string().optional().default(""),
  fund_category: z.string().optional().default(""),
  fund_house: z.string().optional().default(""),
  re: z.string().optional().default(""),
});

export type FundListItem = z.infer<typeof fundListItemSchema>;

/** Top-level shape of list.json — array of fund items. */
export const fundListResponseSchema = z.array(fundListItemSchema);

/** Schema for the detail endpoint response (single fund). */
export const fundDetailSchema = z.object({
  code: z.string(),
  name: z.string(),
  short_name: z.string().optional().nullable(),
  small_screen_name: z.string().optional().nullable(),
  ISIN: z.string().optional().nullable(),
  fund_house: z.string().optional().nullable(),
  fund_name: z.string().optional().nullable(),
  fund_category: z.string().optional().nullable(),
  fund_type: z.string().optional().nullable(),
  direct: z.string().optional().nullable(),
  plan: z.string().optional().nullable(),
  maturity_type: z.string().optional().nullable(),
  lump_available: z.string().optional().nullable(),
  lump_min: z.coerce.number().optional().nullable(),
  sip_available: z.string().optional().nullable(),
  sip_min: z.coerce.number().optional().nullable(),
  lock_in_period: z.coerce.number().optional().nullable(),
  nav: z.object({
    nav: z.coerce.number().optional().nullable(),
    date: z.string().optional().nullable(),
  }).optional().nullable(),
  last_nav: z.object({
    nav: z.coerce.number().optional().nullable(),
    date: z.string().optional().nullable(),
  }).optional().nullable(),
  returns: z.object({
    week_1: z.coerce.number().optional().nullable(),
    year_1: z.coerce.number().optional().nullable(),
    year_3: z.coerce.number().optional().nullable(),
    year_5: z.coerce.number().optional().nullable(),
    inception: z.coerce.number().optional().nullable(),
    date: z.string().optional().nullable(),
  }).optional().nullable(),
  start_date: z.string().optional().nullable(),
  expense_ratio: z.coerce.number().optional().nullable(),
  expense_ratio_date: z.string().optional().nullable(),
  fund_manager: z.string().optional().nullable(),
  investment_objective: z.string().optional().nullable(),
  volatility: z.coerce.number().optional().nullable(),
  portfolio_turnover: z.coerce.number().optional().nullable(),
  aum: z.coerce.number().optional().nullable(),
  fund_rating: z.coerce.number().optional().nullable(),
  fund_rating_date: z.string().optional().nullable(),
  crisil_rating: z.string().optional().nullable(),
});

export type FundDetail = z.infer<typeof fundDetailSchema>;

/** Schema for a single category in fund_categories.json response. */
export const categoryAverageItemSchema = z.object({
  category_name: z.string(),
  report_date: z.string().optional().nullable(),
  week_1: z.coerce.number().optional().nullable(),
  year_1: z.coerce.number().optional().nullable(),
  year_3: z.coerce.number().optional().nullable(),
  year_5: z.coerce.number().optional().nullable(),
  inception: z.coerce.number().optional().nullable(),
});

export type CategoryAverageItem = z.infer<typeof categoryAverageItemSchema>;

/** Top-level shape of fund_categories.json. */
export const categoryAveragesResponseSchema = z.array(categoryAverageItemSchema);
