"use client";

import React, { useState, useEffect, useMemo, Suspense, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RefreshCw, X, ChevronDown } from "lucide-react";
import { FundsTable } from "@/components/funds/FundsTable";
import { EQUITY_CATEGORIES, HYBRID_CATEGORIES } from "@/lib/kuvera/categories";
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

function FundsExplorerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // URL States
  const currentGroup = (searchParams.get("group") || "equity") as "equity" | "hybrid";
  const currentCategory = searchParams.get("category") || "Large Cap Fund";

  // Local state initialized from URL search params
  const [minScore, setMinScore] = useState(() => 
    searchParams.get("minScore") ? parseInt(searchParams.get("minScore")!) : 50
  );
  const [minRating, setMinRating] = useState(() => 
    searchParams.get("minRating") ? parseInt(searchParams.get("minRating")!) : 0
  );
  const [sort, setSort] = useState(() => 
    searchParams.get("sort") || "score_desc"
  );

  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [ratingDropdownOpen, setRatingDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // Sync URL search params back to local states
  useEffect(() => {
    const urlMinScore = searchParams.get("minScore") ? parseInt(searchParams.get("minScore")!) : 50;
    const urlMinRating = searchParams.get("minRating") ? parseInt(searchParams.get("minRating")!) : 0;
    const urlSort = searchParams.get("sort") || "score_desc";

    setMinScore(urlMinScore);
    setMinRating(urlMinRating);
    setSort(urlSort);
  }, [searchParams]);

  // Validate and default Category if invalid
  const activeCategory = useMemo(() => {
    const categories = currentGroup === "equity" ? EQUITY_CATEGORIES : HYBRID_CATEGORIES;
    if (categories.includes(currentCategory as any)) {
      return currentCategory;
    }
    return categories[0];
  }, [currentGroup, currentCategory]);

  // Fetch funds when category changes
  useEffect(() => {
    let active = true;
    const fetchFunds = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/funds?category=${encodeURIComponent(activeCategory)}`);
        const data = await res.json();
        if (active) {
          if (data.success) {
            setFunds(data.data || []);
          } else {
            setError(data.error || "Failed to load funds");
          }
        }
      } catch {
        if (active) {
          setError("Failed to fetch data. Please check your connection.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchFunds();
    return () => {
      active = false;
    };
  }, [activeCategory]);

  // Helper to update query parameters in URL
  const updateUrl = (updates: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === undefined || val === "" || val === 0 || (key === "minScore" && val === 50) || (key === "sort" && val === "score_desc")) {
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
    const newCategory = group === "equity" ? EQUITY_CATEGORIES[0] : HYBRID_CATEGORIES[0];
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
      result = result.filter((f) => parseFloat(f.totalScore || "0") >= minScore);
    }

    // Filter by Min Rating
    if (minRating > 0) {
      result = result.filter((f) => (f.fundRating || 0) >= minRating);
    }

    // Sort Order
    result.sort((a, b) => {
      if (sort === "score_desc") {
        return parseFloat(b.totalScore || "0") - parseFloat(a.totalScore || "0");
      }
      if (sort === "score_asc") {
        return parseFloat(a.totalScore || "0") - parseFloat(b.totalScore || "0");
      }
      if (sort === "returns1y_desc") {
        return parseFloat(b.returns1y || "-999999") - parseFloat(a.returns1y || "-999999");
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
      .replace(/Dynamic Asset Allocation or Balanced Advantage/i, "Balanced Adv")
      .replace(/Aggressive Hybrid Fund/i, "Aggressive Hybrid")
      .replace(/Fund/gi, "")
      .replace(/fund/gi, "")
      .trim();
  };

  const categories = currentGroup === "equity" ? EQUITY_CATEGORIES : HYBRID_CATEGORIES;

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
    { value: "aum_desc", label: "Fund AUM (High to Low)" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Title & Group Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-b border-border pb-6">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Outperformance Leaderboard
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Funds in <span className="font-semibold text-foreground">{activeCategory}</span> ranked by relative peer-group score.
          </p>
        </div>

        {/* Group Tab Switcher (Equity / Hybrid) */}
        <div className="inline-flex rounded-xl border border-border bg-card p-1 self-start sm:self-center">
          <button
            onClick={() => handleGroupChange("equity")}
            className={cn(
              "rounded-lg px-4 py-1.5 text-xs font-bold transition-all",
              currentGroup === "equity"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Equity
          </button>
          <button
            onClick={() => handleGroupChange("hybrid")}
            className={cn(
              "rounded-lg px-4 py-1.5 text-xs font-bold transition-all",
              currentGroup === "hybrid"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Hybrid
          </button>
        </div>
      </div>

      {/* Category Selection Tabs */}
      <div className="mt-6 overflow-x-auto pb-2 scrollbar-none">
        <div className="flex gap-2 min-w-max">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              disabled={isPending}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold border transition-all duration-150 select-none",
                activeCategory === cat
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-muted-foreground hover:text-foreground",
                isPending && activeCategory !== cat && "opacity-60"
              )}
            >
              {getCategoryShortName(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Options Bar */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-[auto_1fr_1fr_auto] gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        {/* Score Buttons */}
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
            Min Score
          </label>
          <div className="flex items-center gap-1.5 h-[34px]">
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
                    "flex h-7 w-12 items-center justify-center rounded-full border text-xs font-bold font-data transition-all duration-150 select-none",
                    isActive
                      ? "border-primary/50 bg-primary/10 text-primary shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground"
                  )}
                >
                  {score}
                </button>
              );
            })}
          </div>
        </div>

        {/* Rating Filter */}
        <div className="flex flex-col relative z-20">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
            Min Fund Rating
          </label>
          <button
            onClick={() => {
              setRatingDropdownOpen(!ratingDropdownOpen);
              setSortDropdownOpen(false);
            }}
            className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground transition-colors hover:border-primary/50 focus:outline-none h-[34px]"
          >
            <span className="truncate">{ratingOptions.find(o => o.value === minRating)?.label || "Any Rating"}</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0 ml-2" />
          </button>
          
          {ratingDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setRatingDropdownOpen(false)} />
              <div className="absolute top-[calc(100%+4px)] left-0 w-full rounded-xl border border-border bg-card/95 p-1 shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-100 backdrop-blur-md">
                {ratingOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setMinRating(opt.value);
                      updateUrl({ minRating: opt.value });
                      setRatingDropdownOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center px-2 py-1.5 text-xs transition-colors hover:bg-accent hover:text-foreground rounded-lg",
                      minRating === opt.value ? "bg-accent/40 text-primary font-bold" : "text-muted-foreground"
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
        <div className="flex flex-col relative z-10">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
            Sort Universe By
          </label>
          <button
            onClick={() => {
              setSortDropdownOpen(!sortDropdownOpen);
              setRatingDropdownOpen(false);
            }}
            className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground transition-colors hover:border-primary/50 focus:outline-none h-[34px]"
          >
            <span className="truncate">{sortOptions.find(o => o.value === sort)?.label || "Score (High to Low)"}</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0 ml-2" />
          </button>
          
          {sortDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setSortDropdownOpen(false)} />
              <div className="absolute top-[calc(100%+4px)] left-0 w-full rounded-xl border border-border bg-card/95 p-1 shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-100 backdrop-blur-md">
                {sortOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSort(opt.value);
                      updateUrl({ sort: opt.value });
                      setSortDropdownOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center px-2 py-1.5 text-xs transition-colors hover:bg-accent hover:text-foreground rounded-lg text-left",
                      sort === opt.value ? "bg-accent/40 text-primary font-bold" : "text-muted-foreground"
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
            disabled={minScore === 50 && minRating === 0 && sort === "score_desc"}
            className={cn(
              "flex w-full items-center justify-center gap-1.5 rounded-lg border px-4 py-1.5 text-xs font-semibold transition-all duration-150 h-[34px]",
              (minScore > 50 || minRating > 0 || sort !== "score_desc")
                ? "border-border hover:bg-accent text-foreground hover:text-foreground cursor-pointer"
                : "border-border/40 text-muted-foreground/30 bg-muted/20 cursor-not-allowed"
            )}
          >
            <X className="h-3.5 w-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* Main Results Container */}
      <div className="mt-8">
        {loading && <SkeletonTable />}

        {!loading && error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center animate-in fade-in duration-200">
            <p className="text-sm text-destructive font-medium">{error}</p>
            <button
              onClick={() => router.refresh()}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Try Again
            </button>
          </div>
        )}

        {!loading && !error && filteredFunds.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-12 text-center animate-in fade-in duration-200 shadow-sm">
            <h3 className="font-heading font-bold text-sm text-foreground">No funds match your filters</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              Your filter thresholds might be too restrictive. Try resetting filters to view the full leaderboard.
            </p>
            <button
              onClick={handleClearFilters}
              className="mt-4 rounded-lg bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90"
            >
              Reset Filters
            </button>
          </div>
        )}

        {!loading && !error && filteredFunds.length > 0 && (
          <div className="animate-in fade-in duration-200">
            <FundsTable funds={filteredFunds} />
          </div>
        )}
      </div>
    </div>
  );
}

// Skeleton Table Loader for Quiet Luxury structure
function SkeletonTable() {
  return (
    <div className="w-full border border-border rounded-xl overflow-hidden bg-card animate-pulse shadow-sm">
      <div className="h-12 border-b border-border bg-muted/20 w-full" />
      <div className="divide-y divide-border/60">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center p-4 gap-4 w-full">
            <div className="h-4 w-6 bg-muted rounded-md shrink-0" />
            <div className="h-4 w-6 bg-muted rounded-md shrink-0" />
            <div className="h-4 w-6 bg-muted rounded-md shrink-0" />
            <div className="h-9 w-9 bg-muted rounded-lg shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <div className="h-4 bg-muted rounded-md w-2/3 max-w-[200px]" />
              <div className="h-3 bg-muted rounded-md w-1/3 max-w-[120px]" />
            </div>
            <div className="h-6 w-12 bg-muted rounded-md shrink-0" />
            <div className="h-4 w-12 bg-muted rounded-md shrink-0 hidden sm:block" />
            <div className="h-4 w-12 bg-muted rounded-md shrink-0 hidden sm:block" />
            <div className="h-4 w-12 bg-muted rounded-md shrink-0 hidden sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FundsExplorerPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-8 lg:px-8"><SkeletonTable /></div>}>
      <FundsExplorerContent />
    </Suspense>
  );
}
