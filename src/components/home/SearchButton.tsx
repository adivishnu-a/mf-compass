"use client";

import { Search } from "lucide-react";

export function SearchButton() {
  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent("mfc-open-search"))}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background/50 px-8 py-3 text-sm font-bold text-foreground transition-all hover:bg-accent"
    >
      <Search className="h-4 w-4" /> Search Funds
    </button>
  );
}
