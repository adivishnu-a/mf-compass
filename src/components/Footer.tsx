import React from "react";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import { db } from "@/lib/db";
import { funds } from "@drizzle/schema";
import { sql } from "drizzle-orm";
import { formatIST } from "@/lib/format";
import { CompareFooterLink } from "./CompareFooterLink";

// Cached so dynamic pages do not query the database on every request.
const getLastUpdatedTimestamp = unstable_cache(
  async (): Promise<string> => {
    try {
      const result = await db
        .select({
          maxDate: sql<Date>`MAX(${funds.lastUpdated})`,
        })
        .from(funds);

      const maxDate = result[0]?.maxDate;
      return formatIST(maxDate);
    } catch (error) {
      console.error("Error fetching last updated timestamp for footer:", error);
      return formatIST(new Date()); // fallback to current date
    }
  },
  ["footer-last-updated"],
  { revalidate: 300, tags: ["funds"] },
);

export async function Footer() {
  const lastUpdated = await getLastUpdatedTimestamp();

  return (
    <footer className="w-full border-t border-border bg-card text-card-foreground transition-colors duration-200">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand & Mission */}
          <div className="col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <img
                src="/logo-96.png"
                alt="MF Compass Logo"
                width={20}
                height={20}
                className="h-5 w-5 object-contain"
              />
              <span className="font-heading text-lg font-extrabold tracking-tight">
                <span className="text-primary">MF</span> Compass
              </span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              A free, anonymous discovery and outperformance ranking tool for
              Indian mutual funds. We rank funds by relative outperformance over
              category averages to ensure peer comparisons are fair.
            </p>
            <div className="mt-6 text-xs text-muted-foreground">
              Data last updated:{" "}
              <span className="font-data font-medium text-foreground">
                {lastUpdated}
              </span>
            </div>
          </div>

          {/* Explore Columns */}
          <div>
            <h2 className="font-heading text-sm font-semibold tracking-wide text-foreground uppercase">
              Explore Equity
            </h2>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link
                  href="/funds?group=equity&category=Large%20Cap%20Fund"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Large Cap Funds
                </Link>
              </li>
              <li>
                <Link
                  href="/funds?group=equity&category=Mid%20Cap%20Fund"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Mid Cap Funds
                </Link>
              </li>
              <li>
                <Link
                  href="/funds?group=equity&category=Small%20Cap%20Fund"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Small Cap Funds
                </Link>
              </li>
              <li>
                <Link
                  href="/funds?group=equity&category=Flexi%20Cap%20Fund"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Flexi Cap Funds
                </Link>
              </li>
            </ul>
          </div>

          {/* Tools Columns */}
          <div>
            <h2 className="font-heading text-sm font-semibold tracking-wide text-foreground uppercase">
              MF Compass
            </h2>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link
                  href="/funds"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  All Categories
                </Link>
              </li>
              <li>
                <CompareFooterLink />
              </li>
              <li>
                <Link
                  href="/watchlist"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Watchlist
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* SEBI Disclaimer Section */}
        <div className="mt-12 border-t border-border/60 pt-8">
          <div className="rounded-xl border border-border/80 bg-background/50 p-4">
            <h3 className="font-heading text-xs font-bold tracking-wider text-foreground uppercase">
              SEBI Disclaimer & Risk Warning
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Mutual Fund investments are subject to market risks, read all
              scheme related documents carefully. Past performance is not an
              indicator or guarantee of future returns.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              MF Compass is a free, independent discovery platform. We are not a
              SEBI-registered advisor and do not provide investment advice,
              financial planning, or brokerage services. All rankings are
              mathematical calculations based on historical NAVs for educational
              purposes only.
            </p>
          </div>
          <div className="mt-6 flex flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:flex-row">
            <p>
              © {new Date().getFullYear()} MF Compass. Built for Indian
              Investors.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
