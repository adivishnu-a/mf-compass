"use client";
import Link from "next/link";
import { useLayoutEffect, useRef, ViewTransition } from "react";
import { CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/utils";

/** Category pills (mock: rankings). The active pill glides to its new place between categories. */
export function CategoryPills({
  current,
  phone,
}: {
  current: string;
  phone?: boolean;
}) {
  const nav = useRef<HTMLElement>(null);
  // Each category is its own page, so the row starts scrolled to the left; bring the active pill into view.
  useLayoutEffect(() => {
    const row = nav.current;
    const pill = row?.querySelector<HTMLElement>("[aria-current=page]");
    if (row && pill && row.scrollWidth > row.clientWidth)
      row.scrollLeft =
        pill.offsetLeft - (row.clientWidth - pill.offsetWidth) / 2;
  }, [current]);
  return (
    <nav
      ref={nav}
      aria-label="Kinds of fund"
      className={cn(
        "relative [scrollbar-width:none] overflow-x-auto",
        phone ? "-mx-4 mt-3 px-4" : "mt-6 pb-1",
      )}
    >
      <ul className="flex w-max gap-2">
        {CATEGORIES.map((c) => {
          const on = c.slug === current;
          const cls = cn(
            "flex items-center rounded-full border text-[15px] whitespace-nowrap",
            phone ? "h-9 px-3.5" : "h-10 px-4",
            on
              ? "border-brand bg-brand font-semibold text-on-brand hover:text-on-brand"
              : "border-border bg-surface font-medium text-ink hover:border-border-hover hover:text-ink",
          );
          const link = (
            <Link
              href={`/funds/${c.slug}`}
              aria-current={on ? "page" : undefined}
              scroll={false}
              className={cls}
            >
              {c.label}
            </Link>
          );
          // The active pill moves with its label inside it: a separate background would be drawn over
          // the labels while it glides, hiding them for a moment.
          return (
            <li key={c.slug}>
              {on ? (
                <ViewTransition
                  name={phone ? "cat-pill-p" : "cat-pill"}
                  share="pill"
                  default="none"
                >
                  {link}
                </ViewTransition>
              ) : (
                link
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
