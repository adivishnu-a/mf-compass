"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface AmcLogoProps {
  fundHouse: string | null;
  fundHouseName: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}

function getAmcInitials(name: string | null) {
  if (!name) return "MF";
  const clean = name.replace(/mutual\s+fund/i, "").trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

function getAmcColorClass(name: string | null) {
  if (!name) return "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = [
    "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/40",
    "bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200/50 dark:border-teal-900/40",
    "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/40",
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-900/40",
    "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200/50 dark:border-orange-900/40",
  ];
  return colors[hash % colors.length];
}

export function AmcLogo({ fundHouse, fundHouseName, className, size = "md" }: AmcLogoProps) {
  const [hasError, setHasError] = useState(!fundHouse);

  const sizeClasses = {
    sm: "h-8 w-8 text-[10px]",
    md: "h-9 w-9 text-xs",
    lg: "h-14 w-14 text-lg",
  };

  if (hasError) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg font-heading font-bold shadow-sm",
          getAmcColorClass(fundHouseName),
          sizeClasses[size],
          className
        )}
      >
        {getAmcInitials(fundHouseName)}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg shadow-sm overflow-hidden",
        sizeClasses[size],
        className
      )}
    >
      <img
        src={`/logos/amc/${fundHouse}.png`}
        alt={fundHouseName || "AMC Logo"}
        className="w-full h-full object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  );
}
