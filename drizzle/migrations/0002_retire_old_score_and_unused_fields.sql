-- Retire the old return-based score and Kuvera fields nothing reads (docs/REBUILD.md, section 9).
-- Run only after the rebuild is live: the old site on main reads several of these.
-- Safe to run twice. Apply: npm run db:apply -- drizzle/migrations/0002_retire_old_score_and_unused_fields.sql
DROP TABLE IF EXISTS "category_averages" CASCADE;--> statement-breakpoint
DROP INDEX IF EXISTS "idx_funds_fund_type";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_funds_total_score";--> statement-breakpoint
ALTER TABLE "fund_metrics" DROP COLUMN IF EXISTS "windows";--> statement-breakpoint
ALTER TABLE "fund_metrics" DROP COLUMN IF EXISTS "excess_return";--> statement-breakpoint
ALTER TABLE "fund_metrics" DROP COLUMN IF EXISTS "consistency";--> statement-breakpoint
ALTER TABLE "funds" DROP COLUMN IF EXISTS "small_screen_name";--> statement-breakpoint
ALTER TABLE "funds" DROP COLUMN IF EXISTS "fund_type";--> statement-breakpoint
ALTER TABLE "funds" DROP COLUMN IF EXISTS "lump_available";--> statement-breakpoint
ALTER TABLE "funds" DROP COLUMN IF EXISTS "lump_min";--> statement-breakpoint
ALTER TABLE "funds" DROP COLUMN IF EXISTS "sip_available";--> statement-breakpoint
ALTER TABLE "funds" DROP COLUMN IF EXISTS "t1_nav";--> statement-breakpoint
ALTER TABLE "funds" DROP COLUMN IF EXISTS "t1_nav_date";--> statement-breakpoint
ALTER TABLE "funds" DROP COLUMN IF EXISTS "returns_1d";--> statement-breakpoint
ALTER TABLE "funds" DROP COLUMN IF EXISTS "returns_1w";--> statement-breakpoint
ALTER TABLE "funds" DROP COLUMN IF EXISTS "returns_1y";--> statement-breakpoint
ALTER TABLE "funds" DROP COLUMN IF EXISTS "expense_ratio_date";--> statement-breakpoint
ALTER TABLE "funds" DROP COLUMN IF EXISTS "volatility";--> statement-breakpoint
ALTER TABLE "funds" DROP COLUMN IF EXISTS "portfolio_turnover";--> statement-breakpoint
ALTER TABLE "funds" DROP COLUMN IF EXISTS "fund_rating";--> statement-breakpoint
ALTER TABLE "funds" DROP COLUMN IF EXISTS "fund_rating_date";--> statement-breakpoint
ALTER TABLE "funds" DROP COLUMN IF EXISTS "total_score";--> statement-breakpoint
ALTER TABLE "funds" DROP COLUMN IF EXISTS "score_updated";--> statement-breakpoint
ALTER TABLE "funds" DROP COLUMN IF EXISTS "tags";--> statement-breakpoint
ALTER TABLE "funds" DROP COLUMN IF EXISTS "comparison";