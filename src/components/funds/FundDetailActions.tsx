"use client";

import React from "react";
import { Heart, GitCompare } from "lucide-react";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useCompare } from "@/hooks/useCompare";
import { cn } from "@/lib/utils";

interface FundDetailActionsProps {
  kuveraCode: string;
  schemeName?: string;
}

export function FundDetailActions({
  kuveraCode,
  schemeName,
}: FundDetailActionsProps) {
  const { toggleWatchlist, isWatched } = useWatchlist();
  const { toggleCompare, isComparing } = useCompare();

  const isWatchChecked = isWatched(kuveraCode);
  const isCompareChecked = isComparing(kuveraCode);

  return (
    <div className="flex items-center gap-2">
      {/* Watchlist Toggle */}
      <button
        onClick={() => toggleWatchlist(kuveraCode)}
        className={cn(
          "flex cursor-pointer items-center gap-1.5 rounded border px-4 py-2 text-xs font-semibold transition-all duration-150 active:scale-98",
          isWatchChecked
            ? "border-rose-500/20 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
            : "border-border bg-card text-muted-foreground hover:border-muted-foreground hover:text-foreground",
        )}
      >
        <Heart
          className={cn(
            "h-4 w-4 transition-transform duration-200 active:scale-110",
            isWatchChecked
              ? "animate-heart-pop fill-rose-500 text-rose-500 opacity-100"
              : "opacity-80",
          )}
        />
        <span>
          {isWatchChecked ? "Saved in Watchlist" : "Save to Watchlist"}
        </span>
      </button>

      {/* Compare Toggle */}
      <button
        onClick={() => toggleCompare(kuveraCode, schemeName)}
        className={cn(
          "flex cursor-pointer items-center gap-1.5 rounded border px-4 py-2 text-xs font-bold transition-all duration-150",
          isCompareChecked
            ? "border-primary/20 bg-primary/10 text-primary hover:bg-primary/20"
            : "border-border bg-card text-muted-foreground hover:border-muted-foreground hover:text-foreground",
        )}
      >
        <GitCompare className="h-4 w-4" />
        <span>{isCompareChecked ? "Comparing Fund" : "Add to Compare"}</span>
      </button>
    </div>
  );
}
