import React from "react";
import { ArrowLeft } from "lucide-react";

export default function FundDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Back button placeholder */}
      <div className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground/45">
        <ArrowLeft className="h-4 w-4" /> Back to Rankings
      </div>

      {/* Header Skeleton */}
      <div className="animate-pulse rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-4">
          {/* AMC Logo skeleton */}
          <div className="mt-1.5 h-12 w-12 shrink-0 rounded-lg bg-muted" />

          <div className="min-w-0 flex-1 space-y-3">
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
          <div className="hidden w-32 shrink-0 flex-col items-end gap-4 border-l border-border/60 pl-6 md:flex">
            <div className="h-10 w-24 rounded bg-muted" />
            <div className="h-8 w-20 rounded bg-muted" />
          </div>
        </div>

        {/* NAV / Score skeleton: mobile only */}
        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-4 md:hidden">
          <div className="h-10 w-24 rounded bg-muted" />
          <div className="h-8 w-20 rounded bg-muted" />
        </div>

        {/* Action Buttons placeholder */}
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-4">
          <div className="hidden items-center gap-2 md:flex">
            <div className="h-3.5 w-32 rounded bg-muted" />
            <div className="h-3.5 w-4 rounded bg-muted" />
            <div className="h-3.5 w-24 rounded bg-muted" />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="h-9 w-24 rounded-lg bg-muted" />
            <div className="h-9 w-28 rounded-lg bg-muted" />
          </div>
        </div>
      </div>

      {/* Returns Grid Skeleton */}
      <div className="mt-10 animate-pulse">
        <div className="mb-4 h-6 w-56 rounded bg-muted" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex h-28 flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="space-y-2">
                <div className="h-3.5 w-20 rounded bg-muted" />
                <div className="h-5 w-16 rounded bg-muted" />
              </div>
              <div className="flex justify-between border-t border-border/40 pt-2">
                <div className="h-3 w-12 rounded bg-muted" />
                <div className="h-3 w-8 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Parameters Skeleton */}
      <div className="mt-10 grid animate-pulse grid-cols-1 gap-6 md:grid-cols-2">
        {[...Array(2)].map((_, colIdx) => (
          <div
            key={colIdx}
            className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="h-5 w-36 rounded border-b border-border/60 bg-muted pb-2" />
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
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
