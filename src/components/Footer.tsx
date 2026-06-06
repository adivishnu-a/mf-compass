import React from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { funds } from "@drizzle/schema";
import { sql } from "drizzle-orm";
import { formatIST } from "@/lib/format";

async function getLastUpdatedTimestamp(): Promise<string> {
  try {
    const result = await db
      .select({
        maxDate: sql<Date>`MAX(${funds.lastUpdated})`
      })
      .from(funds);
    
    const maxDate = result[0]?.maxDate;
    return formatIST(maxDate);
  } catch (error) {
    console.error("Error fetching last updated timestamp for footer:", error);
    return formatIST(new Date()); // fallback to current date
  }
}

export async function Footer() {
  const lastUpdated = await getLastUpdatedTimestamp();

  return (
    <footer className="w-full border-t border-border bg-card text-card-foreground transition-colors duration-200">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Mission */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img 
                src="/logo-96.png" 
                alt="MF Compass Logo" 
                width={20} 
                height={20} 
                className="h-5 w-5 object-contain"
              />
              <span className="font-heading font-extrabold text-lg tracking-tight">
                <span className="text-primary">MF</span> Compass
              </span>
            </div>
            <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
              A free, anonymous discovery and outperformance ranking tool for Indian mutual funds. We rank funds by relative outperformance over category averages to ensure peer comparisons are fair.
            </p>
            <div className="mt-6 text-xs text-muted-foreground">
              Data last updated: <span className="font-data font-medium text-foreground">{lastUpdated}</span>
            </div>
          </div>

          {/* Explore Columns */}
          <div>
            <h3 className="font-heading font-semibold text-sm tracking-wide text-foreground uppercase">
              Explore Equity
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/funds?group=equity&category=Large%20Cap%20Fund" className="text-muted-foreground hover:text-foreground transition-colors">
                  Large Cap Funds
                </Link>
              </li>
              <li>
                <Link href="/funds?group=equity&category=Mid%20Cap%20Fund" className="text-muted-foreground hover:text-foreground transition-colors">
                  Mid Cap Funds
                </Link>
              </li>
              <li>
                <Link href="/funds?group=equity&category=Small%20Cap%20Fund" className="text-muted-foreground hover:text-foreground transition-colors">
                  Small Cap Funds
                </Link>
              </li>
              <li>
                <Link href="/funds?group=equity&category=Flexi%20Cap%20Fund" className="text-muted-foreground hover:text-foreground transition-colors">
                  Flexi Cap Funds
                </Link>
              </li>
            </ul>
          </div>

          {/* Tools Columns */}
          <div>
            <h3 className="font-heading font-semibold text-sm tracking-wide text-foreground uppercase">
              MF Compass
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/funds" className="text-muted-foreground hover:text-foreground transition-colors">
                  All Categories
                </Link>
              </li>
              <li>
                <Link href="/compare" className="text-muted-foreground hover:text-foreground transition-colors">
                  Compare Funds
                </Link>
              </li>
              <li>
                <Link href="/watchlist" className="text-muted-foreground hover:text-foreground transition-colors">
                  Watchlist
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* SEBI Disclaimer Section */}
        <div className="mt-12 border-t border-border/60 pt-8">
          <div className="rounded-xl border border-border/80 bg-background/50 p-4">
            <h4 className="font-heading font-bold text-xs tracking-wider text-foreground uppercase">
              SEBI Disclaimer & Risk Warning
            </h4>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Mutual Fund investments are subject to market risks, read all scheme related documents carefully. Past performance is not an indicator or guarantee of future returns. 
            </p>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              MF Compass is an independent research and discovery platform. The scores and rankings shown on this website are mathematically calculated based on historical NAVs relative to category averages, and are intended for educational and discovery purposes only. MF Compass does not provide investment advice, financial planning, brokerage services, or transaction execution. We do not charge fees, collect personal information, or sell user data.
            </p>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} MF Compass. Built anonymously for Indian Investors.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
