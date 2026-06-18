CREATE TABLE "category_averages" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_name" text NOT NULL,
	"report_date" date NOT NULL,
	"returns_1w" numeric(8, 4),
	"returns_1y" numeric(8, 4),
	"returns_3y" numeric(8, 4),
	"returns_5y" numeric(8, 4),
	"returns_inception" numeric(8, 4),
	"is_synthetic" boolean DEFAULT false NOT NULL,
	"source_count" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "category_averages_category_name_unique" UNIQUE("category_name")
);
--> statement-breakpoint
CREATE TABLE "funds" (
	"id" serial PRIMARY KEY NOT NULL,
	"kuvera_code" text NOT NULL,
	"scheme_name" text NOT NULL,
	"short_name" text,
	"small_screen_name" text,
	"isin" text,
	"fund_house" text,
	"fund_house_name" text,
	"fund_category" text,
	"fund_type" text,
	"lump_available" text,
	"lump_min" numeric(15, 2),
	"sip_available" text,
	"sip_min" numeric(15, 2),
	"lock_in_period" integer,
	"current_nav" numeric(10, 5),
	"current_nav_date" date,
	"t1_nav" numeric(10, 5),
	"t1_nav_date" date,
	"returns_1d" numeric(8, 4),
	"returns_1w" numeric(8, 4),
	"returns_1y" numeric(8, 4),
	"returns_3y" numeric(8, 4),
	"returns_5y" numeric(8, 4),
	"returns_inception" numeric(8, 4),
	"returns_date" date,
	"start_date" date,
	"expense_ratio" numeric(5, 2),
	"expense_ratio_date" date,
	"fund_managers" jsonb,
	"investment_objective" text,
	"volatility" numeric(8, 4),
	"portfolio_turnover" numeric(8, 4),
	"aum" numeric(15, 2),
	"fund_rating" integer,
	"fund_rating_date" date,
	"crisil_rating" text,
	"total_score" numeric(5, 2),
	"score_updated" timestamp,
	"tags" jsonb,
	"comparison" jsonb,
	"last_updated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "funds_kuvera_code_unique" UNIQUE("kuvera_code")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_category_averages_name" ON "category_averages" USING btree ("category_name");--> statement-breakpoint
CREATE INDEX "idx_category_averages_date" ON "category_averages" USING btree ("report_date");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_funds_kuvera_code" ON "funds" USING btree ("kuvera_code");--> statement-breakpoint
CREATE INDEX "idx_funds_isin" ON "funds" USING btree ("isin");--> statement-breakpoint
CREATE INDEX "idx_funds_fund_category" ON "funds" USING btree ("fund_category");--> statement-breakpoint
CREATE INDEX "idx_funds_fund_house" ON "funds" USING btree ("fund_house");--> statement-breakpoint
CREATE INDEX "idx_funds_fund_type" ON "funds" USING btree ("fund_type");--> statement-breakpoint
CREATE INDEX "idx_funds_total_score" ON "funds" USING btree ("total_score" DESC NULLS LAST);