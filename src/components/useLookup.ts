"use client";
import { useEffect, useState } from "react";
import type { FundLookup } from "@/lib/data";

let request: Promise<FundLookup[]> | null = null;
let cached: FundLookup[] | null = null;

function load() {
  request ??= fetch("/api/funds/lookup")
    .then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json() as Promise<FundLookup[]>;
    })
    .then((f) => (cached = f))
    .catch((e) => {
      request = null;
      throw e;
    });
  return request;
}

/** Fetch the list while the browser is idle, so search shows results the moment it opens. */
export function prefetchLookup() {
  if (cached || request) return;
  const start = () => load().catch(() => {});
  if ("requestIdleCallback" in window)
    requestIdleCallback(start, { timeout: 3000 });
  else setTimeout(start, 1500);
}

/** Every fund's name, house, category and score, fetched once per page load and shared. */
export function useLookup(enabled = true) {
  const [funds, setFunds] = useState<FundLookup[] | null>(cached);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    // Another search on the page may have loaded the list after this one mounted.
    if (cached) {
      setFunds(cached);
      return;
    }
    let live = true;
    setFailed(false);
    load().then(
      (f) => live && setFunds(f),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [enabled]);
  return { funds, failed };
}
