"use client";
import { useSyncExternalStore, ViewTransition } from "react";

const QUERY = "(min-width: 768px)";
// One media query and one listener set, so every shared element switches in the same render
// (separate listeners would briefly leave the phone and laptop copies both named).
const listeners = new Set<() => void>();
let mql: MediaQueryList | null = null;
const subscribe = (cb: () => void) => {
  if (!mql) {
    mql = window.matchMedia(QUERY);
    mql.addEventListener("change", () => listeners.forEach((l) => l()));
  }
  listeners.add(cb);
  return () => listeners.delete(cb);
};

/** True on a laptop-width screen, false on a phone, null before hydration. */
export function useWide() {
  return useSyncExternalStore(
    subscribe,
    () => (mql ?? window.matchMedia(QUERY)).matches,
    () => null,
  );
}

/**
 * A fund's logo or name that morphs into the same element on the next page. Lists render a laptop and
 * a phone variant; only the laptop one takes the name, so names stay unique on the page.
 */
export function Shared({
  name,
  on,
  children,
}: {
  name: string;
  on?: "laptop" | "phone";
  children: React.ReactNode;
}) {
  const wide = useWide();
  // Laptop only: on a phone the whole screen pushes like a native app, and a logo flying across it fights that.
  const active = wide === true && on !== "phone";
  return (
    <ViewTransition
      name={active ? name : undefined}
      share="morph"
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
