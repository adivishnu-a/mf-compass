"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Mark } from "@/components/Mark";
import { SearchField } from "@/components/SearchField";
import { ThemeToggle } from "@/components/ThemeToggle";
import { compareHref, usePicks } from "@/lib/picks";
import { cn } from "@/lib/utils";

const NAV = [
  {
    href: "/funds",
    label: "Explore",
    match: (p: string) => p.startsWith("/funds") || p.startsWith("/fund/"),
  },
  {
    href: "/compare",
    label: "Compare",
    match: (p: string) => p.startsWith("/compare"),
  },
  {
    href: "/saved",
    label: "Saved",
    match: (p: string) => p.startsWith("/saved"),
  },
];

/** Laptop header (mock: every laptop board). Phones use each page's own top bar and the tab bar. */
export function Header({ total }: { total: number | null }) {
  const path = usePathname();
  const compare = usePicks("compare");
  return (
    <header
      className="relative z-40 hidden border-b border-border bg-surface md:block"
      style={{ viewTransitionName: "site-header" }}
    >
      <div className="mx-auto flex max-w-[1280px] items-center gap-6 px-8 py-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-ink hover:text-ink"
          aria-label="MF Compass home"
        >
          <Mark size={32} />
          <span className="text-[19px] font-bold tracking-[-0.01em]">
            MF Compass
          </span>
        </Link>
        <nav aria-label="Main" className="flex gap-1">
          {NAV.map((n) => {
            const on = n.match(path);
            return (
              <Link
                key={n.href}
                href={
                  n.href === "/compare" ? compareHref(compare.codes) : n.href
                }
                aria-current={on ? "page" : undefined}
                className={cn(
                  "relative rounded-lg px-3 py-2",
                  on
                    ? "font-semibold text-brand-ink"
                    : "font-medium text-text-2 hover:text-ink",
                )}
              >
                {on && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-lg bg-brand-soft"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
                <span className="relative">{n.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="flex-1" />
        {/* One search field per page: a page with its own (home, not found) hides this one (globals.css). */}
        <div className="header-search">
          <SearchField
            variant="header"
            placeholder={`Search ${total ? `${total} ` : ""}funds, e.g. HDFC mid`}
          />
        </div>
        <ThemeToggle bordered />
      </div>
    </header>
  );
}
