import { pgTable, serial, text, decimal, integer, boolean, date, timestamp, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";

export const funds = pgTable(
  "funds",
  {
    id: serial("id").primaryKey(),
    kuveraCode: text("kuvera_code").unique().notNull(),
    schemeName: text("scheme_name").notNull(),
    isin: text("isin"),
    fundHouse: text("fund_house"),
    fundHouseName: text("fund_house_name"),
    fundCategory: text("fund_category"),
    fundType: text("fund_type"),
    lumpAvailable: text("lump_available"),
    lumpMin: decimal("lump_min", { precision: 15, scale: 2 }),
    sipAvailable: text("sip_available"),
    sipMin: decimal("sip_min", { precision: 15, scale: 2 }),
    lockInPeriod: integer("lock_in_period"),
    currentNav: decimal("current_nav", { precision: 10, scale: 5 }),
    currentNavDate: date("current_nav_date"),
    t1Nav: decimal("t1_nav", { precision: 10, scale: 5 }),
    t1NavDate: date("t1_nav_date"),
    returns1d: decimal("returns_1d", { precision: 8, scale: 4 }),
    returns1w: decimal("returns_1w", { precision: 8, scale: 4 }),
    returns1y: decimal("returns_1y", { precision: 8, scale: 4 }),
    returns3y: decimal("returns_3y", { precision: 8, scale: 4 }),
    returns5y: decimal("returns_5y", { precision: 8, scale: 4 }),
    returnsInception: decimal("returns_inception", { precision: 8, scale: 4 }),
    returnsDate: date("returns_date"),
    startDate: date("start_date"),
    expenseRatio: decimal("expense_ratio", { precision: 5, scale: 2 }),
    expenseRatioDate: date("expense_ratio_date"),
    fundManagers: jsonb("fund_managers"),
    investmentObjective: text("investment_objective"),
    volatility: decimal("volatility", { precision: 8, scale: 4 }),
    portfolioTurnover: decimal("portfolio_turnover", { precision: 8, scale: 4 }),
    aum: decimal("aum", { precision: 15, scale: 2 }),
    fundRating: integer("fund_rating"),
    fundRatingDate: date("fund_rating_date"),
    crisilRating: text("crisil_rating"),
    totalScore: decimal("total_score", { precision: 5, scale: 2 }),
    scoreUpdated: timestamp("score_updated"),
    lastUpdated: timestamp("last_updated").defaultNow(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_funds_kuvera_code").on(table.kuveraCode),
    index("idx_funds_isin").on(table.isin),
    index("idx_funds_fund_category").on(table.fundCategory),
    index("idx_funds_fund_house").on(table.fundHouse),
    index("idx_funds_fund_type").on(table.fundType),
    index("idx_funds_total_score").on(table.totalScore),
  ]
);

export const categoryAverages = pgTable(
  "category_averages",
  {
    id: serial("id").primaryKey(),
    categoryName: text("category_name").unique().notNull(),
    reportDate: date("report_date").notNull(),
    returns1w: decimal("returns_1w", { precision: 8, scale: 4 }),
    returns1y: decimal("returns_1y", { precision: 8, scale: 4 }),
    returns3y: decimal("returns_3y", { precision: 8, scale: 4 }),
    returns5y: decimal("returns_5y", { precision: 8, scale: 4 }),
    returnsInception: decimal("returns_inception", { precision: 8, scale: 4 }),
    isSynthetic: boolean("is_synthetic").notNull().default(false),
    sourceCount: integer("source_count"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_category_averages_name").on(table.categoryName),
    index("idx_category_averages_date").on(table.reportDate),
  ]
);

export type Fund = typeof funds.$inferSelect;
export type NewFund = typeof funds.$inferInsert;
export type CategoryAverage = typeof categoryAverages.$inferSelect;
export type NewCategoryAverage = typeof categoryAverages.$inferInsert;
