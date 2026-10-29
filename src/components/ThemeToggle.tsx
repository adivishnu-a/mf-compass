"use client";
import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { MoonIcon, SunIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

const KEY = "mfc:theme";

/**
 * Runs before paint: the saved theme, and the phone's status-bar colour to match, so a dark-mode visitor never
 * sees a light flash. It creates the theme-color tag itself; React or Next rendering one would add a second copy
 * after a script changes it.
 */
export const themeScript = `try{var d=localStorage.getItem("${KEY}")==="dark";if(d)document.documentElement.dataset.theme="dark";var m=document.createElement("meta");m.name="theme-color";m.content=d?"#152027":"#FFFFFF";document.head.appendChild(m)}catch(e){}`;

const listeners = new Set<() => void>();
const isDark = () => document.documentElement.dataset.theme === "dark";

function apply(dark: boolean) {
  if (dark) document.documentElement.dataset.theme = "dark";
  else delete document.documentElement.dataset.theme;
  try {
    localStorage.setItem(KEY, dark ? "dark" : "light");
  } catch {}
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", dark ? "#152027" : "#FFFFFF");
  listeners.forEach((l) => l());
}

/** Light/dark switch. The page crossfades between themes where the browser supports view transitions. */
export function ThemeToggle({ bordered }: { bordered?: boolean }) {
  const dark = useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    isDark,
    () => false,
  );
  function toggle() {
    const next = !isDark();
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (document.startViewTransition && !reduce)
      document.startViewTransition(() => flushSync(() => apply(next)));
    else apply(next);
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-[10px] text-text-2 hover:text-ink",
        bordered
          ? "border border-border bg-surface hover:border-border-hover"
          : "hover:bg-surface-2",
      )}
    >
      {/* Both icons, picked by the theme attribute the head script sets before paint. The server can't know the
          theme, so choosing in React would show the moon first and spin it into the sun on every dark load. */}
      <span className="grid place-items-center *:col-start-1 *:row-start-1 *:transition-[opacity,rotate,scale] *:duration-200 *:ease-[cubic-bezier(0.16,1,0.3,1)]">
        <span className="grid place-items-center dark:scale-70 dark:-rotate-40 dark:opacity-0">
          <MoonIcon />
        </span>
        <span className="grid scale-70 rotate-40 place-items-center opacity-0 dark:scale-100 dark:rotate-0 dark:opacity-100">
          <SunIcon />
        </span>
      </span>
    </button>
  );
}
