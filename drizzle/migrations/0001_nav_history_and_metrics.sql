CREATE TABLE "category_index" (
	"category" text NOT NULL,
	"point_date" date NOT NULL,
	"value" numeric(16, 6) NOT NULL,
	CONSTRAINT "category_index_category_point_date_pk" PRIMARY KEY("category","point_date")
);
--> statement-breakpoint
CREATE TABLE "fund_metrics" (
	"fund_id" integer PRIMARY KEY NOT NULL,
	"as_of" date NOT NULL,
	"rated" boolean NOT NULL,
	"unrated_reason" text,
	"history_years" numeric(6, 2),
	"windows" integer,
	"excess_return" numeric(10, 4),
	"excess_return_raw" numeric(10, 4),
	"consistency" numeric(7, 4),
	"consistency_raw" numeric(7, 4),
	"downside_capture" numeric(10, 2),
	"max_drawdown" numeric(8, 2),
	"category_max_drawdown" numeric(8, 2),
	"worst_fall" numeric(8, 2),
	"worst_fall_peak" date,
	"worst_fall_trough" date,
	"worst_fall_recovered" date,
	"part_returns" numeric(5, 1),
	"part_consistency" numeric(5, 1),
	"part_downside" numeric(5, 1),
	"part_cost" numeric(5, 1),
	"score" numeric(5, 1),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fund_sources" (
	"fund_id" integer PRIMARY KEY NOT NULL,
	"amfi_code" text NOT NULL,
	"predecessor_amfi_code" text,
	"predecessor_scale" numeric(20, 12),
	"joined_on" date,
	"verified_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "nav_history" (
	"fund_id" integer NOT NULL,
	"nav_date" date NOT NULL,
	"nav" numeric(16, 6) NOT NULL,
	CONSTRAINT "nav_history_fund_id_nav_date_pk" PRIMARY KEY("fund_id","nav_date")
);
--> statement-breakpoint
ALTER TABLE "fund_metrics" ADD CONSTRAINT "fund_metrics_fund_id_funds_id_fk" FOREIGN KEY ("fund_id") REFERENCES "public"."funds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fund_sources" ADD CONSTRAINT "fund_sources_fund_id_funds_id_fk" FOREIGN KEY ("fund_id") REFERENCES "public"."funds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nav_history" ADD CONSTRAINT "nav_history_fund_id_funds_id_fk" FOREIGN KEY ("fund_id") REFERENCES "public"."funds"("id") ON DELETE cascade ON UPDATE no action;