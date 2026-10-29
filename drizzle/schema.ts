import {
  pgTable,
  serial,
  text,
  decimal,
  integer,
  boolean,
  date,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";

export const funds = pgTable(
  "funds",
  {
    id: serial("id").primaryKey(),
    kuveraCode: text("kuvera_code").unique().notNull(),
    schemeName: text("scheme_name").notNull(),
    shortName: text("short_name"),
    isin: text("isin"),
    fundHouse: text("fund_house"),
    fundHouseName: text("fund_house_name"),
    fundCategory: text("fund_category"),
    sipMin: decimal("sip_min", { precision: 15, scale: 2 }),
    lockInPeriod: integer("lock_in_period"),
    currentNav: decimal("current_nav", { precision: 10, scale: 5 }),
    currentNavDate: date("current_nav_date"),
    returns3y: decimal("returns_3y", { precision: 8, scale: 4 }),
    returns5y: decimal("returns_5y", { precision: 8, scale: 4 }),
    returnsInception: decimal("returns_inception", { precision: 8, scale: 4 }),
    returnsDate: date("returns_date"),
    startDate: date("start_date"),
    expenseRatio: decimal("expense_ratio", { precision: 5, scale: 2 }),
    fundManagers: jsonb("fund_managers"),
    investmentObjective: text("investment_objective"),
    aum: decimal("aum", { precision: 15, scale: 2 }),
    crisilRating: text("crisil_rating"),
    lastUpdated: timestamp("last_updated").defaultNow(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_funds_kuvera_code").on(table.kuveraCode),
    index("idx_funds_isin").on(table.isin),
    index("idx_funds_fund_category").on(table.fundCategory),
    index("idx_funds_fund_house").on(table.fundHouse),
  ],
);

/**
 * Where each fund's NAV history comes from: its AMFI scheme code and, when AMFI issued a new code at a
 * merger, the verified predecessor scheme whose history is joined on (scaled to continue at the join).
 */
export const fundSources = pgTable("fund_sources", {
  fundId: integer("fund_id")
    .primaryKey()
    .references(() => funds.id, { onDelete: "cascade" }),
  amfiCode: text("amfi_code").notNull(),
  predecessorAmfiCode: text("predecessor_amfi_code"),
  predecessorScale: decimal("predecessor_scale", { precision: 20, scale: 12 }),
  joinedOn: date("joined_on"),
  verifiedAt: timestamp("verified_at").defaultNow(),
});

/**
 * Daily NAVs, one row per fund per trading day. Pre-merger days carry the predecessor's NAV already
 * scaled onto the fund (see fund_sources), so a fund's series reads as one continuous history.
 * Composite primary key, no surrogate id: about 1.1M rows stay small and every read is a per-fund range.
 */
export const navHistory = pgTable(
  "nav_history",
  {
    fundId: integer("fund_id")
      .notNull()
      .references(() => funds.id, { onDelete: "cascade" }),
    navDate: date("nav_date").notNull(),
    nav: decimal("nav", { precision: 16, scale: 6 }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.fundId, table.navDate] })],
);

/** Each category's equal-weight direct-plan index, one point per day, for charts and exact figures vs the category. */
export const categoryIndexPoints = pgTable(
  "category_index",
  {
    category: text("category").notNull(),
    pointDate: date("point_date").notNull(),
    value: decimal("value", { precision: 16, scale: 6 }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.category, table.pointDate] })],
);

/** Compass Score and the numbers behind it, recomputed weekly (src/lib/metrics, docs/SCORE.md). */
export const fundMetrics = pgTable("fund_metrics", {
  fundId: integer("fund_id")
    .primaryKey()
    .references(() => funds.id, { onDelete: "cascade" }),
  asOf: date("as_of").notNull(),
  rated: boolean("rated").notNull(),
  unratedReason: text("unrated_reason"),
  historyYears: decimal("history_years", { precision: 6, scale: 2 }),
  excessReturnRaw: decimal("excess_return_raw", { precision: 10, scale: 4 }),
  consistencyRaw: decimal("consistency_raw", { precision: 7, scale: 4 }),
  downsideCapture: decimal("downside_capture", { precision: 10, scale: 2 }),
  maxDrawdown: decimal("max_drawdown", { precision: 8, scale: 2 }),
  categoryMaxDrawdown: decimal("category_max_drawdown", {
    precision: 8,
    scale: 2,
  }),
  worstFall: decimal("worst_fall", { precision: 8, scale: 2 }),
  worstFallPeak: date("worst_fall_peak"),
  worstFallTrough: date("worst_fall_trough"),
  worstFallRecovered: date("worst_fall_recovered"),
  partReturns: decimal("part_returns", { precision: 5, scale: 1 }),
  partConsistency: decimal("part_consistency", { precision: 5, scale: 1 }),
  partDownside: decimal("part_downside", { precision: 5, scale: 1 }),
  partCost: decimal("part_cost", { precision: 5, scale: 1 }),
  score: decimal("score", { precision: 5, scale: 1 }),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Fund = typeof funds.$inferSelect;
export type NewFund = typeof funds.$inferInsert;
export type FundSource = typeof fundSources.$inferSelect;
export type NavRow = typeof navHistory.$inferInsert;
export type FundMetricsRow = typeof fundMetrics.$inferInsert;
