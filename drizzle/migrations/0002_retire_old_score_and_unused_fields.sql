-- Retire the old return-based score and Kuvera fields nothing reads (docs/REBUILD.md, section 9).
-- Run only after the rebuild is live: the old site on main reads several of these.
-- Safe to run twice. Once the new site has run cleanly for a while: DROP TABLE _backup_0002_funds,
-- _backup_0002_fund_metrics, _backup_0002_category_averages.
-- Apply: npm run db:apply -- drizzle/migrations/0002_retire_old_score_and_unused_fields.sql
-- Backups first: every dropped value is kept in _backup_0002_* tables until we drop them by hand. Dynamic SQL so a
-- second run (columns already gone) skips cleanly.
DO $$
BEGIN
  IF to_regclass('public._backup_0002_funds') IS NULL
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funds' AND column_name = 'total_score') THEN
    EXECUTE 'CREATE TABLE _backup_0002_funds AS SELECT id, kuvera_code, small_screen_name, fund_type, lump_available,
      lump_min, sip_available, t1_nav, t1_nav_date, returns_1d, returns_1w, returns_1y, expense_ratio_date, volatility,
      portfolio_turnover, fund_rating, fund_rating_date, total_score, score_updated, tags, comparison FROM funds';
  END IF;
  IF to_regclass('public._backup_0002_fund_metrics') IS NULL
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fund_metrics' AND column_name = 'windows') THEN
    EXECUTE 'CREATE TABLE _backup_0002_fund_metrics AS SELECT fund_id, windows, excess_return, consistency FROM fund_metrics';
  END IF;
  IF to_regclass('public.category_averages') IS NOT NULL AND to_regclass('public._backup_0002_category_averages') IS NULL THEN
    ALTER TABLE category_averages RENAME TO _backup_0002_category_averages;
  END IF;
END $$;--> statement-breakpoint
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