"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ArrowLeft, ShieldAlert, Sparkles, RefreshCw } from "lucide-react";
import { useWatchlist } from "@/hooks/useWatchlist";
import { FundsTable } from "@/components/funds/FundsTable";
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

export default function WatchlistPage() {
  const router = useRouter();
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
        const res = await fetch(`/api/funds/by-codes?codes=${watchlist.join(",")}`);
        const data = await res.json();
        
        if (active) {
          if (data.success) {
            setFunds(data.data || []);
          } else {
            setError(data.error || "Failed to load watchlist details.");
          }
        }
      } catch (err) {
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
    return watchlist.filter((code) => !funds.some((f) => f.kuveraCode === code));
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
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
          <Heart className="h-6 w-6" />
        </div>
        <h2 className="font-heading text-lg font-bold text-foreground">Your watchlist is empty</h2>
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
          Create a personalized watchlist of mutual funds by clicking the heart button on the leaderboard or fund detail pages.
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
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Rankings
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-b border-border pb-6">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            My Saved Watchlist
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Monitor and compare your saved mutual funds. Sorted by performance score.
          </p>
        </div>
      </div>

      {/* Stale code alerts / F-014 */}
      {staleCodes.length > 0 && (
        <div className="mt-6 space-y-3">
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-200">
            <div className="flex gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <span className="font-heading font-bold text-xs text-foreground uppercase tracking-wider block">
                  Stale Funds Detected
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  We found <span className="font-semibold text-foreground font-data">{staleCodes.length}</span> fund(s) in your watchlist that are no longer actively tracked by our synchronization pipelines.
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveAllStale}
              className="text-xs font-bold text-destructive hover:underline shrink-0 self-start sm:self-center"
            >
              Clear Stale Funds
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {staleCodes.map((code) => (
              <div
                key={code}
                className="rounded-xl border border-border bg-card p-3 flex items-center justify-between gap-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-xs">
                  <span className="font-semibold text-foreground font-data">{code}</span>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">No longer monitored</span>
                </div>
                <button
                  onClick={() => handleRemoveStale(code)}
                  className="text-[10px] font-bold text-muted-foreground hover:text-destructive transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="mt-8 flex flex-col items-center justify-center py-20 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary border-r-2 border-transparent" />
          <p className="mt-4 text-xs text-muted-foreground">Retrieving watchlist details...</p>
        </div>
      )}

      {!loading && error && (
        <div className="mt-8 rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center animate-in fade-in duration-200">
          <p className="text-sm text-destructive font-medium">{error}</p>
        </div>
      )}

      {!loading && !error && funds.length > 0 && (
        <div className="mt-8 animate-in fade-in duration-200">
          <FundsTable funds={funds} />
        </div>
      )}
    </div>
  );
}
