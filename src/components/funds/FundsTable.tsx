"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowUpDown, ArrowUp, ArrowDown, Heart, GitCompare } from "lucide-react";
import { AmcLogo } from "@/components/ui/AmcLogo";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useCompare } from "@/hooks/useCompare";
import { formatPercent, formatAUM, isReturnGenuine } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Fund {
  id: number;
  kuveraCode: string;
  schemeName: string;
  shortName?: string | null;
  smallScreenName?: string | null;
  isin: string | null;
  fundHouse: string | null;
  fundHouseName: string | null;
  fundCategory: string | null;
  fundType: string | null;
  lumpAvailable: string | null;
  lumpMin: string | null;
  sipAvailable: string | null;
  sipMin: string | null;
  lockInPeriod: number | null;
  currentNavDate: string | null;
  t1NavDate: string | null;
  returns1d: string | null;
  returns1w: string | null;
  returns1y: string | null;
  returns3y: string | null;
  returns5y: string | null;
  returnsInception: string | null;
  returnsDate: string | null;
  startDate: string | null;
  expenseRatio: string | null;
  expenseRatioDate: string | null;
  aum: string | null;
  fundRating: number | null;
  fundRatingDate: string | null;
  totalScore: string | null;
  scoreUpdated: string | null;
  lastUpdated: string | null;
  createdAt: string | null;
}

interface FundsTableProps {
  funds: Fund[];
}

type SortField =
  | "totalScore"
  | "schemeName"
  | "returns1d"
  | "returns1w"
  | "returns1y"
  | "returns3y"
  | "returns5y"
  | "aum";

type SortOrder = "asc" | "desc" | null;

interface SortIconProps {
  field: SortField;
  sortField: SortField;
  sortOrder: SortOrder;
}

function SortIcon({ field, sortField, sortOrder }: SortIconProps) {
  if (sortField !== field) return <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-40 hover:opacity-100 transition-opacity" />;
  if (sortOrder === "desc") return <ArrowDown className="ml-1 h-3.5 w-3.5 text-primary font-bold" />;
  if (sortOrder === "asc") return <ArrowUp className="ml-1 h-3.5 w-3.5 text-primary font-bold" />;
  return <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-40" />;
}

