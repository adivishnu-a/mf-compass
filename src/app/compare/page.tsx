"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { GitCompare, Trash2, ArrowLeft, ShieldAlert } from "lucide-react";
import { formatPercent, formatINR, formatAUM, isReturnGenuine } from "@/lib/format";
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
  currentNav: string | null;
  currentNavDate: string | null;
  t1Nav: string | null;
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
  fundManagers: any;
  investmentObjective: string | null;
  volatility: string | null;
  portfolioTurnover: string | null;
  aum: string | null;
  fundRating: number | null;
  fundRatingDate: string | null;
  crisilRating: string | null;
  totalScore: string | null;
}

function CompareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract requested codes from URL
  const requestedCodes = useMemo(() => {
    const codesStr = searchParams.get("codes") || "";
    return codesStr
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
  }, [searchParams]);

  // Fetch comparing funds
  useEffect(() => {
    if (requestedCodes.length === 0) {
      setFunds([]);
      setLoading(false);
      return;
    }

    let active = true;
    const fetchCompareFunds = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/funds/by-codes?codes=${requestedCodes.join(",")}`);
        const data = await res.json();
        
        if (active) {
          if (data.success) {
            setFunds(data.data || []);
          } else {
            setError(data.error || "Failed to load comparison data.");
          }
        }
      } catch {
        if (active) {
          setError("Failed to fetch comparison details.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchCompareFunds();
    return () => {
      active = false;
    };
  }, [requestedCodes]);

  // Handle removing a fund from compare list
  const handleRemoveFund = (codeToRemove: string) => {
    const updatedCodes = requestedCodes.filter((c) => c !== codeToRemove);
    
    // Also sync localStorage compare selection
    try {
      localStorage.setItem("mfc:compare", JSON.stringify(updatedCodes));
      window.dispatchEvent(new CustomEvent("mfc-compare-change"));
    } catch (e) {
      console.error("Failed to sync compare remove to localStorage", e);
    }

    if (updatedCodes.length === 0) {
      router.push("/funds");
    } else {
      router.push(`/compare?codes=${updatedCodes.join(",")}`);
    }
  };

  // Detect which funds are "stale" or "no longer tracked"
  const staleCodes = useMemo(() => {
    if (loading) return [];
    return requestedCodes.filter((code) => !funds.some((f) => f.kuveraCode === code));
  }, [requestedCodes, funds, loading]);

  // Utility to determine best/worst styling for cell comparisons
  // returns: 'best' | 'worst' | 'normal'
  const compareRowValues = (
    currentVal: number | null,
    allVals: (number | null)[],
    lowerIsBetter = false
  ) => {
    if (currentVal === null || allVals.filter((v) => v !== null).length < 2) {
      return "normal";
    }

    const cleanVals = allVals.filter((v): v is number => v !== null);
    const maxVal = Math.max(...cleanVals);
    const minVal = Math.min(...cleanVals);

    // If all values are equal, no highlight
    if (maxVal === minVal) return "normal";

    if (lowerIsBetter) {
      if (currentVal === minVal) return "best";
      if (currentVal === maxVal) return "worst";
    } else {
      if (currentVal === maxVal) return "best";
      if (currentVal === minVal) return "worst";
    }

    return "normal";
  };

  const getHighlightClass = (type: "best" | "worst" | "normal") => {
    if (type === "best") {
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-500/20";
    }
    if (type === "worst") {
      return "bg-rose-500/10 text-rose-700 dark:text-rose-400 font-bold border border-rose-500/20";
    }
    return "";
  };

  // Parsing values helper
  const getFloat = (val: string | number | null): number | null => {
    if (val === null || val === undefined) return null;
    const num = typeof val === "string" ? parseFloat(val) : val;
    return isNaN(num) ? null : num;
  };

  // Render a comparison row
  const renderCompareRow = (
    label: string,
    getValue: (fund: Fund) => string | number | null,
    formatValue: (val: any, fund: Fund) => React.ReactNode,
    lowerIsBetter = false,
    isNumeric = true
  ) => {
    const rowValues = funds.map((f) => {
      const v = getValue(f);
      return isNumeric ? getFloat(v) : null;
    });

    return (
      <tr className="border-b border-border hover:bg-muted/5 transition-all">
        <td className="p-4 font-heading font-medium text-xs text-muted-foreground bg-muted/20 uppercase tracking-wide border-r border-border min-w-[150px]">
          {label}
        </td>
        {funds.map((fund) => {
          const raw = getValue(fund);
          const cellType = isNumeric 
            ? compareRowValues(getFloat(raw), rowValues, lowerIsBetter)
            : "normal";
          
          return (
            <td
              key={fund.kuveraCode}
              className={cn(
                "p-4 text-center font-data text-xs border-r border-border transition-colors",
                getHighlightClass(cellType)
              )}
            >
              {formatValue(raw, fund)}
            </td>
          );
        })}
      </tr>
    );
  };

  const parseManagers = (managers: any) => {
    if (!managers) return "--";
    if (Array.isArray(managers)) return managers.join(", ");
    if (typeof managers === "string") {
      return managers.split(";").map((m) => m.trim()).join(", ");
    }
    return "--";
  };

  if (requestedCodes.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
          <GitCompare className="h-6 w-6" />
        </div>
        <h2 className="font-heading text-lg font-bold text-foreground">No funds to compare</h2>
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
          Select at least two mutual funds from the explore leaderboard to begin comparing performance metrics.
        </p>
        <Link
          href="/funds"
          className="mt-6 inline-flex rounded-lg bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/95"
        >
          Explore Funds
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Back button */}
      <Link
        href="/funds"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Rankings
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-b border-border pb-6">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Side-by-Side Fund Analysis
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Comparing core outperformance returns, score indicators, and expense metrics.
          </p>
        </div>
      </div>

      {/* Stale code alerts / F-014 */}
      {staleCodes.length > 0 && (
        <div className="mt-6 space-y-3">
          {staleCodes.map((code) => (
            <div
              key={code}
              className="flex items-start justify-between gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4"
            >
              <div className="flex gap-2">
                <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <span className="font-heading font-bold text-xs text-foreground uppercase tracking-wider block">
                    Fund no longer tracked
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    The fund with code <span className="font-data font-semibold text-foreground">{code}</span> is no longer actively monitored (AUM under threshold or merged).
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleRemoveFund(code)}
                className="text-xs font-bold text-destructive hover:underline shrink-0"
              >
                Remove from List
              </button>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="mt-8 flex flex-col items-center justify-center py-20 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary border-r-2 border-transparent" />
          <p className="mt-4 text-xs text-muted-foreground">Loading comparison data...</p>
        </div>
      )}

      {!loading && error && (
        <div className="mt-8 rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center animate-in fade-in duration-200">
          <p className="text-sm text-destructive font-medium">{error}</p>
        </div>
      )}

      {!loading && !error && funds.length === 0 && (
        <div className="mt-8 rounded-xl border border-border bg-card p-12 text-center animate-in fade-in duration-200 shadow-sm">
          <p className="text-sm text-muted-foreground">None of the requested funds are available for comparison.</p>
        </div>
      )}

      {!loading && !error && funds.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-xl border border-border bg-card shadow-sm animate-in fade-in duration-200">
          <table className="w-full border-collapse text-left text-sm table-fixed">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {/* Heading spacer */}
                <th className="p-4 font-heading font-semibold text-muted-foreground w-[180px] border-r border-border">
                  Parameters
                </th>
                
                {/* Fund Headings */}
                {funds.map((fund) => (
                  <th
                    key={fund.kuveraCode}
                    className="p-4 font-heading font-semibold text-foreground border-r border-border text-center group min-w-[200px]"
                  >
                    <div className="flex flex-col h-full justify-between items-center text-center">
                      {/* Remove button */}
                      <button
                        onClick={() => handleRemoveFund(fund.kuveraCode)}
                        className="text-muted-foreground/40 hover:text-destructive transition-colors self-end p-0.5"
                        aria-label={`Remove ${fund.schemeName}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      
                      <div className="text-xs font-bold text-muted-foreground truncate w-full uppercase mt-2">
                        {fund.fundCategory}
                      </div>
                      
                      <h3 className="text-sm font-extrabold text-foreground truncate w-full mt-1.5 leading-snug">
                        {fund.schemeName}
                      </h3>
                      
                      <span className="text-[10px] text-muted-foreground font-data mt-1">
                        {fund.kuveraCode}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {/* Score */}
              {renderCompareRow(
                "Score",
                (f) => f.totalScore,
                (v) => (
                  <span className="inline-flex items-center justify-center rounded-md bg-primary/10 px-2.5 py-1 text-xs font-extrabold text-primary border border-primary/20">
                    {v ? parseFloat(v as string).toFixed(1) : "--"}
                  </span>
                )
              )}

              {/* NAV */}
              {renderCompareRow(
                "Current NAV",
                (f) => f.currentNav,
                (v) => formatINR(v),
                false,
                true
              )}

              {/* Returns */}
              {renderCompareRow(
                "1D Return",
                (f) => f.returns1d,
                (v, f) => isReturnGenuine(v, "1d", f) ? formatPercent(v, true, true) : "--"
              )}
              {renderCompareRow(
                "1W Return",
                (f) => f.returns1w,
                (v, f) => isReturnGenuine(v, "1w", f) ? formatPercent(v, true, true) : "--"
              )}
              {renderCompareRow(
                "1Y Return",
                (f) => f.returns1y,
                (v, f) => isReturnGenuine(v, "1y", f) ? formatPercent(v, true, true) : "--"
              )}
              {renderCompareRow(
                "3Y Return",
                (f) => f.returns3y,
                (v, f) => isReturnGenuine(v, "3y", f) ? formatPercent(v, true, true) : "--"
              )}
              {renderCompareRow(
                "5Y Return",
                (f) => f.returns5y,
                (v, f) => isReturnGenuine(v, "5y", f) ? formatPercent(v, true, true) : "--"
              )}
              {renderCompareRow(
                "Inception Return",
                (f) => f.returnsInception,
                (v) => formatPercent(v)
              )}

              {/* AUM */}
              {renderCompareRow(
                "Fund AUM",
                (f) => f.aum,
                (v) => formatAUM(v)
              )}

              {/* Expense Ratio (Lower is better) */}
              {renderCompareRow(
                "Expense Ratio",
                (f) => f.expenseRatio,
                (v) => (v ? `${v}%` : "--"),
                true // lowerIsBetter
              )}

              {/* Rating */}
              {renderCompareRow(
                "CRISIL Rating",
                (f) => f.fundRating,
                (v) => (v ? `★ ${v}` : "No Rating")
              )}

              {/* Std Dev Volatility (Lower is better) */}
              {renderCompareRow(
                "Volatility (StdDev)",
                (f) => f.volatility,
                (v) => (v ? parseFloat(v as string).toFixed(2) : "--"),
                true // lowerIsBetter
              )}

              {/* Portfolio Turnover */}
              {renderCompareRow(
                "Portfolio Turnover",
                (f) => f.portfolioTurnover,
                (v) => (v ? `${(parseFloat(v as string) * 100).toFixed(0)}%` : "--"),
                true // lowerIsBetter
              )}

              {/* Lock-In Period */}
              {renderCompareRow(
                "Lock-in Period",
                (f) => f.lockInPeriod,
                (v) => (v ? `${v} days` : "No Lock-in"),
                true
              )}

              {/* Fund Managers */}
              {renderCompareRow(
                "Fund Managers",
                (f) => f.fundManagers,
                (v) => parseManagers(v),
                false,
                false // not numeric
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-muted-foreground">Loading compare workspace...</div>}>
      <CompareContent />
    </Suspense>
  );
}
