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
    <div 
      className={cn(
        "fixed bottom-6 left-1/2 z-30 w-[92%] max-w-3xl rounded-2xl border border-border bg-card/90 p-4 shadow-2xl backdrop-blur-md transition-all duration-300 ease-out transform-gpu -translate-x-1/2",
        compareList.length === 0
          ? "translate-y-[calc(100%+24px)] opacity-0 pointer-events-none"
          : "translate-y-0 opacity-100"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Status Text */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
            <GitCompare className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <div className="text-xs sm:text-sm font-heading font-medium text-foreground">
              Compare list <span className="font-data font-bold">({compareList.length}/3)</span>
              <span className="hidden xs:inline text-muted-foreground ml-1.5 font-normal">
                — Min 2 funds
              </span>
            </div>
            
            <div className="hidden md:flex items-center mt-1 text-[11px] text-muted-foreground max-w-md">
              {compareList.map((code, index) => (
                <React.Fragment key={code}>
                  <span className="truncate max-w-[140px] font-medium text-foreground/80" title={compareNames[code] || code}>
                    {compareNames[code] || code}
                  </span>
                  {index < compareList.length - 1 && (
                    <span className="px-1.5 text-[9px] font-bold text-muted-foreground/40 uppercase">vs</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={clearCompare}
            className="flex items-center gap-1 rounded-lg border border-border bg-transparent px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <X className="h-3.5 w-3.5" />
            <span>Clear</span>
          </button>
          
          <button
            onClick={handleCompareClick}
            disabled={compareList.length < 2}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              compareList.length >= 2
                ? "bg-primary text-primary-foreground hover:bg-primary/95 cursor-pointer"
                : "bg-muted text-muted-foreground/50 border border-border cursor-not-allowed"
            )}
          >
            <GitCompare className="h-3.5 w-3.5" />
            <span>Compare</span>
          </button>
        </div>
      </div>
    </div>
  );
}
export default CompareStickyBar;
