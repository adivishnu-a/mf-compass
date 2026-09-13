import React from "react";

// Skeleton Table Loader for Quiet Luxury structure
export function SkeletonTable() {
  return (
    <div className="w-full border border-border rounded-xl overflow-hidden bg-card animate-pulse shadow-sm">
      <div className="h-12 border-b border-border bg-muted/20 w-full" />
      <div className="divide-y divide-border/60">
        {[...Array(10)].map((_, i) => (
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
