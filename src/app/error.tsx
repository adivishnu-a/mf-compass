"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8">
        <h1 className="font-heading text-lg font-bold text-foreground">
          Something went wrong
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          The page could not be loaded. This is usually a temporary data
          connection problem.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/95"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Try Again
          </button>
          <Link
            href="/funds"
            className="inline-flex rounded-lg border border-border px-5 py-2.5 text-xs font-semibold text-foreground hover:bg-accent"
          >
            Back to Rankings
          </Link>
        </div>
      </div>
    </div>
  );
}
