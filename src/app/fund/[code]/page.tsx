import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { funds, categoryAverages } from "@drizzle/schema";
import { eq } from "drizzle-orm";
import { formatPercent, formatINR, formatAUM, formatNAV, isReturnGenuine } from "@/lib/format";
import { FundDetailActions } from "@/components/funds/FundDetailActions";
import { ArrowLeft, Calendar, Activity, Star } from "lucide-react";
import { AmcLogo } from "@/components/ui/AmcLogo";
import { cn } from "@/lib/utils";

// ISR caching: revalidate every 5 minutes
export const revalidate = 300;

interface PageProps {
  params: Promise<{ code: string }>;
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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Back button */}
      <Link
        href="/funds"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Rankings
      </Link>

      {/* Header Container */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm animate-in fade-in duration-200">
        {/* Main info row */}
        <div className="flex items-start gap-4">
          <AmcLogo fundHouse={fund.fundHouse} fundHouseName={fund.fundHouseName} size="lg" className="mt-1.5 shrink-0 flex" />
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                {fund.fundCategory} • {fund.fundType}
              </span>
            </div>
            <h1 className="font-heading text-xl font-extrabold text-foreground sm:text-2xl leading-tight">
              {fund.schemeName}
            </h1>
            {Array.isArray(fund.tags) && fund.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {fund.tags.map((tag: string) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary border border-primary/20 uppercase tracking-wide">
                    {tag.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              ISIN: <span className="font-data font-semibold text-foreground/80">{fund.isin || "--"}</span>
              <span className="mx-2 text-border">•</span>
              Kuvera: <span className="font-data font-semibold text-foreground/80">{fund.kuveraCode}</span>
            </p>
          </div>
          {/* Score + NAV: desktop only – sits beside the content */}
          <div className="hidden md:flex flex-col items-end gap-3 shrink-0 pl-6 border-l border-border/60">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">MFC Score</span>
              <span className="inline-flex items-center justify-center rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-extrabold text-primary font-data border border-primary/20">
                {parseFloat(fund.totalScore || "0").toFixed(1)}
              </span>
            </div>
            <div className="text-right space-y-0.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">NAV</span>
              <span className="font-data font-extrabold text-xl text-foreground block leading-none">
                {formatNAV(fund.currentNav)}
              </span>
              <span className="text-[9px] text-muted-foreground block font-data">
                {fund.currentNavDate ? new Date(fund.currentNavDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "--"}
              </span>
            </div>
          </div>
        </div>

        {/* Score + NAV: mobile only – compact horizontal row */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/60 md:hidden">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">MFC Score</span>
            <span className="inline-flex items-center justify-center rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-extrabold text-primary font-data border border-primary/20">
              {parseFloat(fund.totalScore || "0").toFixed(1)}
            </span>
          </div>
          <div className="text-right">
            <div className="flex items-baseline gap-1.5 justify-end">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">NAV</span>
              <span className="font-data font-extrabold text-lg text-foreground leading-none">{formatNAV(fund.currentNav)}</span>
            </div>
            <span className="text-[9px] text-muted-foreground block font-data">
              {fund.currentNavDate ? new Date(fund.currentNavDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "--"}
            </span>
          </div>
        </div>

        {/* Action Buttons (Watchlist & Compare) */}
        <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-end gap-3">
          {inflowsPaused && (
            <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-2.5 py-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 border border-rose-500/15 uppercase tracking-wide">
              Inflows Paused
            </span>
          )}
          <FundDetailActions kuveraCode={fund.kuveraCode} schemeName={fund.shortName || fund.schemeName} />
        </div>
      </div>

      {/* Returns Grid & Outperformance comparisons */}
      <h2 className="font-heading text-lg font-bold text-foreground mt-10 mb-4">
        Returns & Outperformance Analysis
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {returnPeriods.map((period) => {
          const fundReturn = fund[period.key as keyof typeof fund] ? parseFloat(fund[period.key as keyof typeof fund] as string) : null;
          
          // Category averages don't have 1D or Inception return values
          const catReturn = (period.catKey !== "returns1d" && period.catKey !== "returnsInception" && categoryAvg)
            ? (categoryAvg[period.catKey as keyof typeof categoryAvg] ? parseFloat(categoryAvg[period.catKey as keyof typeof categoryAvg] as string) : null)
            : null;

          const outperformance = (fundReturn !== null && catReturn !== null) ? (fundReturn - catReturn) : null;

          const displayKeyMap: Record<string, "1d" | "1w" | "1y" | "3y" | "5y"> = {
            returns1d: "1d",
            returns1w: "1w",
            returns1y: "1y",
            returns3y: "3y",
            returns5y: "5y",
          };
          const periodCode = displayKeyMap[period.key];
          const isGenuine = periodCode
            ? isReturnGenuine(fundReturn, periodCode, {
                returns1d: fund.returns1d,
                returns1w: fund.returns1w,
                returns1y: fund.returns1y,
                returns3y: fund.returns3y,
                returns5y: fund.returns5y,
              })
            : fundReturn !== null;

          const displayValue = isGenuine ? formatPercent(fundReturn, true, true) : "--";

          return (
            <div key={period.key} className="rounded-xl border border-border bg-card p-3.5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {period.label}
                </span>
                <div className="mt-1 font-data font-extrabold text-lg text-foreground">
                  {displayValue}
                </div>
              </div>

              {/* Peer average comparison info */}
              <div className="mt-4 pt-3 border-t border-border/40 text-[10px] text-muted-foreground min-h-[42px] flex flex-col justify-center">
                {catReturn !== null ? (
                  <div className="space-y-0.5">
                    <div className="flex justify-between items-center">
                      <span>Cat. Average</span>
                      <span className="font-data text-foreground/80">{formatPercent(catReturn, false)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>MFC Alpha</span>
                      <span className={cn(
                        "font-data font-bold",
                        outperformance! > 0 
                          ? "text-emerald-600 dark:text-emerald-400" 
                          : outperformance! < 0 
                            ? "text-rose-600 dark:text-rose-400" 
                            : "text-muted-foreground"
                      )}>
                        {formatPercent(outperformance, true, true)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="italic text-muted-foreground/50 text-center py-1">No peer benchmark</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 items-stretch">
        {/* Left Column: Fund Metadata */}
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-5 shadow-sm">
          <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5 border-b border-border/60 pb-2.5">
            <Calendar className="h-4 w-4 text-primary" /> Fund Statistics
          </h3>
          <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Fund House</span>
              <span className="font-medium text-foreground mt-0.5 block truncate" title={fund.fundHouseName || ""}>
                {fund.fundHouseName || "--"}
              </span>
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

          <div className="mt-auto pt-4 border-t border-border/40 text-xs">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Fund Managers</span>
            {managers.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {managers.map((manager) => (
                  <span key={manager} className="rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-medium text-foreground border border-border/40">
                    {manager}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground italic text-[11px]">No manager details listed</span>
            )}
          </div>
        </div>

        {/* Right Column: Risk & Options */}
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-5 shadow-sm">
          <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5 border-b border-border/60 pb-2.5">
            <Activity className="h-4 w-4 text-primary" /> Risk & Purchase parameters
          </h3>
          <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">CRISIL Rating</span>
              <span className="font-bold text-foreground mt-0.5 block">
                {fund.crisilRating ? `★ ${fund.crisilRating}` : "--"}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Star Rating</span>
              <div className="flex items-center mt-0.5 h-4">
                {fund.fundRating ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-3.5 w-3.5",
                        i < fund.fundRating! 
                          ? "fill-foreground text-foreground" 
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
            <div className="col-span-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Portfolio Turnover</span>
              <span className="font-data font-medium text-foreground mt-0.5 block">
                {fund.portfolioTurnover ? `${(parseFloat(fund.portfolioTurnover) * 100).toFixed(0)}%` : "--"}
              </span>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-border/40 grid grid-cols-2 gap-4 text-xs">
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
      <div className="rounded-xl border border-border bg-card p-6 mt-10 shadow-sm">
        <h3 className="font-heading font-bold text-sm text-foreground border-b border-border/60 pb-2.5 mb-4">
          Investment Objective
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {fund.investmentObjective || "No investment objective details provided by the AMC."}
        </p>
      </div>

      {/* Similar Funds */}
      {Array.isArray(fund.comparison) && fund.comparison.length > 0 && (
        <div className="mt-10">
          <h2 className="font-heading text-lg font-bold text-foreground mb-4">
            Similar Funds
          </h2>
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="pl-6 pr-4 py-3 font-semibold text-muted-foreground">Fund Name</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground text-center hidden sm:table-cell">1Y</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground text-center">3Y</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground text-center hidden sm:table-cell">Exp. Ratio</th>
                  <th className="pl-4 pr-6 py-3 font-semibold text-muted-foreground text-center hidden sm:table-cell">AUM (Cr)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {fund.comparison.map((peer: any) => (
                  <tr key={peer.code} className="hover:bg-muted/20 transition-colors">
                    <td className="pl-6 pr-4 py-3">
                      <Link
                        href={`/fund/${peer.code}`}
                        className="font-heading font-medium text-foreground hover:text-primary transition-colors text-xs sm:text-sm"
                      >
                        {peer.short_name || peer.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-center text-xs sm:text-sm hidden sm:table-cell">
                      <span className={cn(
                        "font-data font-semibold",
                        peer["1y"] > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      )}>
                        {peer["1y"] ? formatPercent(peer["1y"]) : "--"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs sm:text-sm">
                      <span className={cn(
                        "font-data font-semibold",
                        peer["3y"] > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      )}>
                        {peer["3y"] ? formatPercent(peer["3y"]) : "--"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-data text-muted-foreground text-xs sm:text-sm hidden sm:table-cell">
                      {peer.expense_ratio ? `${peer.expense_ratio}%` : "--"}
                    </td>
                    <td className="pl-4 pr-6 py-3 text-center font-data text-muted-foreground text-xs sm:text-sm hidden sm:table-cell">
                      {formatAUM(peer.aum?.toString() || "0")}
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
