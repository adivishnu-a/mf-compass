"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { compareHref, usePicks } from "@/lib/picks";
import { cn } from "@/lib/utils";

const TABS = [
  {
    href: "/",
    label: "Home",
    match: (p: string) => p === "/",
    icon: (on: boolean) => (
      <path
        d="M4 10.5 12 4l8 6.5V20h-5v-6H9v6H4z"
        fill={on ? "currentColor" : "none"}
      />
    ),
  },
  {
    href: "/funds",
    label: "Explore",
    match: (p: string) => p.startsWith("/funds"),
    icon: (on: boolean) =>
      on ? (
        <>
          <circle cx="12" cy="12" r="9" fill="currentColor" stroke="none" />
          <polygon
            points="16.2,7.8 13.4,13.4 10.6,10.6"
            fill="var(--marigold)"
            stroke="none"
          />
          <polygon
            points="7.8,16.2 10.6,10.6 13.4,13.4"
            fill="var(--surface)"
            stroke="none"
          />
        </>
      ) : (
        <>
          <circle cx="12" cy="12" r="9" fill="none" />
          <path d="m15.5 8.5-2 5-5 2 2-5z" fill="none" />
        </>
      ),
  },
  {
    href: "/compare",
    label: "Compare",
    match: (p: string) => p.startsWith("/compare"),
    icon: (on: boolean) => (
      <>
        <rect
          x="3"
          y="5"
          width="7"
          height="14"
          rx="1.5"
          fill={on ? "currentColor" : "none"}
        />
        <rect
          x="14"
          y="5"
          width="7"
          height="14"
          rx="1.5"
          fill={on ? "currentColor" : "none"}
        />
      </>
    ),
  },
  {
    href: "/saved",
    label: "Saved",
    match: (p: string) => p.startsWith("/saved"),
    icon: (on: boolean) => (
      <path d="M6 4h12v16l-6-4-6 4z" fill={on ? "currentColor" : "none"} />
    ),
  },
];

/** Phone tab bar (mocks: PhoneHome, phone rankings). Pages with their own action bar hide it. */
export function TabBar() {
  const path = usePathname();
  const params = useSearchParams();
  const compare = usePicks("compare");
  // The fund page, a comparison in progress and the finder bring their own bottom bar.
  const hidden =
    path.startsWith("/fund/") ||
    path.startsWith("/finder") ||
    (path.startsWith("/compare") && params.get("funds"));
  if (hidden) return null;
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[max(14px,env(safe-area-inset-bottom))] md:hidden"
      style={{ viewTransitionName: "tab-bar" }}
    >
      <ul className="grid h-[66px] grid-cols-4">
        {TABS.map((t) => {
          const on = t.match(path);
          const badge = t.href === "/compare" ? compare.codes.length : 0;
          return (
            <li key={t.href}>
              <Link
                href={
                  t.href === "/compare" ? compareHref(compare.codes) : t.href
                }
                aria-current={on ? "page" : undefined}
                aria-label={badge ? `${t.label}, ${badge} picked` : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-0.5 text-xs",
                  on ? "font-bold text-brand" : "text-text-3 hover:text-text-2",
                )}
              >
                <motion.span
                  className="relative"
                  animate={{ scale: on ? 1 : 0.94 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    {t.icon(on)}
                  </svg>
                  {badge > 0 && (
                    <motion.span
                      key={badge}
                      initial={{ scale: 0.4 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 600,
                        damping: 20,
                      }}
                      className="absolute -top-1 -right-2 grid h-4 min-w-4 place-items-center rounded-full bg-marigold px-1 text-[10px] font-bold text-[#13212A] ring-1 ring-surface"
                    >
                      {badge}
                    </motion.span>
                  )}
                </motion.span>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
