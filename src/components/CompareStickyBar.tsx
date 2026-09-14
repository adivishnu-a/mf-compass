"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { GitCompare, X } from "lucide-react";
import { useCompare } from "@/hooks/useCompare";
import { cn } from "@/lib/utils";

export function CompareStickyBar() {
  const router = useRouter();
  const { compareList, compareNames, clearCompare } = useCompare();

  const handleCompareClick = () => {
    if (compareList.length >= 2) {
      router.push(`/compare?codes=${compareList.join(",")}`);
    }
  };

  return (
    <>
      <div
        className={cn(
          "fixed bottom-6 left-1/2 z-30 w-[92%] max-w-3xl -translate-x-1/2 transform-gpu rounded-2xl border border-border bg-card/90 p-4 shadow-2xl backdrop-blur-md transition-all duration-300 ease-out",
          compareList.length === 0
            ? "pointer-events-none translate-y-[calc(100%+24px)] opacity-0"
            : "translate-y-0 opacity-100",
        )}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Status Text */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
              <GitCompare className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <div className="font-heading text-xs font-medium text-foreground sm:text-sm">
                Compare list{" "}
                <span className="font-data font-bold">
                  ({compareList.length}/3)
                </span>
                <span className="xs:inline ml-1.5 hidden font-normal text-muted-foreground">
                  — Min 2 funds
                </span>
              </div>

              <div className="mt-1 hidden max-w-md items-center text-[11px] text-muted-foreground md:flex">
                {compareList.map((code, index) => (
                  <React.Fragment key={code}>
                    <span
                      className="max-w-[140px] truncate font-medium text-foreground/80"
                      title={compareNames[code] || code}
                    >
                      {compareNames[code] || code}
                    </span>
                    {index < compareList.length - 1 && (
                      <span className="px-1.5 text-[9px] font-bold text-muted-foreground/40 uppercase">
                        vs
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={clearCompare}
              className="flex items-center gap-1 rounded-lg border border-border bg-transparent px-3 py-2 text-xs font-semibold text-muted-foreground transition-all hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>

            <button
              key={compareList.length >= 2 ? "enabled" : "disabled"}
              onClick={handleCompareClick}
              disabled={compareList.length < 2}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
                compareList.length >= 2
                  ? "animate-button-pop cursor-pointer bg-primary text-primary-foreground hover:bg-primary/95"
                  : "cursor-not-allowed border border-border bg-muted text-muted-foreground/50",
              )}
            >
              <GitCompare className="h-3.5 w-3.5" />
              <span>Compare</span>
            </button>
          </div>
        </div>
      </div>
      {/* Keeps the page bottom reachable while the bar is showing. */}
      <div
        aria-hidden
        className={cn("h-28", compareList.length === 0 && "hidden")}
      />
    </>
  );
}
export default CompareStickyBar;