export function FundsTable({ funds }: FundsTableProps) {
  const { toggleWatchlist, isWatched } = useWatchlist();
  const { toggleCompare, isComparing } = useCompare();

  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  const getAriaSort = (field: SortField) => {
    if (sortField !== field) return "none";
    return sortOrder === "asc" ? "ascending" : sortOrder === "desc" ? "descending" : "none";
  };

  const handleHeaderKeyDown = (e: React.KeyboardEvent, field: SortField) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSort(field);
    }
  };

  // Reset sorting on fund count changes (i.e. category change)
  React.useEffect(() => {
    setSortField(null);
    setSortOrder(null);
  }, [funds.length]);

  const handleSort = (field: SortField) => {
    if (sortField !== field) {
      setSortField(field);
      setSortOrder("desc");
    } else {
      if (sortOrder === "desc") {
        setSortOrder("asc");
      } else if (sortOrder === "asc") {
        setSortOrder(null); // cycle to default
        setSortField(null);
      } else {
        setSortField(field);
        setSortOrder("desc");
      }
    }
  };

  const sortedFunds = useMemo(() => {
    if (!sortOrder || !sortField) {
      // Default: respect the initial sort order passed down from the parent
      return funds;
    }

    return [...funds].sort((a, b) => {
      let valA: any = a[sortField as keyof Fund];
      let valB: any = b[sortField as keyof Fund];

      // Handle numeric conversion for returns, score, aum
      if (
        sortField === "totalScore" ||
        sortField === "aum" ||
        sortField.startsWith("returns")
      ) {
        valA = parseFloat(valA || "-999999");
        valB = parseFloat(valB || "-999999");
      } else {
        // String sorting (schemeName)
        valA = (valA || "").toString().toLowerCase();
        valB = (valB || "").toString().toLowerCase();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [funds, sortField, sortOrder]);

  const renderReturnCell = (
    val: string | null,
    period: "1d" | "1w" | "1y" | "3y" | "5y",
    fund: Fund
  ) => {
    if (val === null || val === undefined) return <span className="text-muted-foreground/40 font-data">--</span>;
    const num = parseFloat(val);
    if (isNaN(num)) return <span className="text-muted-foreground/40 font-data">--</span>;

    const genuine = isReturnGenuine(val, period, fund);
    if (!genuine) return <span className="text-muted-foreground/40 font-data">--</span>;

    return (
      <span
        className={cn(
          "font-data font-semibold text-xs px-2 py-0.5 rounded",
          num > 0 
            ? "text-emerald-800 dark:text-emerald-400 bg-emerald-500/10" 
            : num < 0 
              ? "text-rose-800 dark:text-rose-400 bg-rose-500/10" 
              : "text-muted-foreground"
        )}
      >
        {formatPercent(num, true, true)}
      </span>
    );
  };

  return (
    <div className="w-full">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 transition-colors">
              <th className="pl-6 pr-2 py-3 font-semibold text-muted-foreground w-16 text-center">Rank</th>
              <th 
                className="px-2 py-3 font-semibold text-muted-foreground cursor-pointer select-none hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:bg-muted/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                onClick={() => handleSort("schemeName")}
                onKeyDown={(e) => handleHeaderKeyDown(e, "schemeName")}
                tabIndex={0}
                role="columnheader"
                aria-sort={getAriaSort("schemeName")}
              >
                <div className="flex items-center">
                  Mutual Fund <SortIcon field="schemeName" sortField={sortField as SortField} sortOrder={sortOrder} />
                </div>
              </th>
              <th 
                className="px-2 py-3 font-semibold text-muted-foreground cursor-pointer select-none hover:bg-muted/60 transition-colors text-center w-24 focus-visible:outline-none focus-visible:bg-muted/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                onClick={() => handleSort("totalScore")}
                onKeyDown={(e) => handleHeaderKeyDown(e, "totalScore")}
                tabIndex={0}
                role="columnheader"
                aria-sort={getAriaSort("totalScore")}
              >
                <div className="flex items-center justify-center">
                  Score <SortIcon field="totalScore" sortField={sortField as SortField} sortOrder={sortOrder} />
                </div>
              </th>
              <th 
                className="px-2 py-3 font-semibold text-muted-foreground cursor-pointer select-none hover:bg-muted/60 transition-colors text-center w-16 focus-visible:outline-none focus-visible:bg-muted/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                onClick={() => handleSort("returns1d")}
                onKeyDown={(e) => handleHeaderKeyDown(e, "returns1d")}
                tabIndex={0}
                role="columnheader"
                aria-sort={getAriaSort("returns1d")}
              >
                <div className="flex items-center justify-center">
                  1D <SortIcon field="returns1d" sortField={sortField as SortField} sortOrder={sortOrder} />
                </div>
              </th>
              <th 
                className="px-2 py-3 font-semibold text-muted-foreground cursor-pointer select-none hover:bg-muted/60 transition-colors text-center w-16 focus-visible:outline-none focus-visible:bg-muted/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                onClick={() => handleSort("returns1w")}
                onKeyDown={(e) => handleHeaderKeyDown(e, "returns1w")}
                tabIndex={0}
                role="columnheader"
                aria-sort={getAriaSort("returns1w")}
              >
                <div className="flex items-center justify-center">
                  1W <SortIcon field="returns1w" sortField={sortField as SortField} sortOrder={sortOrder} />
                </div>
              </th>
              <th 
                className="px-2 py-3 font-semibold text-muted-foreground cursor-pointer select-none hover:bg-muted/60 transition-colors text-center w-16 focus-visible:outline-none focus-visible:bg-muted/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                onClick={() => handleSort("returns1y")}
                onKeyDown={(e) => handleHeaderKeyDown(e, "returns1y")}
                tabIndex={0}
                role="columnheader"
                aria-sort={getAriaSort("returns1y")}
              >
                <div className="flex items-center justify-center">
                  1Y <SortIcon field="returns1y" sortField={sortField as SortField} sortOrder={sortOrder} />
                </div>
              </th>
              <th 
                className="px-2 py-3 font-semibold text-muted-foreground cursor-pointer select-none hover:bg-muted/60 transition-colors text-center w-16 focus-visible:outline-none focus-visible:bg-muted/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                onClick={() => handleSort("returns3y")}
                onKeyDown={(e) => handleHeaderKeyDown(e, "returns3y")}
                tabIndex={0}
                role="columnheader"
                aria-sort={getAriaSort("returns3y")}
              >
                <div className="flex items-center justify-center">
                  3Y <SortIcon field="returns3y" sortField={sortField as SortField} sortOrder={sortOrder} />
                </div>
              </th>
              <th 
                className="px-2 py-3 font-semibold text-muted-foreground cursor-pointer select-none hover:bg-muted/60 transition-colors text-center w-16 focus-visible:outline-none focus-visible:bg-muted/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                onClick={() => handleSort("returns5y")}
                onKeyDown={(e) => handleHeaderKeyDown(e, "returns5y")}
                tabIndex={0}
                role="columnheader"
                aria-sort={getAriaSort("returns5y")}
              >
                <div className="flex items-center justify-center">
                  5Y <SortIcon field="returns5y" sortField={sortField as SortField} sortOrder={sortOrder} />
                </div>
              </th>
              <th className="px-2 py-3 font-semibold text-muted-foreground w-12 text-center">Compare</th>
              <th className="pl-2 pr-6 py-3 font-semibold text-muted-foreground w-16 text-center">Watch</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedFunds.map((fund, index) => {
              const rank = index + 1;
              const isCompareChecked = isComparing(fund.kuveraCode);
              const isWatchChecked = isWatched(fund.kuveraCode);

              return (
                <tr 
                  key={fund.id} 
                  className="hover:bg-muted/20 transition-all group duration-150"
                >
                  {/* Rank */}
                  <td className="pl-6 pr-2 py-3 text-center font-data font-bold text-muted-foreground/80">
                    {rank}
                  </td>
                  
                  {/* Fund Name & House */}
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-3">
                      <AmcLogo fundHouse={fund.fundHouse} fundHouseName={fund.fundHouseName} size="md" />
                      <div className="flex flex-col truncate max-w-[280px] lg:max-w-[400px]">
                        <Link 
                          href={`/fund/${fund.kuveraCode}`}
                          className="font-heading font-medium text-foreground hover:text-primary transition-colors truncate"
                        >
                          {fund.schemeName}
                        </Link>
                        <span className="text-[10px] text-muted-foreground truncate mt-0.5">
                          {fund.fundHouseName} • {fund.fundType}
                        </span>
                      </div>
                    </div>
                  </td>
 
                  {/* Score */}
                  <td className="px-2 py-3 text-center">
                    <span className="inline-flex items-center justify-center rounded-md bg-primary/10 px-2 py-1 text-xs font-bold text-primary font-data border border-primary/20">
                      {parseFloat(fund.totalScore || "0").toFixed(1)}
                    </span>
                  </td>

                  {/* Returns */}
                  <td className="px-2 py-3 text-center">{renderReturnCell(fund.returns1d, "1d", fund)}</td>
                  <td className="px-2 py-3 text-center">{renderReturnCell(fund.returns1w, "1w", fund)}</td>
                  <td className="px-2 py-3 text-center">{renderReturnCell(fund.returns1y, "1y", fund)}</td>
                  <td className="px-2 py-3 text-center">{renderReturnCell(fund.returns3y, "3y", fund)}</td>
                  <td className="px-2 py-3 text-center">{renderReturnCell(fund.returns5y, "5y", fund)}</td>

                  {/* Compare Checkbox */}
                  <td className="px-2 py-3 text-center">
                    <button
                      onClick={() => toggleCompare(fund.kuveraCode, fund.shortName || fund.schemeName)}
                      className={cn(
                        "inline-flex h-4 w-4 items-center justify-center rounded-full border transition-all hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                        isCompareChecked 
                          ? "border-primary bg-primary text-primary-foreground" 
                          : "border-muted-foreground/40 bg-transparent text-transparent"
                      )}
                      aria-label={`Compare ${fund.schemeName}`}
                    >
                      <GitCompare className="h-3 w-3" />
                    </button>
                  </td>

                  {/* Watchlist Heart */}
                  <td className="pl-2 pr-6 py-3 text-center">
                    <button
                      onClick={() => toggleWatchlist(fund.kuveraCode)}
                      className="text-muted-foreground/40 hover:text-rose-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1 rounded-full p-0.5"
                      aria-label={`Watch ${fund.schemeName}`}
                    >
                      <Heart 
                        className={cn(
                          "h-4 w-4 transition-transform duration-200 active:scale-110", 
                          isWatchChecked 
                            ? "fill-rose-500 text-rose-500 opacity-100 animate-heart-pop" 
                            : "opacity-80"
                        )} 
                      />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-2.5">
        {sortedFunds.map((fund, index) => {
          const rank = index + 1;
          const isCompareChecked = isComparing(fund.kuveraCode);
          const isWatchChecked = isWatched(fund.kuveraCode);

          return (
            <div 
              key={fund.id}
              className="rounded-xl border border-border bg-card p-3 transition-all shadow-sm"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-data font-bold text-muted-foreground text-sm">
                    #{rank}
                  </span>
                  <AmcLogo fundHouse={fund.fundHouse} fundHouseName={fund.fundHouseName} size="sm" />
                  <div className="min-w-0">
                    <Link 
                      href={`/fund/${fund.kuveraCode}`}
                      className="font-heading font-semibold text-base text-foreground hover:text-primary transition-colors block truncate"
                    >
                      {fund.shortName || fund.schemeName}
                    </Link>
                    <span className="text-[10px] text-muted-foreground block truncate">
                      {fund.fundCategory}
                    </span>
                  </div>
                </div>

                {/* Score */}
                <span className="inline-flex items-center justify-center rounded-md bg-primary/10 px-2.5 py-1 text-sm font-extrabold text-primary font-data border border-primary/20 shrink-0">
                  {parseFloat(fund.totalScore || "0").toFixed(1)}
                </span>
              </div>

              {/* Top 3 returns grid */}
              <div className="grid grid-cols-3 gap-2 mt-2.5 text-center bg-muted/20 rounded-lg py-1.5 px-2">
                <div>
                  <span className="text-[9px] font-semibold text-muted-foreground block uppercase">1D</span>
                  <div className="mt-0.5">{renderReturnCell(fund.returns1d, "1d", fund)}</div>
                </div>
                <div>
                  <span className="text-[9px] font-semibold text-muted-foreground block uppercase">1Y</span>
                  <div className="mt-0.5">{renderReturnCell(fund.returns1y, "1y", fund)}</div>
                </div>
                <div>
                  <span className="text-[9px] font-semibold text-muted-foreground block uppercase">3Y</span>
                  <div className="mt-0.5">{renderReturnCell(fund.returns3y, "3y", fund)}</div>
                </div>
              </div>

              {/* Action bar */}
              <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/60">
                <div className="text-[10px] text-muted-foreground font-data">
                  AUM: {formatAUM(fund.aum)}
                </div>

                <div className="flex items-center gap-4">
                  {/* Compare Toggle */}
                  <button
                    onClick={() => toggleCompare(fund.kuveraCode, fund.shortName || fund.schemeName)}
                    className={cn(
                      "flex items-center gap-1 text-[11px] font-medium transition-colors hover:text-primary py-3 px-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                      isCompareChecked ? "text-primary" : "text-muted-foreground"
                    )}
                    aria-label={`Compare ${fund.schemeName}`}
                  >
                    <GitCompare className="h-3.5 w-3.5" />
                    <span>Compare</span>
                  </button>

                  {/* Watch Toggle */}
                  <button
                    onClick={() => toggleWatchlist(fund.kuveraCode)}
                    className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-rose-500 transition-colors py-3 px-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1"
                    aria-label={`Watch ${fund.schemeName}`}
                  >
                    <Heart 
                      className={cn(
                        "h-3.5 w-3.5 transition-transform duration-200 active:scale-110",
                        isWatchChecked 
                          ? "fill-rose-500 text-rose-500 opacity-100 animate-heart-pop" 
                          : "opacity-80"
                      )} 
                    />
                    <span>Save</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
