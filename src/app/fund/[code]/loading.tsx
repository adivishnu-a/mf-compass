import React from "react";
import { ArrowLeft } from "lucide-react";

export default function FundDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Back button placeholder */}
      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground/45 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Rankings
      </div>

      {/* Header Skeleton */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm animate-pulse">
        <div className="flex items-start gap-4">
          {/* AMC Logo skeleton */}
          <div className="h-12 w-12 rounded-lg bg-muted shrink-0 mt-1.5" />
          
          <div className="flex-1 min-w-0 space-y-3">
            {/* Category / Type Badge skeleton */}
            <div className="h-4.5 w-36 rounded-full bg-muted" />
            
            {/* Scheme Name skeleton */}
            <div className="space-y-1.5">
              <div className="h-7 w-3/4 max-w-[400px] rounded bg-muted" />
            </div>

            {/* Tags skeleton */}
            <div className="flex flex-wrap gap-2 pt-1">
              <div className="h-4.5 w-20 rounded-full bg-muted" />
              <div className="h-4.5 w-24 rounded-full bg-muted" />
            </div>
          </div>

          {/* NAV / Score skeleton: desktop only */}
          <div className="hidden md:flex flex-col items-end gap-4 shrink-0 pl-6 border-l border-border/60 w-32">
            <div className="h-10 w-24 rounded bg-muted" />
            <div className="h-8 w-20 rounded bg-muted" />
          </div>
        </div>

        {/* NAV / Score skeleton: mobile only */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/60 md:hidden">
          <div className="h-10 w-24 rounded bg-muted" />
          <div className="h-8 w-20 rounded bg-muted" />
        </div>

        {/* Action Buttons placeholder */}
        <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between gap-3">
          <div className="hidden md:flex items-center gap-2">
            <div className="h-3.5 w-32 rounded bg-muted" />
            <div className="h-3.5 w-4 rounded bg-muted" />
            <div className="h-3.5 w-24 rounded bg-muted" />
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <div className="h-9 w-24 rounded-lg bg-muted" />
            <div className="h-9 w-28 rounded-lg bg-muted" />
          </div>
        </div>
      </div>

      {/* Returns Grid Skeleton */}
      <div className="mt-10 animate-pulse">
        <div className="h-6 w-56 rounded bg-muted mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 h-28 flex flex-col justify-between shadow-sm">
              <div className="space-y-2">
                <div className="h-3.5 w-20 rounded bg-muted" />
                <div className="h-5 w-16 rounded bg-muted" />
              </div>
              <div className="border-t border-border/40 pt-2 flex justify-between">
                <div className="h-3 w-12 rounded bg-muted" />
                <div className="h-3 w-8 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Parameters Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 animate-pulse">
        {[...Array(2)].map((_, colIdx) => (
          <div key={colIdx} className="rounded-xl border border-border bg-card p-6 flex flex-col gap-5 shadow-sm">
            <div className="h-5 w-36 rounded bg-muted border-b border-border/60 pb-2" />
            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              {[...Array(4)].map((_, itemIdx) => (
                <div key={itemIdx} className="space-y-1.5">
                  <div className="h-3.5 w-16 rounded bg-muted" />
                  <div className="h-4.5 w-24 rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
