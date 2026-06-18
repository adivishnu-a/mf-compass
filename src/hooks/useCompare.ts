import { useState, useEffect } from "react";
import { z } from "zod";

const compareListSchema = z.array(z.string());
const compareNamesSchema = z.record(z.string(), z.string());

export function useCompare() {
  const [compareList, setCompareList] = useState<string[]>([]);
  const [compareNames, setCompareNames] = useState<Record<string, string>>({});

  const loadCompare = () => {
    const stored = localStorage.getItem("mfc:compare");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const validated = compareListSchema.safeParse(parsed);
        if (validated.success) {
          setCompareList(validated.data);
        } else {
          console.warn("Invalid compare list schema in localStorage, resetting");
          setCompareList([]);
          localStorage.removeItem("mfc:compare");
        }
      } catch (e) {
        console.error("Failed to parse compare list", e);
        setCompareList([]);
        localStorage.removeItem("mfc:compare");
      }
    } else {
      setCompareList([]);
    }

    const storedNames = localStorage.getItem("mfc:compare_names");
    if (storedNames) {
      try {
        const parsed = JSON.parse(storedNames);
        const validated = compareNamesSchema.safeParse(parsed);
        if (validated.success) {
          setCompareNames(validated.data);
        } else {
          console.warn("Invalid compare names schema in localStorage, resetting");
          setCompareNames({});
          localStorage.removeItem("mfc:compare_names");
        }
      } catch (e) {
        console.error("Failed to parse compare names", e);
        setCompareNames({});
        localStorage.removeItem("mfc:compare_names");
      }
    } else {
      setCompareNames({});
    }
  };

  useEffect(() => {
    loadCompare();
    
    window.addEventListener("mfc-compare-change", loadCompare);
    return () => window.removeEventListener("mfc-compare-change", loadCompare);
  }, []);

  const toggleCompare = (code: string, name?: string) => {
    let nextList = [...compareList];
    const nextNames = { ...compareNames };

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
