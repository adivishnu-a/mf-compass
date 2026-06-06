import { useState, useEffect } from "react";

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("mfc:watchlist");
    if (stored) {
      try {
        setWatchlist(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse watchlist", e);
      }
    }
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
