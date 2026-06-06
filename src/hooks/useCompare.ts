import { useState, useEffect } from "react";

export function useCompare() {
  const [compareList, setCompareList] = useState<string[]>([]);
  const [compareNames, setCompareNames] = useState<Record<string, string>>({});

  const loadCompare = () => {
    const stored = localStorage.getItem("mfc:compare");
    if (stored) {
      try {
        setCompareList(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse compare list", e);
      }
    }
    const storedNames = localStorage.getItem("mfc:compare_names");
    if (storedNames) {
      try {
        setCompareNames(JSON.parse(storedNames));
      } catch (e) {
        console.error("Failed to parse compare names", e);
      }
    }
  };

  useEffect(() => {
    loadCompare();
    
    window.addEventListener("mfc-compare-change", loadCompare);
    return () => window.removeEventListener("mfc-compare-change", loadCompare);
  }, []);

  const toggleCompare = (code: string, name?: string) => {
    let nextList = [...compareList];
    let nextNames = { ...compareNames };

    if (compareList.includes(code)) {
      nextList = nextList.filter((c) => c !== code);
      delete nextNames[code];
    } else {
      if (nextList.length >= 3) {
        const removed = nextList.shift(); // Remove oldest
        if (removed) delete nextNames[removed];

        nextList.push(code);
        if (name) nextNames[code] = name;
        
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
        if (name) nextNames[code] = name;
      }
    }
    
    setCompareList(nextList);
    setCompareNames(nextNames);
    localStorage.setItem("mfc:compare", JSON.stringify(nextList));
    localStorage.setItem("mfc:compare_names", JSON.stringify(nextNames));
    window.dispatchEvent(new CustomEvent("mfc-compare-change"));
  };

  const clearCompare = () => {
    setCompareList([]);
    setCompareNames({});
    localStorage.setItem("mfc:compare", "[]");
    localStorage.setItem("mfc:compare_names", "{}");
    window.dispatchEvent(new CustomEvent("mfc-compare-change"));
  };

  return {
    compareList,
    compareNames,
    toggleCompare,
    clearCompare,
    isComparing: (code: string) => compareList.includes(code),
  };
}
