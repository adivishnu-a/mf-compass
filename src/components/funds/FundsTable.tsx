"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Heart,
  GitCompare,
} from "lucide-react";
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
  if (sortField !== field)
    return (
      <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-40 transition-opacity hover:opacity-100" />
    );
  if (sortOrder === "desc")
    return <ArrowDown className="ml-1 h-3.5 w-3.5 font-bold text-primary" />;
  if (sortOrder === "asc")
    return <ArrowUp className="ml-1 h-3.5 w-3.5 font-bold text-primary" />;
  return <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-40" />;
}

export function FundsTable({ funds }: FundsTableProps) {
  const { toggleWatchlist, isWatched } = useWatchlist();
  const { toggleCompare, isComparing } = useCompare();

  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  const getAriaSort = (field: SortField) => {
    if (sortField !== field) return "none";
    return sortOrder === "asc"
      ? "ascending"
      : sortOrder === "desc"
        ? "descending"
        : "none";
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
      const valA = a[sortField as keyof Fund];
      const valB = b[sortField as keyof Fund];

      let compA: string | number;
      let compB: string | number;

      // Handle numeric conversion for returns, score, aum
      if (
        sortField === "totalScore" ||
        sortField === "aum" ||
        sortField.startsWith("returns")
      ) {
        compA = parseFloat((valA as string) || "-999999");
        compB = parseFloat((valB as string) || "-999999");
      } else {
        // String sorting (schemeName)
        compA = ((valA as string) || "").toString().toLowerCase();
        compB = ((valB as string) || "").toString().toLowerCase();
      }

      if (compA < compB) return sortOrder === "asc" ? -1 : 1;
      if (compA > compB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [funds, sortField, sortOrder]);

  const renderReturnCell = (
    val: string | null,
    period: "1d" | "1w" | "1y" | "3y" | "5y",
    fund: Fund,
  ) => {
    if (val === null || val === undefined)
      return <span className="font-sans text-muted-foreground/45">--</span>;
    const num = parseFloat(val);
    if (isNaN(num))
      return <span className="font-sans text-muted-foreground/45">--</span>;

    const genuine = isReturnGenuine(val, period, fund);
    if (!genuine)
      return <span className="font-sans text-muted-foreground/45">--</span>;

    return (
      <span
        className={cn(
          "font-data rounded px-2 py-0.5 text-xs font-semibold",
          num > 0
            ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-400"
            : num < 0
              ? "bg-rose-500/10 text-rose-800 dark:text-rose-400"
              : "text-muted-foreground",
        )}
      >
        {formatPercent(num, true, true)}
      </span>
    );
  };

  return (
    <div className="w-full">
      {/* Desktop Table View */}
      <div className="hidden overflow-x-auto rounded-xl border border-border bg-card shadow-sm md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 transition-colors">
              <th className="w-16 py-3 pr-2 pl-6 text-center font-semibold text-muted-foreground">
                #
              </th>
              <th
                className="cursor-pointer px-2 py-3 font-semibold text-muted-foreground transition-colors select-none hover:bg-muted/60 focus-visible:bg-muted/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-inset"
                onClick={() => handleSort("schemeName")}
                onKeyDown={(e) => handleHeaderKeyDown(e, "schemeName")}
                tabIndex={0}
                role="columnheader"
                aria-sort={getAriaSort("schemeName")}
              >
                <div className="flex items-center">
                  Mutual Fund{" "}
                  <SortIcon
                    field="schemeName"
                    sortField={sortField as SortField}
                    sortOrder={sortOrder}
                  />
                </div>
              </th>
              <th
                className="w-24 cursor-pointer px-2 py-3 text-center font-semibold text-muted-foreground transition-colors select-none hover:bg-muted/60 focus-visible:bg-muted/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-inset"
                onClick={() => handleSort("totalScore")}
                onKeyDown={(e) => handleHeaderKeyDown(e, "totalScore")}
                tabIndex={0}
                role="columnheader"
                aria-sort={getAriaSort("totalScore")}
              >
                <div className="flex items-center justify-center">
                  Score{" "}
                  <SortIcon
                    field="totalScore"
                    sortField={sortField as SortField}
                    sortOrder={sortOrder}
                  />
                </div>
              </th>
              <th
                className="w-16 cursor-pointer px-2 py-3 text-center font-semibold text-muted-foreground transition-colors select-none hover:bg-muted/60 focus-visible:bg-muted/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-inset"
                onClick={() => handleSort("returns1d")}
                onKeyDown={(e) => handleHeaderKeyDown(e, "returns1d")}
                tabIndex={0}
                role="columnheader"
                aria-sort={getAriaSort("returns1d")}
              >
                <div className="flex items-center justify-center">
                  1D{" "}
                  <SortIcon
                    field="returns1d"
                    sortField={sortField as SortField}
                    sortOrder={sortOrder}
                  />
                </div>
              </th>
              <th
                className="w-16 cursor-pointer px-2 py-3 text-center font-semibold text-muted-foreground transition-colors select-none hover:bg-muted/60 focus-visible:bg-muted/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-inset"
                onClick={() => handleSort("returns1w")}
                onKeyDown={(e) => handleHeaderKeyDown(e, "returns1w")}
                tabIndex={0}
                role="columnheader"
                aria-sort={getAriaSort("returns1w")}
              >
                <div className="flex items-center justify-center">
                  1W{" "}
                  <SortIcon
                    field="returns1w"
                    sortField={sortField as SortField}
                    sortOrder={sortOrder}
                  />
                </div>
              </th>
              <th
                className="w-16 cursor-pointer px-2 py-3 text-center font-semibold text-muted-foreground transition-colors select-none hover:bg-muted/60 focus-visible:bg-muted/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-inset"
                onClick={() => handleSort("returns1y")}
                onKeyDown={(e) => handleHeaderKeyDown(e, "returns1y")}
                tabIndex={0}
                role="columnheader"
                aria-sort={getAriaSort("returns1y")}
              >
                <div className="flex items-center justify-center">
                  1Y{" "}
                  <SortIcon
                    field="returns1y"
                    sortField={sortField as SortField}
                    sortOrder={sortOrder}
                  />
                </div>
              </th>
              <th
                className="w-16 cursor-pointer px-2 py-3 text-center font-semibold text-muted-foreground transition-colors select-none hover:bg-muted/60 focus-visible:bg-muted/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-inset"
                onClick={() => handleSort("returns3y")}
                onKeyDown={(e) => handleHeaderKeyDown(e, "returns3y")}
                tabIndex={0}
                role="columnheader"
                aria-sort={getAriaSort("returns3y")}
              >
                <div className="flex items-center justify-center">
                  3Y{" "}
                  <SortIcon
                    field="returns3y"
                    sortField={sortField as SortField}
                    sortOrder={sortOrder}
                  />
                </div>
              </th>
              <th
                className="w-16 cursor-pointer px-2 py-3 text-center font-semibold text-muted-foreground transition-colors select-none hover:bg-muted/60 focus-visible:bg-muted/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-inset"
                onClick={() => handleSort("returns5y")}
                onKeyDown={(e) => handleHeaderKeyDown(e, "returns5y")}
                tabIndex={0}
                role="columnheader"
                aria-sort={getAriaSort("returns5y")}
              >
                <div className="flex items-center justify-center">
                  5Y{" "}
                  <SortIcon
                    field="returns5y"
                    sortField={sortField as SortField}
                    sortOrder={sortOrder}
                  />
                </div>
              </th>
              <th className="w-12 px-2 py-3 text-center font-semibold text-muted-foreground">
                Compare
              </th>
              <th className="w-16 py-3 pr-6 pl-2 text-center font-semibold text-muted-foreground">
                Watch
              </th>
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
                  className="group transition-all duration-150 hover:bg-muted/20"
                >
                  {/* Rank */}
                  <td className="font-data py-3 pr-2 pl-6 text-center font-bold text-muted-foreground/80">
                    {rank}
                  </td>

                  {/* Fund Name & House */}
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-3">
                      <AmcLogo
                        fundHouse={fund.fundHouse}
                        fundHouseName={fund.fundHouseName}
                        size="md"
                      />
                      <div className="flex max-w-[280px] flex-col truncate lg:max-w-[400px]">
                        <Link
                          href={`/fund/${fund.kuveraCode}`}
                          className="truncate font-heading font-medium text-foreground transition-colors hover:text-primary"
                        >
                          {fund.schemeName}
                        </Link>
                        <span className="mt-0.5 truncate text-[10px] text-muted-foreground">
                          {fund.fundHouseName} • {fund.fundType}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Score */}
                  <td className="px-2 py-3 text-center">
                    <span className="font-data inline-flex items-center justify-center rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
                      {parseFloat(fund.totalScore || "0").toFixed(1)}
                    </span>
                  </td>

                  {/* Returns */}
                  <td className="px-2 py-3 text-center">
                    {renderReturnCell(fund.returns1d, "1d", fund)}
                  </td>
                  <td className="px-2 py-3 text-center">
                    {renderReturnCell(fund.returns1w, "1w", fund)}
                  </td>
                  <td className="px-2 py-3 text-center">
                    {renderReturnCell(fund.returns1y, "1y", fund)}
                  </td>
                  <td className="px-2 py-3 text-center">
                    {renderReturnCell(fund.returns3y, "3y", fund)}
                  </td>
                  <td className="px-2 py-3 text-center">
                    {renderReturnCell(fund.returns5y, "5y", fund)}
                  </td>

                  {/* Compare Checkbox */}
                  <td className="px-2 py-3 text-center">
                    <button
                      onClick={() =>
                        toggleCompare(
                          fund.kuveraCode,
                          fund.shortName || fund.schemeName,
                        )
                      }
                      className={cn(
                        "inline-flex h-4 w-4 items-center justify-center rounded-full border transition-all hover:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:outline-none",
                        isCompareChecked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/40 bg-transparent text-transparent",
                      )}
                      aria-label={`Compare ${fund.schemeName}`}
                    >
                      <GitCompare className="h-3 w-3" />
                    </button>
                  </td>

                  {/* Watchlist Heart */}
                  <td className="py-3 pr-6 pl-2 text-center">
                    <button
                      onClick={() => toggleWatchlist(fund.kuveraCode)}
                      className="rounded-full p-0.5 text-muted-foreground/40 transition-colors hover:text-rose-500 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1 focus-visible:outline-none"
                      aria-label={`Save ${fund.schemeName} to watchlist`}
                      aria-pressed={isWatchChecked}
                    >
                      <Heart
                        className={cn(
                          "h-4 w-4 transition-transform duration-200 active:scale-110",
                          isWatchChecked
                            ? "animate-heart-pop fill-rose-500 text-rose-500 opacity-100"
                            : "opacity-80",
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
      <div className="space-y-2.5 md:hidden">
        {sortedFunds.map((fund, index) => {
          const rank = index + 1;
          const isCompareChecked = isComparing(fund.kuveraCode);
          const isWatchChecked = isWatched(fund.kuveraCode);

          return (
            <div
              key={fund.id}
              className="rounded-xl border border-border bg-card p-3 shadow-sm transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="font-data text-sm font-bold text-muted-foreground">
                    #{rank}
                  </span>
                  <AmcLogo
                    fundHouse={fund.fundHouse}
                    fundHouseName={fund.fundHouseName}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <Link
                      href={`/fund/${fund.kuveraCode}`}
                      className="block truncate font-heading text-base font-semibold text-foreground transition-colors hover:text-primary"
                    >
                      {fund.shortName || fund.schemeName}
                    </Link>
                    <span className="block truncate text-[10px] text-muted-foreground">
                      {fund.fundCategory}
                    </span>
                  </div>
                </div>

                {/* Score */}
                <span className="font-data inline-flex shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-sm font-extrabold text-primary">
                  {parseFloat(fund.totalScore || "0").toFixed(1)}
                </span>
              </div>

              {/* Top 3 returns grid */}
              <div className="mt-2.5 grid grid-cols-3 gap-2 rounded-lg bg-muted/20 px-2 py-1.5 text-center">
                <div>
                  <span className="block text-[9px] font-semibold text-muted-foreground uppercase">
                    1D
                  </span>
                  <div className="mt-0.5">
                    {renderReturnCell(fund.returns1d, "1d", fund)}
                  </div>
                </div>
                <div>
                  <span className="block text-[9px] font-semibold text-muted-foreground uppercase">
                    1Y
                  </span>
                  <div className="mt-0.5">
                    {renderReturnCell(fund.returns1y, "1y", fund)}
                  </div>
                </div>
                <div>
                  <span className="block text-[9px] font-semibold text-muted-foreground uppercase">
                    3Y
                  </span>
                  <div className="mt-0.5">
                    {renderReturnCell(fund.returns3y, "3y", fund)}
                  </div>
                </div>
              </div>

              {/* Action bar */}
              <div className="mt-2.5 flex items-center justify-between border-t border-border/60 pt-2">
                <div className="font-data text-[10px] text-muted-foreground">
                  AUM: {formatAUM(fund.aum)}
                </div>

                <div className="flex items-center gap-4">
                  {/* Compare Toggle */}
                  <button
                    onClick={() =>
                      toggleCompare(
                        fund.kuveraCode,
                        fund.shortName || fund.schemeName,
                      )
                    }
                    className={cn(
                      "flex items-center gap-1 rounded-lg px-2 py-3 text-[11px] font-medium transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:outline-none",
                      isCompareChecked
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                    aria-label={`Compare ${fund.schemeName}`}
                  >
                    <GitCompare className="h-3.5 w-3.5" />
                    <span>Compare</span>
                  </button>

                  {/* Watch Toggle */}
                  <button
                    onClick={() => toggleWatchlist(fund.kuveraCode)}
                    className="flex items-center gap-1 rounded-lg px-2 py-3 text-[11px] font-medium text-muted-foreground transition-colors hover:text-rose-500 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1 focus-visible:outline-none"
                    aria-label={`Save ${fund.schemeName} to watchlist`}
                    aria-pressed={isWatchChecked}
                  >
                    <Heart
                      className={cn(
                        "h-3.5 w-3.5 transition-transform duration-200 active:scale-110",
                        isWatchChecked
                          ? "animate-heart-pop fill-rose-500 text-rose-500 opacity-100"
                          : "opacity-80",
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
