"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowUpDown, ArrowUp, ArrowDown, Heart, GitCompare } from "lucide-react";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useCompare } from "@/hooks/useCompare";
import { formatPercent, formatAUM } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Fund {
  id: number;
  kuveraCode: string;
  schemeName: string;
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

  const getAmcInitials = (name: string | null) => {
    if (!name) return "MF";
    const clean = name.replace(/mutual\s+fund/i, "").trim();
    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  const getAmcColorClass = (name: string | null) => {
    if (!name) return "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
    const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/40",
      "bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200/50 dark:border-teal-900/40",
      "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/40",
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-900/40",
      "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200/50 dark:border-orange-900/40",
    ];
    return colors[hash % colors.length];
  };

  const renderReturnCell = (val: string | null) => {
    if (val === null || val === undefined) return <span className="text-muted-foreground/40 font-data">--</span>;
    const num = parseFloat(val);
    if (isNaN(num)) return <span className="text-muted-foreground/40 font-data">--</span>;

    return (
      <span
        className={cn(
          "font-data font-semibold text-xs px-2 py-0.5 rounded",
          num > 0 
            ? "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10" 
            : num < 0 
              ? "text-rose-700 dark:text-rose-400 bg-rose-500/10" 
              : "text-muted-foreground"
        )}
      >
        {formatPercent(num)}
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
              <th className="px-2 py-3 font-semibold text-muted-foreground w-12 text-center">Rank</th>
              <th 
                className="px-2 py-3 font-semibold text-muted-foreground cursor-pointer select-none hover:bg-muted/60 transition-colors"
                onClick={() => handleSort("schemeName")}
              >
                <div className="flex items-center">
                  Mutual Fund <SortIcon field="schemeName" sortField={sortField as SortField} sortOrder={sortOrder} />
                </div>
              </th>
              <th 
                className="px-2 py-3 font-semibold text-muted-foreground cursor-pointer select-none hover:bg-muted/60 transition-colors text-center w-24"
                onClick={() => handleSort("totalScore")}
              >
                <div className="flex items-center justify-center">
                  MFC Score <SortIcon field="totalScore" sortField={sortField as SortField} sortOrder={sortOrder} />
                </div>
              </th>
              <th 
                className="px-2 py-3 font-semibold text-muted-foreground cursor-pointer select-none hover:bg-muted/60 transition-colors text-center w-16"
                onClick={() => handleSort("returns1d")}
              >
                <div className="flex items-center justify-center">
                  1D <SortIcon field="returns1d" sortField={sortField as SortField} sortOrder={sortOrder} />
                </div>
              </th>
              <th 
                className="px-2 py-3 font-semibold text-muted-foreground cursor-pointer select-none hover:bg-muted/60 transition-colors text-center w-16"
                onClick={() => handleSort("returns1w")}
              >
                <div className="flex items-center justify-center">
                  1W <SortIcon field="returns1w" sortField={sortField as SortField} sortOrder={sortOrder} />
                </div>
              </th>
              <th 
                className="px-2 py-3 font-semibold text-muted-foreground cursor-pointer select-none hover:bg-muted/60 transition-colors text-center w-16"
                onClick={() => handleSort("returns1y")}
              >
                <div className="flex items-center justify-center">
                  1Y <SortIcon field="returns1y" sortField={sortField as SortField} sortOrder={sortOrder} />
                </div>
              </th>
              <th 
                className="px-2 py-3 font-semibold text-muted-foreground cursor-pointer select-none hover:bg-muted/60 transition-colors text-center w-16"
                onClick={() => handleSort("returns3y")}
              >
                <div className="flex items-center justify-center">
                  3Y <SortIcon field="returns3y" sortField={sortField as SortField} sortOrder={sortOrder} />
                </div>
              </th>
              <th 
                className="px-2 py-3 font-semibold text-muted-foreground cursor-pointer select-none hover:bg-muted/60 transition-colors text-center w-16"
                onClick={() => handleSort("returns5y")}
              >
                <div className="flex items-center justify-center">
                  5Y <SortIcon field="returns5y" sortField={sortField as SortField} sortOrder={sortOrder} />
                </div>
              </th>
              <th className="px-2 py-3 font-semibold text-muted-foreground w-12 text-center">Compare</th>
              <th className="px-2 py-3 font-semibold text-muted-foreground w-12 text-center">Watch</th>
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
                  <td className="px-2 py-3 text-center font-data font-bold text-muted-foreground/80">
                    {rank}
                  </td>
                  
                  {/* Fund Name & House */}
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-heading text-xs font-bold shadow-sm",
                        getAmcColorClass(fund.fundHouseName)
                      )}>
                        {getAmcInitials(fund.fundHouseName)}
                      </div>
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
                  <td className="px-2 py-3 text-center">{renderReturnCell(fund.returns1d)}</td>
                  <td className="px-2 py-3 text-center">{renderReturnCell(fund.returns1w)}</td>
                  <td className="px-2 py-3 text-center">{renderReturnCell(fund.returns1y)}</td>
                  <td className="px-2 py-3 text-center">{renderReturnCell(fund.returns3y)}</td>
                  <td className="px-2 py-3 text-center">{renderReturnCell(fund.returns5y)}</td>

                  {/* Compare Checkbox */}
                  <td className="px-2 py-3 text-center">
                    <button
                      onClick={() => toggleCompare(fund.kuveraCode, fund.schemeName)}
                      className={cn(
                        "inline-flex h-4 w-4 items-center justify-center rounded-md border transition-all hover:border-primary",
                        isCompareChecked 
                          ? "border-primary bg-primary text-primary-foreground" 
                          : "border-border bg-transparent text-transparent"
                      )}
                      aria-label={`Compare ${fund.schemeName}`}
                    >
                      <GitCompare className="h-3 w-3" />
                    </button>
                  </td>

                  {/* Watchlist Heart */}
                  <td className="px-2 py-3 text-center">
                    <button
                      onClick={() => toggleWatchlist(fund.kuveraCode)}
                      className="text-muted-foreground/40 hover:text-rose-500 transition-colors focus:outline-none"
                      aria-label={`Watch ${fund.schemeName}`}
                    >
                      <Heart 
                        className={cn(
                          "h-4 w-4 transition-transform active:scale-125", 
                          isWatchChecked && "fill-rose-500 text-rose-500 opacity-100"
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
      <div className="md:hidden space-y-4">
        {sortedFunds.map((fund, index) => {
          const rank = index + 1;
          const isCompareChecked = isComparing(fund.kuveraCode);
          const isWatchChecked = isWatched(fund.kuveraCode);

          return (
            <div 
              key={fund.id}
              className="rounded-xl border border-border bg-card p-4 transition-all shadow-sm"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-data font-bold text-muted-foreground text-sm">
                    #{rank}
                  </span>
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-heading text-[10px] font-bold",
                    getAmcColorClass(fund.fundHouseName)
                  )}>
                    {getAmcInitials(fund.fundHouseName)}
                  </div>
                  <div className="min-w-0">
                    <Link 
                      href={`/fund/${fund.kuveraCode}`}
                      className="font-heading font-semibold text-sm text-foreground hover:text-primary transition-colors block truncate"
                    >
                      {fund.schemeName}
                    </Link>
                    <span className="text-[10px] text-muted-foreground block truncate">
                      {fund.fundCategory}
                    </span>
                  </div>
                </div>

                {/* Score */}
                <span className="inline-flex items-center justify-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary font-data border border-primary/20 shrink-0">
                  {parseFloat(fund.totalScore || "0").toFixed(1)}
                </span>
              </div>

              {/* Top 3 returns grid */}
              <div className="grid grid-cols-3 gap-2 mt-4 text-center bg-muted/20 rounded-lg p-2">
                <div>
                  <span className="text-[9px] font-semibold text-muted-foreground block uppercase">1D</span>
                  <div className="mt-1">{renderReturnCell(fund.returns1d)}</div>
                </div>
                <div>
                  <span className="text-[9px] font-semibold text-muted-foreground block uppercase">1Y</span>
                  <div className="mt-1">{renderReturnCell(fund.returns1y)}</div>
                </div>
                <div>
                  <span className="text-[9px] font-semibold text-muted-foreground block uppercase">3Y</span>
                  <div className="mt-1">{renderReturnCell(fund.returns3y)}</div>
                </div>
              </div>

              {/* Action bar */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/60">
                <div className="text-[10px] text-muted-foreground font-data">
                  AUM: {formatAUM(fund.aum)}
                </div>

                <div className="flex items-center gap-4">
                  {/* Compare Toggle */}
                  <button
                    onClick={() => toggleCompare(fund.kuveraCode, fund.schemeName)}
                    className={cn(
                      "flex items-center gap-1 text-[11px] font-medium transition-colors hover:text-primary",
                      isCompareChecked ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    <GitCompare className="h-3.5 w-3.5" />
                    <span>Compare</span>
                  </button>

                  {/* Watch Toggle */}
                  <button
                    onClick={() => toggleWatchlist(fund.kuveraCode)}
                    className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-rose-500 transition-colors"
                  >
                    <Heart 
                      className={cn(
                        "h-3.5 w-3.5",
                        isWatchChecked && "fill-rose-500 text-rose-500 opacity-100"
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
