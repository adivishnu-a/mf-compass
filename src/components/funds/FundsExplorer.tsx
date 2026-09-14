"use client";

import React, { useState, useEffect, useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RefreshCw, X, ChevronDown } from "lucide-react";
import { FundsTable } from "@/components/funds/FundsTable";
import { EQUITY_CATEGORIES, HYBRID_CATEGORIES } from "@/lib/kuvera/categories";
import { cn } from "@/lib/utils";

import type { LeaderboardFund } from "@/lib/funds/queries";

interface FundsExplorerProps {
  group: "equity" | "hybrid";
  category: string;
  funds: LeaderboardFund[];
  error: string | null;
}

export function FundsExplorer({
  group: currentGroup,
  category: activeCategory,
  funds,
  error,
}: FundsExplorerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Local state initialized from URL search params
  const [minScore, setMinScore] = useState(() =>
    searchParams.get("minScore") ? parseInt(searchParams.get("minScore")!) : 50,
  );
  const [minRating, setMinRating] = useState(() =>
    searchParams.get("minRating")
      ? parseInt(searchParams.get("minRating")!)
      : 0,
  );
  const [sort, setSort] = useState(
    () => searchParams.get("sort") || "score_desc",
  );

  const [ratingDropdownOpen, setRatingDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // Sync URL search params back to local states
  useEffect(() => {
    const urlMinScore = searchParams.get("minScore")
      ? parseInt(searchParams.get("minScore")!)
      : 50;
    const urlMinRating = searchParams.get("minRating")
      ? parseInt(searchParams.get("minRating")!)
      : 0;
    const urlSort = searchParams.get("sort") || "score_desc";

    setMinScore(urlMinScore);
    setMinRating(urlMinRating);
    setSort(urlSort);
  }, [searchParams]);

  // Helper to update query parameters in URL
  const updateUrl = (updates: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (
        val === null ||
        val === undefined ||
        val === "" ||
        val === 0 ||
        (key === "minScore" && val === 50) ||
        (key === "sort" && val === "score_desc")
      ) {
        params.delete(key);
      } else {
        params.set(key, val.toString());
      }
    });
    startTransition(() => {
      router.replace(`/funds?${params.toString()}`);
    });
  };

  // Switch Group Tab
  const handleGroupChange = (group: "equity" | "hybrid") => {
    const newCategory =
      group === "equity" ? EQUITY_CATEGORIES[0] : HYBRID_CATEGORIES[0];
    updateUrl({
      group,
      category: newCategory,
      // Clear filters on tab change to reset state
      minScore: null,
      minRating: null,
      sort: null,
    });
  };

  // Switch Category Tab
  const handleCategoryChange = (category: string) => {
    updateUrl({ category });
  };

  // Clear all active filters
  const handleClearFilters = () => {
    updateUrl({
      minScore: null,
      minRating: null,
      sort: null,
    });
  };

  // Client-side filtering & sorting
  const filteredFunds = useMemo(() => {
    let result = [...funds];

    // Filter by Min Score
    if (minScore > 50) {
      result = result.filter(
        (f) => parseFloat(f.totalScore || "0") >= minScore,
      );
    }

    // Filter by Min Rating
    if (minRating > 0) {
      result = result.filter((f) => (f.fundRating || 0) >= minRating);
    }

    // Sort Order
    result.sort((a, b) => {
      if (sort === "score_desc") {
        return (
          parseFloat(b.totalScore || "0") - parseFloat(a.totalScore || "0")
        );
      }
      if (sort === "score_asc") {
        return (
          parseFloat(a.totalScore || "0") - parseFloat(b.totalScore || "0")
        );
      }
      if (sort === "returns1y_desc") {
        return (
          parseFloat(b.returns1y || "-999999") -
          parseFloat(a.returns1y || "-999999")
        );
      }
      if (sort === "returns3y_desc") {
        return (
          parseFloat(b.returns3y || "-999999") -
          parseFloat(a.returns3y || "-999999")
        );
      }
      if (sort === "returns5y_desc") {
        return (
          parseFloat(b.returns5y || "-999999") -
          parseFloat(a.returns5y || "-999999")
        );
      }
      if (sort === "aum_desc") {
        return parseFloat(b.aum || "0") - parseFloat(a.aum || "0");
      }
      return 0;
    });

    return result;
  }, [funds, minScore, minRating, sort]);

  // Display name helpers for category buttons
  const getCategoryShortName = (name: string) => {
    return name
      .replace(
        /Dynamic Asset Allocation or Balanced Advantage/i,
        "Balanced Adv",
      )
      .replace(/Aggressive Hybrid Fund/i, "Aggressive Hybrid")
      .replace(/Fund/gi, "")
      .replace(/fund/gi, "")
      .trim();
  };

  const categories =
    currentGroup === "equity" ? EQUITY_CATEGORIES : HYBRID_CATEGORIES;

  const ratingOptions = [
    { value: 0, label: "Any Rating" },
    { value: 5, label: "★★★★★ (5 Stars)" },
    { value: 4, label: "★★★★☆ (4+ Stars)" },
    { value: 3, label: "★★★☆☆ (3+ Stars)" },
    { value: 2, label: "★★☆☆☆ (2+ Stars)" },
    { value: 1, label: "★☆☆☆☆ (1+ Star)" },
  ];

  const sortOptions = [
    { value: "score_desc", label: "Score (High to Low)" },
    { value: "score_asc", label: "Score (Low to High)" },
    { value: "returns1y_desc", label: "1Y Return (High to Low)" },
    { value: "returns3y_desc", label: "3Y Return (High to Low)" },
    { value: "returns5y_desc", label: "5Y Return (High to Low)" },
    { value: "aum_desc", label: "Fund AUM (High to Low)" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Title & Group Switcher */}
      <div className="flex flex-col gap-6 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Outperformance Leaderboard
          </h1>
          <p className="mt-1 flex flex-wrap items-center text-xs leading-relaxed text-muted-foreground sm:text-sm">
            Funds in{" "}
            <span className="mx-1 font-semibold text-foreground">
              {activeCategory}
            </span>{" "}
            ranked by relative peer-group score.
            <span className="group relative ml-1.5 hidden align-middle select-none md:inline-block">
              <span className="flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-muted/60 text-muted-foreground transition-colors hover:bg-primary/20 hover:text-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-3 w-3"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span className="pointer-events-none invisible absolute bottom-full left-1/2 z-50 mb-2 w-72 -translate-x-1/2 rounded-lg border border-border bg-popover p-3 text-[11px] leading-normal font-normal text-popover-foreground opacity-0 shadow-lg transition-all duration-150 group-hover:visible group-hover:opacity-100">
                <span className="mb-0.5 block font-bold text-foreground">
                  Outperformance Score
                </span>
                Relative score based on weighted 3Y, 1Y, and 5Y returns, with a
                downside penalty on negative returns, normalized from{" "}
                <span className="font-semibold text-foreground">50 to 100</span>
                .
              </span>
            </span>
          </p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground md:hidden">
            Score: weighted 1Y, 3Y and 5Y returns versus the category average,
            with a penalty on negative returns, normalized from 50 to 100.
          </p>
        </div>

        {/* Group Tab Switcher (Equity / Hybrid) */}
        <div className="relative inline-flex self-start rounded-xl border border-border bg-card p-1 sm:self-center">
          {/* Sliding active pill indicator */}
          <span
            className={cn(
              "absolute inset-y-1 rounded-lg bg-primary shadow-sm transition-all duration-200 ease-out",
              currentGroup === "equity"
                ? "right-1/2 left-1"
                : "right-1 left-1/2",
            )}
          />
          <button
            onClick={() => handleGroupChange("equity")}
            className={cn(
              "relative z-10 cursor-pointer rounded-lg px-4 py-1.5 text-xs font-bold transition-colors duration-200 select-none",
              currentGroup === "equity"
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Equity
          </button>
          <button
            onClick={() => handleGroupChange("hybrid")}
            className={cn(
              "relative z-10 cursor-pointer rounded-lg px-4 py-1.5 text-xs font-bold transition-colors duration-200 select-none",
              currentGroup === "hybrid"
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Hybrid
          </button>
        </div>
      </div>

      {/* Category Selection Tabs */}
      <div className="relative mt-6">
        <div className="scrollbar-none overflow-x-auto pb-2.5">
          <div className="flex min-w-max gap-2.5 pr-8 md:pr-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                disabled={isPending}
                className={cn(
                  "cursor-pointer rounded-full border px-4 py-2.5 text-xs font-semibold transition-all duration-150 select-none active:scale-[0.98] sm:px-5 sm:py-2",
                  activeCategory === cat
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-muted-foreground hover:text-foreground",
                  isPending && activeCategory !== cat && "opacity-60",
                )}
              >
                {getCategoryShortName(cat)}
              </button>
            ))}
          </div>
        </div>
        {/* Right-edge subtle fade overlay for mobile scroll signifier */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent md:hidden" />
      </div>

      {/* Filter Options Bar */}
      <div className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-border bg-card p-4 shadow-sm md:grid-cols-[auto_1fr_1fr_auto]">
        {/* Score Buttons */}
        <div className="flex flex-col">
          <label className="mb-1.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
            Min Score
          </label>
          <div className="relative inline-flex h-8 w-[148px] items-center rounded-lg border border-border bg-background p-0.5">
            {/* Sliding active indicator */}
            <span
              className={cn(
                "absolute inset-y-0.5 left-0.5 w-12 transform-gpu rounded-md bg-primary shadow-sm transition-transform duration-200 ease-out",
                minScore === 50
                  ? "translate-x-0"
                  : minScore === 75
                    ? "translate-x-12"
                    : "translate-x-24",
              )}
            />
            {[50, 75, 90].map((score) => {
              const isActive = minScore === score;
              return (
                <button
                  key={score}
                  type="button"
                  onClick={() => {
                    setMinScore(score);
                    updateUrl({ minScore: score });
                  }}
                  className={cn(
                    "font-data relative z-10 flex h-7 w-12 cursor-pointer items-center justify-center rounded-md text-xs font-bold transition-colors duration-200 select-none",
                    isActive
                      ? "font-extrabold text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {score}
                </button>
              );
            })}
          </div>
        </div>

        {/* Rating Filter */}
        <div className="relative z-20 flex flex-col">
          <label className="mb-1.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
            Min Fund Rating
          </label>
          <button
            onClick={() => {
              setRatingDropdownOpen(!ratingDropdownOpen);
              setSortDropdownOpen(false);
            }}
            className="flex h-[34px] w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground transition-colors hover:border-primary/50 focus:outline-none"
          >
            <span className="truncate">
              {ratingOptions.find((o) => o.value === minRating)?.label ||
                "Any Rating"}
            </span>
            <ChevronDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
          </button>

          {ratingDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setRatingDropdownOpen(false)}
              />
              <div className="animate-dropdown-enter absolute top-[calc(100%+4px)] left-0 z-50 w-full rounded-xl border border-border bg-card/95 p-1 shadow-xl backdrop-blur-md">
                {ratingOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setMinRating(opt.value);
                      updateUrl({ minRating: opt.value });
                      setRatingDropdownOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-accent hover:text-foreground",
                      minRating === opt.value
                        ? "bg-accent/40 font-bold text-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Sorting option */}
        <div className="relative z-10 flex flex-col">
          <label className="mb-1.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
            Sort Universe By
          </label>
          <button
            onClick={() => {
              setSortDropdownOpen(!sortDropdownOpen);
              setRatingDropdownOpen(false);
            }}
            className="flex h-[34px] w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground transition-colors hover:border-primary/50 focus:outline-none"
          >
            <span className="truncate">
              {sortOptions.find((o) => o.value === sort)?.label ||
                "Score (High to Low)"}
            </span>
            <ChevronDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
          </button>

          {sortDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setSortDropdownOpen(false)}
              />
              <div className="animate-dropdown-enter absolute top-[calc(100%+4px)] left-0 z-50 w-full rounded-xl border border-border bg-card/95 p-1 shadow-xl backdrop-blur-md">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSort(opt.value);
                      updateUrl({ sort: opt.value });
                      setSortDropdownOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center rounded-lg px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent hover:text-foreground",
                      sort === opt.value
                        ? "bg-accent/40 font-bold text-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Clear Filters Action */}
        <div className="flex items-end">
          <button
            onClick={handleClearFilters}
            disabled={
              minScore === 50 && minRating === 0 && sort === "score_desc"
            }
            className={cn(
              "flex h-[34px] w-full items-center justify-center gap-1.5 rounded-lg border px-4 py-1.5 text-xs font-semibold transition-all duration-150",
              minScore > 50 || minRating > 0 || sort !== "score_desc"
                ? "cursor-pointer border-border text-foreground hover:bg-accent hover:text-foreground"
                : "cursor-not-allowed border-border/40 bg-muted/20 text-muted-foreground/30",
            )}
          >
            <X className="h-3.5 w-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* Main Results Container */}
      <div
        className={cn(
          "mt-8 transition-opacity duration-200",
          isPending && "opacity-60",
        )}
      >
        {error && (
          <div className="animate-fade-in rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
            <p className="text-sm font-medium text-destructive">{error}</p>
            <button
              onClick={() => router.refresh()}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Try Again
            </button>
          </div>
        )}

        {!error && filteredFunds.length === 0 && (
          <div className="animate-fade-in rounded-xl border border-border bg-card p-12 text-center shadow-sm">
            <h3 className="font-heading text-sm font-bold text-foreground">
              No funds match your filters
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
              Your filter thresholds might be too restrictive. Try resetting
              filters to view the full leaderboard.
            </p>
            <button
              onClick={handleClearFilters}
              className="mt-4 rounded-lg bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90"
            >
              Reset Filters
            </button>
          </div>
        )}

        {!error && filteredFunds.length > 0 && (
          <div
            key={`${currentGroup}-${activeCategory}-${minScore}-${minRating}-${sort}`}
            className="animate-fade-in"
          >
            <FundsTable funds={filteredFunds} />
          </div>
        )}
      </div>
    </div>
  );
}
