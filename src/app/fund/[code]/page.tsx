import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { funds, categoryAverages } from "@drizzle/schema";
import { eq, and, gt, sql } from "drizzle-orm";
import {
  formatPercent,
  formatINR,
  formatAUM,
  formatNAV,
  isReturnGenuine,
} from "@/lib/format";
import { FundDetailActions } from "@/components/funds/FundDetailActions";
import { ArrowLeft, Calendar, Activity, Star } from "lucide-react";
import { AmcLogo } from "@/components/ui/AmcLogo";
import { getFund } from "@/lib/funds/queries";
import { cn } from "@/lib/utils";

// ISR caching: revalidate every 5 minutes
export const revalidate = 300;

interface PageProps {
  params: Promise<{ code: string }>;
}

interface PeerFund {
  code: string;
  name: string;
  short_name?: string | null;
  "1y"?: number | null;
  "3y"?: number | null;
  expense_ratio?: number | null;
  aum?: number | null;
}

function parseFundManagers(managers: unknown): string[] {
  if (!managers) return [];
  if (Array.isArray(managers)) return managers.map(String);
  if (typeof managers === "string") {
    try {
      const parsed = JSON.parse(managers);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {}
    return managers
      .split(";")
      .map((m: string) => m.trim())
      .filter(Boolean);
  }
  return [];
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { code } = await params;
  const fund = code ? await getFund(code) : undefined;
  if (!fund) return { title: "Fund not found" };

  const score = fund.totalScore
    ? `Outperformance score ${Number(fund.totalScore).toFixed(1)}. `
    : "";
  const description = `${fund.schemeName} by ${fund.fundHouseName ?? "its fund house"}, ${fund.fundCategory ?? "mutual fund"}. ${score}Returns compared with the category average across 1, 3 and 5 years.`;

  return {
    title: fund.schemeName,
    description,
    alternates: { canonical: `/fund/${fund.kuveraCode}` },
    openGraph: { title: fund.schemeName, description },
  };
}

export default async function FundDetailPage({ params }: PageProps) {
  const { code } = await params;

  if (!code) notFound();

  const fund = await getFund(code);

  if (!fund) notFound();

  // Fetch category average returns to compute outperformance comparison
  const categoryAvg = await db.query.categoryAverages.findFirst({
    where: eq(categoryAverages.categoryName, fund.fundCategory || ""),
  });

  // Calculate the rank of the fund in its category based on totalScore
  let rank: number | null = null;
  if (fund.totalScore) {
    const rankResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(funds)
      .where(
        and(
          eq(funds.fundCategory, fund.fundCategory || ""),
          gt(funds.totalScore, fund.totalScore),
        ),
      );
    rank = Number(rankResult[0]?.count || 0) + 1;
  }

  const managers = parseFundManagers(fund.fundManagers);

  const returnPeriods = [
    { label: "1 Day Return", key: "returns1d", catKey: "returns1d" }, // Category averages don't store 1D, we can compare fund return to 0 or leave empty
    { label: "1 Week Return", key: "returns1w", catKey: "returns1w" },
    { label: "1 Year Return", key: "returns1y", catKey: "returns1y" },
    { label: "3 Year Return", key: "returns3y", catKey: "returns3y" },
    { label: "5 Year Return", key: "returns5y", catKey: "returns5y" },
    {
      label: "Inception Return",
      key: "returnsInception",
      catKey: "returnsInception",
    },
  ] as const;

  const inflowsPaused = fund.lumpAvailable === "N" && fund.sipAvailable === "N";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Back button */}
      <Link
        href="/funds"
        className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Rankings
      </Link>

      {/* Header Container */}
      <div className="animate-in fade-in rounded-xl border border-border bg-card p-6 shadow-sm duration-200">
        {/* Main info row */}
        <div className="flex items-start gap-4">
          <AmcLogo
            fundHouse={fund.fundHouse}
            fundHouseName={fund.fundHouseName}
            size="lg"
            className="mt-1.5 flex shrink-0"
          />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
                {fund.fundCategory} • {fund.fundType}
              </span>
              {rank !== null && (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-primary uppercase">
                  #{rank}
                </span>
              )}
            </div>
            <h1 className="font-heading text-xl leading-tight font-extrabold text-foreground sm:text-2xl">
              {fund.schemeName}
            </h1>
            {Array.isArray(fund.tags) && fund.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {fund.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-primary uppercase"
                  >
                    {tag.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            )}
          </div>
          {/* Score + NAV: desktop only – sits beside the content */}
          <div className="hidden shrink-0 flex-col items-end gap-3.5 border-l border-border/60 pl-6 md:flex">
            {/* NAV at top */}
            <div className="flex items-baseline gap-2">
              <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                NAV
              </span>
              <div className="flex flex-col items-end text-right">
                <span className="font-data text-xl leading-none font-extrabold text-foreground">
                  {formatNAV(fund.currentNav)}
                </span>
                <span className="font-data mt-0.5 block text-[9px] text-muted-foreground">
                  {fund.currentNavDate
                    ? new Date(fund.currentNavDate).toLocaleDateString(
                        "en-IN",
                        { day: "2-digit", month: "short", year: "numeric" },
                      )
                    : "--"}
                </span>
              </div>
            </div>

            {/* Score below NAV */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Score
              </span>
              <span className="font-data inline-flex items-center justify-center rounded-lg border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-extrabold text-primary">
                {parseFloat(fund.totalScore || "0").toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Score + NAV: mobile only – compact horizontal row */}
        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-4 md:hidden">
          {/* NAV on left */}
          <div className="text-left">
            <div className="flex items-baseline justify-start gap-1.5">
              <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                NAV
              </span>
              <span className="font-data text-lg leading-none font-extrabold text-foreground">
                {formatNAV(fund.currentNav)}
              </span>
            </div>
            <span className="font-data mt-0.5 block text-[9px] text-muted-foreground">
              {fund.currentNavDate
                ? new Date(fund.currentNavDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "--"}
            </span>
          </div>

          {/* Score on right */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              Score
            </span>
            <span className="font-data inline-flex items-center justify-center rounded-lg border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-extrabold text-primary">
              {parseFloat(fund.totalScore || "0").toFixed(1)}
            </span>
          </div>
        </div>

        {/* Action Buttons (Watchlist & Compare) */}
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-4">
          {/* Left side: ISIN + Kuvera Code (desktop only) */}
          <div className="hidden items-center text-[11px] font-medium text-muted-foreground md:flex">
            <span>
              ISIN:{" "}
              <span className="font-data font-semibold text-foreground/80">
                {fund.isin || "--"}
              </span>
            </span>
            <span className="mx-2 text-border">•</span>
            <span>
              Kuvera:{" "}
              <span className="font-data font-semibold text-foreground/80">
                {fund.kuveraCode}
              </span>
            </span>
          </div>

          {/* Right side: Action buttons */}
          <div className="ml-auto flex items-center gap-3">
            {inflowsPaused && (
              <span className="inline-flex items-center gap-1 rounded border border-rose-500/15 bg-rose-500/10 px-2.5 py-1 text-[10px] font-bold tracking-wide text-rose-600 uppercase dark:text-rose-400">
                Inflows Paused
              </span>
            )}
            <FundDetailActions
              kuveraCode={fund.kuveraCode}
              schemeName={fund.shortName || fund.schemeName}
            />
          </div>
        </div>
      </div>

      {/* Returns Grid & Outperformance comparisons */}
      <h2 className="mt-10 mb-4 font-heading text-lg font-bold text-foreground">
        Returns & Outperformance Analysis
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {returnPeriods.map((period) => {
          const fundReturn = fund[period.key as keyof typeof fund]
            ? parseFloat(fund[period.key as keyof typeof fund] as string)
            : null;

          // Category averages don't have 1D or Inception return values
          const catReturn =
            period.catKey !== "returns1d" &&
            period.catKey !== "returnsInception" &&
            categoryAvg
              ? categoryAvg[period.catKey as keyof typeof categoryAvg]
                ? parseFloat(
                    categoryAvg[
                      period.catKey as keyof typeof categoryAvg
                    ] as string,
                  )
                : null
              : null;

          const outperformance =
            fundReturn !== null && catReturn !== null
              ? fundReturn - catReturn
              : null;

          const displayKeyMap: Record<
            string,
            "1d" | "1w" | "1y" | "3y" | "5y"
          > = {
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

          const displayValue = isGenuine
            ? formatPercent(fundReturn, true, true)
            : "--";

          return (
            <div
              key={period.key}
              className="flex flex-col justify-between rounded-xl border border-border bg-card p-3.5 shadow-sm transition-all hover:shadow-md"
            >
              <div>
                <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  {period.label}
                </span>
                <div
                  className={cn(
                    "mt-1 text-lg",
                    isGenuine
                      ? "font-data font-extrabold text-foreground"
                      : "font-sans text-muted-foreground/45",
                  )}
                >
                  {displayValue}
                </div>
              </div>

              {/* Peer average comparison info */}
              <div className="mt-4 flex min-h-[42px] flex-col justify-center border-t border-border/40 pt-3 text-[10px] text-muted-foreground">
                {catReturn !== null ? (
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span>Cat. Average</span>
                      <span className="font-data text-foreground/80">
                        {formatPercent(catReturn, false)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>MFC Alpha</span>
                      <span
                        className={cn(
                          "font-data font-bold",
                          outperformance! > 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : outperformance! < 0
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-muted-foreground",
                        )}
                      >
                        {formatPercent(outperformance, true, true)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-1 text-center text-muted-foreground/50 italic">
                    No peer benchmark
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Parameters */}
      <div className="mt-10 grid grid-cols-1 items-stretch gap-6 md:grid-cols-2">
        {/* Left Column: Fund Metadata */}
        <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="flex items-center gap-1.5 border-b border-border/60 pb-2.5 font-heading text-sm font-bold text-foreground">
            <Calendar className="h-4 w-4 text-primary" /> Fund Statistics
          </h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs">
            <div>
              <span className="block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Fund House
              </span>
              <span
                className={cn(
                  "mt-0.5 block truncate",
                  fund.fundHouseName
                    ? "font-medium text-foreground"
                    : "font-sans text-muted-foreground/45",
                )}
                title={fund.fundHouseName || ""}
              >
                {fund.fundHouseName || "--"}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Total AUM
              </span>
              <span className="font-data mt-0.5 block font-bold text-foreground">
                {formatAUM(fund.aum)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Launch Date
              </span>
              <span
                className={cn(
                  "mt-0.5 block",
                  fund.startDate
                    ? "font-data font-medium text-foreground"
                    : "font-sans text-muted-foreground/45",
                )}
              >
                {fund.startDate
                  ? new Date(fund.startDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "--"}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Expense Ratio
              </span>
              <span
                className={cn(
                  "mt-0.5 block",
                  fund.expenseRatio
                    ? "font-data font-bold text-foreground"
                    : "font-sans text-muted-foreground/45",
                )}
              >
                {fund.expenseRatio ? `${fund.expenseRatio}%` : "--"}
              </span>
            </div>
          </div>

          <div className="mt-auto border-t border-border/40 pt-4 text-xs">
            <span className="mb-1.5 block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              Fund Managers
            </span>
            {managers.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {managers.map((manager) => (
                  <span
                    key={manager}
                    className="rounded-full border border-border/40 bg-accent px-2.5 py-0.5 text-[10px] font-medium text-foreground"
                  >
                    {manager}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-[11px] text-muted-foreground italic">
                No manager details listed
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Risk & Options */}
        <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="flex items-center gap-1.5 border-b border-border/60 pb-2.5 font-heading text-sm font-bold text-foreground">
            <Activity className="h-4 w-4 text-primary" /> Risk & Purchase
            parameters
          </h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs">
            <div>
              <span className="block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                CRISIL Rating
              </span>
              <span
                className={cn(
                  "mt-0.5 block font-bold",
                  fund.crisilRating
                    ? "text-foreground"
                    : "font-sans text-muted-foreground/45",
                )}
              >
                {fund.crisilRating ? `★ ${fund.crisilRating}` : "--"}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Star Rating
              </span>
              <div className="mt-0.5 flex h-4 items-center">
                {fund.fundRating ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-3.5 w-3.5",
                        i < fund.fundRating!
                          ? "fill-foreground text-foreground"
                          : "fill-muted text-muted",
                      )}
                    />
                  ))
                ) : (
                  <span className="font-sans font-bold text-muted-foreground/45">
                    --
                  </span>
                )}
              </div>
            </div>
            <div>
              <span className="block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Lock-In Period
              </span>
              <span className="font-data mt-0.5 block font-bold text-foreground">
                {fund.lockInPeriod ? `${fund.lockInPeriod} days` : "No Lock-in"}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Volatility (Std Dev)
              </span>
              <span
                className={cn(
                  "mt-0.5 block",
                  fund.volatility
                    ? "font-data font-bold text-foreground"
                    : "font-sans text-muted-foreground/45",
                )}
              >
                {fund.volatility
                  ? parseFloat(fund.volatility).toFixed(2)
                  : "--"}
              </span>
            </div>
            <div className="col-span-2">
              <span className="block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Portfolio Turnover
              </span>
              <span
                className={cn(
                  "mt-0.5 block",
                  fund.portfolioTurnover
                    ? "font-data font-medium text-foreground"
                    : "font-sans text-muted-foreground/45",
                )}
              >
                {fund.portfolioTurnover
                  ? `${(parseFloat(fund.portfolioTurnover) * 100).toFixed(0)}%`
                  : "--"}
              </span>
            </div>
          </div>

          <div className="mt-auto grid grid-cols-2 gap-4 border-t border-border/40 pt-4 text-xs">
            <div>
              <span className="block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Min Lump Sum
              </span>
              <span className="font-data mt-0.5 block font-bold text-foreground">
                {fund.lumpAvailable === "Y"
                  ? formatINR(fund.lumpMin)
                  : "Not available"}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Min Monthly SIP
              </span>
              <span className="font-data mt-0.5 block font-bold text-foreground">
                {fund.sipAvailable === "Y"
                  ? formatINR(fund.sipMin)
                  : "Not available"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Investment Objective */}
      <div className="mt-10 rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 border-b border-border/60 pb-2.5 font-heading text-sm font-bold text-foreground">
          Investment Objective
        </h3>
        <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
          {fund.investmentObjective ||
            "No investment objective details provided by the AMC."}
        </p>
      </div>

      {/* Similar Funds */}
      {Array.isArray(fund.comparison) && fund.comparison.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 font-heading text-lg font-bold text-foreground">
            Similar Funds
          </h2>
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="py-3 pr-4 pl-6 font-semibold text-muted-foreground">
                    Fund Name
                  </th>
                  <th className="hidden px-4 py-3 text-center font-semibold text-muted-foreground sm:table-cell">
                    1Y
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-muted-foreground">
                    3Y
                  </th>
                  <th className="hidden px-4 py-3 text-center font-semibold text-muted-foreground sm:table-cell">
                    Exp. Ratio
                  </th>
                  <th className="hidden py-3 pr-6 pl-4 text-center font-semibold text-muted-foreground sm:table-cell">
                    AUM (Cr)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {Array.isArray(fund.comparison) &&
                  (fund.comparison as unknown as PeerFund[]).map((peer) => (
                    <tr
                      key={peer.code}
                      className="transition-colors hover:bg-muted/20"
                    >
                      <td className="py-3 pr-4 pl-6">
                        <Link
                          href={`/fund/${peer.code}`}
                          className="font-heading text-xs font-medium text-foreground transition-colors hover:text-primary sm:text-sm"
                        >
                          {peer.short_name || peer.name}
                        </Link>
                      </td>
                      <td className="hidden px-4 py-3 text-center text-xs sm:table-cell sm:text-sm">
                        <span
                          className={cn(
                            "font-data font-semibold",
                            (peer["1y"] ?? 0) > 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : (peer["1y"] ?? 0) < 0
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-muted-foreground",
                          )}
                        >
                          {peer["1y"] ? formatPercent(peer["1y"]) : "--"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs sm:text-sm">
                        <span
                          className={cn(
                            "font-data font-semibold",
                            (peer["3y"] ?? 0) > 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : (peer["3y"] ?? 0) < 0
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-muted-foreground",
                          )}
                        >
                          {peer["3y"] ? formatPercent(peer["3y"]) : "--"}
                        </span>
                      </td>
                      <td className="font-data hidden px-4 py-3 text-center text-xs text-muted-foreground sm:table-cell sm:text-sm">
                        {peer.expense_ratio ? `${peer.expense_ratio}%` : "--"}
                      </td>
                      <td className="font-data hidden py-3 pr-6 pl-4 text-center text-xs text-muted-foreground sm:table-cell sm:text-sm">
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
