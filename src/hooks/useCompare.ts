import { useState, useEffect } from "react";

export function useCompare() {
  const [compareList, setCompareList] = useState<string[]>([]);

  const loadCompare = () => {
    const stored = localStorage.getItem("mfc:compare");
    if (stored) {
      try {
        setCompareList(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse compare list", e);
      }
    }
  };

  useEffect(() => {
    loadCompare();
    
    window.addEventListener("mfc-compare-change", loadCompare);
    return () => window.removeEventListener("mfc-compare-change", loadCompare);
  }, []);

  const toggleCompare = (code: string) => {
    let nextList = [...compareList];
    if (compareList.includes(code)) {
      nextList = nextList.filter((c) => c !== code);
    } else {
      if (nextList.length >= 3) {
        nextList.shift(); // Remove oldest
        nextList.push(code);
        
        window.dispatchEvent(
          new CustomEvent("mfc-toast", {
            detail: {
              message: "Maximum 3 funds. Replaced the oldest selected fund.",
              type: "warning",
            },
          })
        );
      } else {
        nextList.push(code);
      }
    }
    
    setCompareList(nextList);
    localStorage.setItem("mfc:compare", JSON.stringify(nextList));
    window.dispatchEvent(new CustomEvent("mfc-compare-change"));
  };

  const clearCompare = () => {
    setCompareList([]);
    localStorage.setItem("mfc:compare", "[]");
    window.dispatchEvent(new CustomEvent("mfc-compare-change"));
  };

  return {
    compareList,
    toggleCompare,
    clearCompare,
    isComparing: (code: string) => compareList.includes(code),
  };
}
