import React from "react";

// Skeleton Table Loader for Quiet Luxury structure
export function SkeletonTable() {
  return (
    <div className="w-full animate-pulse overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="h-12 w-full border-b border-border bg-muted/20" />
      <div className="divide-y divide-border/60">
        {[...Array(10)].map((_, i) => (
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
