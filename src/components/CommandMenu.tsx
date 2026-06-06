"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, TrendingUp, History } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: number;
  kuveraCode: string;
  schemeName: string;
  fundHouseName: string;
  fundCategory: string;
  totalScore: string | number;
}

interface RecentSearch {
  kuveraCode: string;
  schemeName: string;
}

export function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches
  const loadRecentSearches = () => {
    try {
      const stored = localStorage.getItem("mfc:recent-searches");
      setRecentSearches(stored ? JSON.parse(stored) : []);
    } catch (e) {
      console.error("Failed to load recent searches", e);
    }
  };

  const saveRecentSearch = (fund: { kuveraCode: string; schemeName: string }) => {
    try {
      const stored = localStorage.getItem("mfc:recent-searches");
      let list: RecentSearch[] = stored ? JSON.parse(stored) : [];
      
      // Filter out existing occurrence of same code
      list = list.filter((item) => item.kuveraCode !== fund.kuveraCode);
      
      // Add to front of list
      list.unshift({ kuveraCode: fund.kuveraCode, schemeName: fund.schemeName });
      
      // Limit to 5
      const truncated = list.slice(0, 5);
      localStorage.setItem("mfc:recent-searches", JSON.stringify(truncated));
      setRecentSearches(truncated);
    } catch (e) {
      console.error("Failed to save recent search", e);
    }
  };

  // Listen to keyboard shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Listen to custom open event
  useEffect(() => {
    const handleOpen = () => {
      setOpen(true);
    };
    
    window.addEventListener("mfc-open-search", handleOpen);
    return () => window.removeEventListener("mfc-open-search", handleOpen);
  }, []);

  // Auto-focus input on open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 50);
      loadRecentSearches();
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  // Debounced Search API fetch
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`/api/funds/search?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (json.success) {
          setResults(json.data || []);
          setSelectedIndex(0);
        }
      } catch (err) {
        console.error("Search fetch error", err);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Keyboard navigation inside modal
  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    const itemsCount = query.trim().length < 2 ? recentSearches.length : results.length;
    
    if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(itemsCount, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + itemsCount) % Math.max(itemsCount, 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (query.trim().length < 2) {
        // Navigate to highlighted recent search
        const selected = recentSearches[selectedIndex];
        if (selected) {
          handleSelectFund(selected.kuveraCode, selected.schemeName);
        }
      } else {
        // Navigate to highlighted search result
        const selected = results[selectedIndex];
        if (selected) {
          handleSelectFund(selected.kuveraCode, selected.schemeName);
        }
      }
    }
  };

  const handleSelectFund = (code: string, name: string) => {
    saveRecentSearch({ kuveraCode: code, schemeName: name });
    setOpen(false);
    router.push(`/fund/${code}`);
  };

  if (!open) return null;

  const showRecent = query.trim().length < 2;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 p-4 pt-[10vh] backdrop-blur-sm">
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={() => setOpen(false)} />

      <div
        ref={modalRef}
        onKeyDown={handleModalKeyDown}
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Search Input Box */}
        <div className="flex items-center border-b border-border px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search mutual funds (e.g. moti mid)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-foreground placeholder-muted-foreground focus:outline-none"
          />
          <button
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[350px] overflow-y-auto p-2">
          {loading && (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              Searching data...
            </div>
          )}

          {!loading && showRecent && (
            <div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <History className="h-3.5 w-3.5" /> Recent Searches
              </div>
              {recentSearches.length === 0 ? (
                <div className="px-3 py-4 text-xs text-muted-foreground text-center">
                  No recent searches. Try searching for "Axis" or "Motilal".
                </div>
              ) : (
                <div className="space-y-0.5 mt-1">
                  {recentSearches.map((item, idx) => (
                    <button
                      key={item.kuveraCode}
                      onClick={() => handleSelectFund(item.kuveraCode, item.schemeName)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors",
                        selectedIndex === idx
                          ? "bg-accent text-foreground font-medium"
                          : "text-muted-foreground hover:bg-accent/40"
                      )}
                    >
                      <span className="truncate max-w-[400px]">{item.schemeName}</span>
                      <span className="text-[10px] font-data text-muted-foreground/60">{item.kuveraCode}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {!loading && !showRecent && results.length === 0 && (
            <div className="px-3 py-6 text-sm text-muted-foreground text-center">
              No results found for "{query}"
            </div>
          )}

          {!loading && !showRecent && results.length > 0 && (
            <div className="space-y-0.5">
              <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Search Results ({results.length})
              </div>
              {results.map((fund, idx) => (
                <button
                  key={fund.kuveraCode}
                  onClick={() => handleSelectFund(fund.kuveraCode, fund.schemeName)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors",
                    selectedIndex === idx
                      ? "bg-accent text-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent/40"
                  )}
                >
                  <div className="flex flex-col truncate pr-4">
                    <span className="text-sm text-foreground truncate font-heading font-medium">
                      {fund.schemeName}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate mt-0.5">
                      {fund.fundCategory} • {fund.fundHouseName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="inline-flex items-center justify-center rounded-md bg-primary/10 px-2 py-1 text-xs font-bold text-primary font-data border border-primary/20">
                      Score {parseFloat(fund.totalScore as string).toFixed(1)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between border-t border-border/80 bg-muted/30 px-4 py-2.5 text-[10px] text-muted-foreground select-none">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="rounded border border-border bg-card px-1 font-data">↑↓</kbd> Navigate
            </span>
            <span>
              <kbd className="rounded border border-border bg-card px-1 font-data">Enter</kbd> Select
            </span>
            <span>
              <kbd className="rounded border border-border bg-card px-1 font-data">Esc</kbd> Close
            </span>
          </div>
          <span className="hidden sm:inline">MF Compass</span>
        </div>
      </div>
    </div>
  );
}
