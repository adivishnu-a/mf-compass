"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Heart, ArrowLeft, ShieldAlert } from "lucide-react";
import { useWatchlist } from "@/hooks/useWatchlist";
import { FundsTable } from "@/components/funds/FundsTable";

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

export default function WatchlistPage() {
  const { watchlist, toggleWatchlist } = useWatchlist();

  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch watchlist details
  useEffect(() => {
    if (watchlist.length === 0) {
      setFunds([]);
      setLoading(false);
      return;
    }

    let active = true;
    const fetchWatchlistFunds = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/funds/by-codes?codes=${watchlist.join(",")}`,
        );
        const data = await res.json();

        if (active) {
          if (data.success) {
            setFunds(data.data || []);
          } else {
            setError(data.error || "Failed to load watchlist details.");
          }
        }
      } catch {
        if (active) {
          setError("Failed to fetch watchlist details.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchWatchlistFunds();
    return () => {
      active = false;
    };
  }, [watchlist]);

  // Stale codes (watchlist entries that are no longer present in the database)
  const staleCodes = useMemo(() => {
    if (loading) return [];
    return watchlist.filter(
      (code) => !funds.some((f) => f.kuveraCode === code),
    );
  }, [watchlist, funds, loading]);

  const handleRemoveStale = (code: string) => {
    toggleWatchlist(code);
  };

  const handleRemoveAllStale = () => {
    staleCodes.forEach((code) => {
      toggleWatchlist(code);
    });
  };

  if (watchlist.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Heart className="h-6 w-6" />
        </div>
        <h2 className="font-heading text-lg font-bold text-foreground">
          Your watchlist is empty
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Create a personalized watchlist of mutual funds by clicking the heart
          button on the leaderboard or fund detail pages.
        </p>
        <Link
          href="/funds"
          className="mt-6 inline-flex rounded-lg bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/95"
        >
          Explore Leaderboards
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Back button */}
      <Link
        href="/funds"
        className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Rankings
      </Link>

      <div className="flex flex-col gap-6 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            My Saved Watchlist
          </h1>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            Monitor and compare your saved mutual funds.
          </p>
        </div>
      </div>

      {/* Stale code alerts / F-014 */}
      {staleCodes.length > 0 && (
        <div className="mt-6 space-y-3">
          <div className="animate-in fade-in flex flex-col justify-between gap-4 rounded-xl border border-destructive/20 bg-destructive/5 p-4 shadow-sm duration-200 sm:flex-row sm:items-center">
            <div className="flex gap-2">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div>
                <span className="block font-heading text-xs font-bold tracking-wider text-foreground uppercase">
                  Stale Funds Detected
                </span>
                <p className="mt-1 text-xs text-muted-foreground">
                  We found{" "}
                  <span className="font-data font-semibold text-foreground">
                    {staleCodes.length}
                  </span>{" "}
                  fund(s) in your watchlist that are no longer actively tracked
                  by our synchronization pipelines.
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveAllStale}
              className="shrink-0 self-start text-xs font-bold text-destructive hover:underline sm:self-center"
            >
              Clear Stale Funds
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {staleCodes.map((code) => (
              <div
                key={code}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="text-xs">
                  <span className="font-data font-semibold text-foreground">
                    {code}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-muted-foreground">
                    No longer monitored
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveStale(code)}
                  className="text-[10px] font-bold text-muted-foreground transition-colors hover:text-destructive"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="mt-8">
          <SkeletonTable />
        </div>
      )}

      {!loading && error && (
        <div className="animate-in fade-in mt-8 rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center duration-200">
          <p className="text-sm font-medium text-destructive">{error}</p>
        </div>
      )}

      {!loading && !error && funds.length > 0 && (
        <div className="animate-in fade-in mt-8 duration-200">
          <FundsTable funds={funds} />
        </div>
      )}
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="w-full animate-pulse overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="h-12 w-full border-b border-border bg-muted/20" />
      <div className="divide-y divide-border/60">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex w-full items-center gap-4 p-4">
            <div className="h-4 w-6 shrink-0 rounded-md bg-muted" />
            <div className="h-4 w-6 shrink-0 rounded-md bg-muted" />
            <div className="h-4 w-6 shrink-0 rounded-md bg-muted" />
            <div className="h-9 w-9 shrink-0 rounded-lg bg-muted" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-2/3 max-w-[200px] rounded-md bg-muted" />
              <div className="h-3 w-1/3 max-w-[120px] rounded-md bg-muted" />
            </div>
            <div className="h-6 w-12 shrink-0 rounded-md bg-muted" />
            <div className="hidden h-4 w-12 shrink-0 rounded-md bg-muted sm:block" />
            <div className="hidden h-4 w-12 shrink-0 rounded-md bg-muted sm:block" />
            <div className="hidden h-4 w-12 shrink-0 rounded-md bg-muted sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
