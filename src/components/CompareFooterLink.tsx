"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export function CompareFooterLink() {
  const [compareCodes, setCompareCodes] = useState<string[]>([]);

  useEffect(() => {
    const updateCodes = () => {
      try {
        const compare = JSON.parse(localStorage.getItem("mfc:compare") || "[]");
        setCompareCodes(compare);
      } catch (e) {
        console.error("Error loading compare codes in footer:", e);
      }
    };
    
    updateCodes();
    window.addEventListener("storage", updateCodes);
    window.addEventListener("mfc-compare-change", updateCodes);
    
    return () => {
      window.removeEventListener("storage", updateCodes);
      window.removeEventListener("mfc-compare-change", updateCodes);
    };
  }, []);

  const href = compareCodes.length > 0 ? `/compare?codes=${compareCodes.join(",")}` : "/compare";

  return (
    <Link href={href} className="text-muted-foreground hover:text-foreground transition-colors">
      Compare Funds
    </Link>
  );
}
