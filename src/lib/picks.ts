"use client";
/**
 * Saved funds and the compare tray, kept in this browser only (no account). Survives reloads; a
 * blocked or private-mode storage just means the lists start empty.
 */
import { useSyncExternalStore } from "react";
import { COMPARE_MAX } from "@/lib/limits";

/** Where "Compare" goes: the comparison itself once two funds are picked, else the start page. */
export const compareHref = (codes: string[]) =>
  codes.length >= 2
    ? `/compare?funds=${codes.map(encodeURIComponent).join(",")}`
    : "/compare";

export { COMPARE_MAX };
const KEYS = { saved: "mfc:saved", compare: "mfc:compare" } as const;
type List = keyof typeof KEYS;

const EMPTY: string[] = [];
const cache: Record<List, string[] | null> = { saved: null, compare: null };
const listeners = new Set<() => void>();

function read(list: List): string[] {
  if (cache[list]) return cache[list];
  let value: string[] = EMPTY;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEYS[list]) ?? "[]");
    if (Array.isArray(parsed))
      value = parsed.filter((c): c is string => typeof c === "string");
  } catch {}
  cache[list] = value;
  return value;
}

function write(list: List, value: string[]) {
  cache[list] = value;
  try {
    localStorage.setItem(KEYS[list], JSON.stringify(value));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEYS.saved) cache.saved = null;
    if (e.key === KEYS.compare) cache.compare = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function usePicks(list: List) {
  const codes = useSyncExternalStore(
    subscribe,
    () => read(list),
    () => EMPTY,
  );
  return {
    codes,
    has: (code: string) => codes.includes(code),
    toggle(code: string) {
      const now = read(list);
      if (now.includes(code))
        write(
          list,
          now.filter((c) => c !== code),
        );
      else if (list === "compare" && now.length >= COMPARE_MAX) return false;
      else write(list, [...now, code]);
      return true;
    },
    set: (next: string[]) => write(list, next),
    clear: () => write(list, []),
  };
}
