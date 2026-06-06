import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { funds, categoryAverages } from "@drizzle/schema";
import { eq } from "drizzle-orm";
import { formatPercent, formatINR, formatAUM, formatNAV } from "@/lib/format";
import { FundDetailActions } from "@/components/funds/FundDetailActions";
import { ArrowLeft, Calendar, Activity, Star } from "lucide-react";
import { AmcLogo } from "@/components/ui/AmcLogo";
import { cn } from "@/lib/utils";

// ISR caching: revalidate every 5 minutes
export const revalidate = 300;

interface PageProps {
  params: Promise<{ code: string }>;
}

  return null;
}

function parseFundManagers(managers: any): string[] {
  if (!managers) return [];
  if (Array.isArray(managers)) return managers.map(String);
  if (typeof managers === "string") {
    try {
      const parsed = JSON.parse(managers);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {}
    return managers.split(";").map((m: string) => m.trim()).filter(Boolean);
  }
  return [];
}

export default async function FundDetailPage({ params }: PageProps) {
  const { code } = await params;

  if (!code) notFound();

  // Fetch fund details
  const fund = await db.query.funds.findFirst({
    where: eq(funds.kuveraCode, code),
  });

  if (!fund) notFound();

  // Fetch category average returns to compute outperformance comparison
  const categoryAvg = await db.query.categoryAverages.findFirst({
    where: eq(categoryAverages.categoryName, fund.fundCategory || ""),
  });

  const managers = parseFundManagers(fund.fundManagers);

  const returnPeriods = [
    { label: "1 Day Return", key: "returns1d", catKey: "returns1d" }, // Category averages don't store 1D, we can compare fund return to 0 or leave empty
    { label: "1 Week Return", key: "returns1w", catKey: "returns1w" },
    { label: "1 Year Return", key: "returns1y", catKey: "returns1y" },
    { label: "3 Year Return", key: "returns3y", catKey: "returns3y" },
    { label: "5 Year Return", key: "returns5y", catKey: "returns5y" },
    { label: "Inception Return", key: "returnsInception", catKey: "returnsInception" },
  ] as const;

  const inflowsPaused = fund.lumpAvailable === "N" && fund.sipAvailable === "N";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Back button */}
      <Link
        href="/funds"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Rankings
      </Link>

      {/* Header Container */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm animate-in fade-in duration-200">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div className="flex items-start gap-4">
            <AmcLogo fundHouse={fund.fundHouse} fundHouseName={fund.fundHouseName} size="lg" className="mt-1 hidden sm:flex" />
            <div className="flex-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                {fund.fundCategory} • {fund.fundType}
              </span>
              <h1 className="mt-2 font-heading text-xl font-extrabold text-foreground sm:text-2xl leading-snug">
                {fund.schemeName}
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                ISIN: <span className="font-data font-semibold">{fund.isin || "--"}</span> • Kuvera: <span className="font-data font-semibold">{fund.kuveraCode}</span>
              </p>
              {Array.isArray(fund.tags) && fund.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {fund.tags.map((tag: string) => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/20 uppercase tracking-wide">
                      {tag.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                MFC Score:
              </span>
              <span className="inline-flex items-center justify-center rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-extrabold text-primary font-data border border-primary/20">
                {parseFloat(fund.totalScore || "0").toFixed(1)}
              </span>
            </div>
            
            <div className="text-left sm:text-right">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">NAV</span>
              <span className="font-data font-bold text-lg text-foreground">
                {formatNAV(fund.currentNav)}
              </span>
              <span className="text-[9px] text-muted-foreground block mt-0.5 font-data">
                As of {fund.currentNavDate ? new Date(fund.currentNavDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "--"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons (Watchlist & Compare) */}
        <div className="mt-6 pt-6 border-t border-border/60 flex items-center justify-between gap-4">
          <FundDetailActions kuveraCode={fund.kuveraCode} schemeName={fund.shortName || fund.schemeName} />
          {inflowsPaused && (
            <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-2.5 py-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 border border-rose-500/15 uppercase tracking-wide">
              Inflows Paused
            </span>
          )}
        </div>
      </div>

      {/* Returns Grid & Outperformance comparisons */}
      <h2 className="font-heading text-lg font-bold text-foreground mt-10 mb-4">
        Returns & Outperformance Analysis
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {returnPeriods.map((period) => {
          const fundReturn = fund[period.key as keyof typeof fund] ? parseFloat(fund[period.key as keyof typeof fund] as string) : null;
          
          // Category averages don't have 1D or Inception return values (inception varies by fund)
          const catReturn = (period.catKey !== "returns1d" && period.catKey !== "returnsInception" && categoryAvg)
            ? (categoryAvg[period.catKey as keyof typeof categoryAvg] ? parseFloat(categoryAvg[period.catKey as keyof typeof categoryAvg] as string) : null)
            : null;

          const outperformance = (fundReturn !== null && catReturn !== null) ? (fundReturn - catReturn) : null;

          return (
            <div key={period.key} className="rounded-xl border border-border bg-card p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {period.label}
                </span>
                <div className="mt-2 font-data font-extrabold text-lg text-foreground">
                  {formatPercent(fundReturn, true)}
                </div>
              </div>

              {/* Peer average comparison info */}
              <div className="mt-4 pt-3 border-t border-border/40 text-[10px] text-muted-foreground leading-relaxed">
                {catReturn !== null ? (
                  <>
                    <div>Cat. Average: <span className="font-data text-foreground/80">{formatPercent(catReturn, false)}</span></div>
                    <div className="mt-1">
                      MFC Alpha:{" "}
                      <span className={cn(
                        "font-data font-bold",
                        outperformance! > 0 
                          ? "text-emerald-600 dark:text-emerald-400" 
                          : outperformance! < 0 
                            ? "text-rose-600 dark:text-rose-400" 
                            : "text-muted-foreground"
                      )}>
                        {formatPercent(outperformance, true)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="italic text-muted-foreground/60">No peer benchmark</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Left Column: Fund Metadata */}
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4 shadow-sm">
          <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5 border-b border-border/60 pb-2.5">
            <Calendar className="h-4 w-4 text-primary" /> Fund Statistics
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Fund House</span>
              <span className="font-medium text-foreground mt-0.5 block">{fund.fundHouseName || "--"}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total AUM</span>
              <span className="font-data font-bold text-foreground mt-0.5 block">{formatAUM(fund.aum)}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Launch Date</span>
              <span className="font-data font-medium text-foreground mt-0.5 block">
                {fund.startDate ? new Date(fund.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "--"}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Expense Ratio</span>
              <span className="font-data font-bold text-foreground mt-0.5 block">
                {fund.expenseRatio ? `${fund.expenseRatio}%` : "--"}
              </span>
            </div>
          </div>

          <div className="mt-2 text-xs">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Fund Managers</span>
            {managers.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {managers.map((manager) => (
                  <span key={manager} className="rounded-full bg-accent px-3 py-1 text-[10px] font-medium text-foreground border border-border/40">
                    {manager}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground italic">No manager details listed</span>
            )}
          </div>
        </div>

        {/* Right Column: Risk & Options */}
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4 shadow-sm">
          <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5 border-b border-border/60 pb-2.5">
            <Activity className="h-4 w-4 text-primary" /> Risk & Purchase parameters
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">CRISIL Rating</span>
              <span className="font-bold text-foreground mt-0.5 block">
                {fund.crisilRating ? `★ ${fund.crisilRating}` : "--"}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Star Rating</span>
              <div className="flex items-center mt-0.5">
                {fund.fundRating ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-4 w-4",
                        i < fund.fundRating! 
                          ? "fill-amber-400 text-amber-400" 
                          : "fill-muted text-muted"
                      )}
                    />
                  ))
                ) : (
                  <span className="font-bold text-foreground">--</span>
                )}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Lock-In Period</span>
              <span className="font-data font-bold text-foreground mt-0.5 block">
                {fund.lockInPeriod ? `${fund.lockInPeriod} days` : "No Lock-in"}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Volatility (Std Dev)</span>
              <span className="font-data font-bold text-foreground mt-0.5 block">
                {fund.volatility ? parseFloat(fund.volatility).toFixed(2) : "--"}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Portfolio Turnover</span>
              <span className="font-data font-medium text-foreground mt-0.5 block">
                {fund.portfolioTurnover ? `${(parseFloat(fund.portfolioTurnover) * 100).toFixed(0)}%` : "--"}
              </span>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-border/40 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Min Lump Sum</span>
              <span className="font-data font-bold text-foreground mt-0.5 block">
                {fund.lumpAvailable === "Y" ? formatINR(fund.lumpMin) : "Not available"}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Min Monthly SIP</span>
              <span className="font-data font-bold text-foreground mt-0.5 block">
                {fund.sipAvailable === "Y" ? formatINR(fund.sipMin) : "Not available"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Investment Objective */}
      <div className="rounded-xl border border-border bg-card p-6 mt-8 shadow-sm">
        <h3 className="font-heading font-bold text-sm text-foreground border-b border-border/60 pb-2.5 mb-4">
          Investment Objective
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {fund.investmentObjective || "No investment objective details provided by the AMC."}
        </p>
      </div>

      {/* Similar Funds */}
      {Array.isArray(fund.comparison) && fund.comparison.length > 0 && (
        <div className="mt-8">
          <h2 className="font-heading text-lg font-bold text-foreground mb-4">
            Similar Funds
          </h2>
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 font-semibold text-muted-foreground">Fund Name</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground text-center">AUM (Cr)</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground text-center">Exp. Ratio</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground text-center">1Y</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground text-center">3Y</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {fund.comparison.map((peer: any) => (
                  <tr key={peer.code} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/fund/${peer.code}`}
                        className="font-heading font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {peer.short_name || peer.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-center font-data text-muted-foreground">
                      {formatAUM(peer.aum?.toString() || "0")}
                    </td>
                    <td className="px-4 py-3 text-center font-data text-muted-foreground">
                      {peer.expense_ratio ? `${peer.expense_ratio}%` : "--"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        "font-data font-semibold",
                        peer["1y"] > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      )}>
                        {peer["1y"] ? formatPercent(peer["1y"]) : "--"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        "font-data font-semibold",
                        peer["3y"] > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      )}>
                        {peer["3y"] ? formatPercent(peer["3y"]) : "--"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
