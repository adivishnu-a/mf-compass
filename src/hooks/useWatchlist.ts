import { useState, useEffect } from "react";
import { z } from "zod";

const watchlistSchema = z.array(z.string());

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>([]);

  const loadWatchlist = () => {
    const stored = localStorage.getItem("mfc:watchlist");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const validated = watchlistSchema.safeParse(parsed);
        if (validated.success) {
          setWatchlist(validated.data);
        } else {
          console.warn("Invalid watchlist schema in localStorage, resetting");
          setWatchlist([]);
          localStorage.removeItem("mfc:watchlist");
        }
      } catch (e) {
        console.error("Failed to parse watchlist", e);
        setWatchlist([]);
        localStorage.removeItem("mfc:watchlist");
      }
    } else {
      setWatchlist([]);
    }
  };

  useEffect(() => {
    loadWatchlist();
    window.addEventListener("mfc-watchlist-change", loadWatchlist);
    return () => window.removeEventListener("mfc-watchlist-change", loadWatchlist);
  }, []);

  const toggleWatchlist = (code: string) => {
    let nextList: string[];
    if (watchlist.includes(code)) {
      nextList = watchlist.filter((c) => c !== code);
    } else {
      nextList = [...watchlist, code];
      if (nextList.length > 200) {
        nextList.shift(); // drop oldest at limit
      }
    }
    setWatchlist(nextList);
    localStorage.setItem("mfc:watchlist", JSON.stringify(nextList));
    window.dispatchEvent(new CustomEvent("mfc-watchlist-change"));
  };

  return {
    watchlist,
    toggleWatchlist,
    isWatched: (code: string) => watchlist.includes(code),
  };
}
