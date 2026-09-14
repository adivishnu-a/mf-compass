import type { Metadata } from "next";
import Link from "next/link";
import { Compass } from "lucide-react";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Compass className="h-6 w-6" />
      </div>
      <h1 className="font-heading text-lg font-bold text-foreground">
        Page not found
      </h1>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        This page does not exist, or the fund is no longer tracked. Funds drop
        out when their AUM falls under the threshold or they are merged.
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
