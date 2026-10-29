"use client";
import { useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { flushSync } from "react-dom";
import { MoonIcon, SunIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

const KEY = "mfc:theme";

/** Runs before paint so a dark-mode visitor never sees a light flash. */
export const themeScript = `try{if(localStorage.getItem("${KEY}")==="dark")document.documentElement.dataset.theme="dark"}catch(e){}`;

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
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={dark ? "sun" : "moon"}
          initial={{ opacity: 0, rotate: -40, scale: 0.7 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 40, scale: 0.7 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="grid place-items-center"
        >
          {dark ? <SunIcon /> : <MoonIcon />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
