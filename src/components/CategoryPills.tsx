"use client";
import Link from "next/link";
import { useLayoutEffect, useRef, ViewTransition } from "react";
import { CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/utils";

/** Where each row was scrolled, so the next category page opens with the row exactly where the user left it. */
const lastScroll = { phone: 0, laptop: 0 };
const EDGE = 16;

/** Category pills (mock: rankings). The active pill glides to its new place between categories. */
export function CategoryPills({
  current,
  phone,
}: {
  current: string;
  phone?: boolean;
}) {
  const nav = useRef<HTMLElement>(null);
  const key = phone ? "phone" : "laptop";
  // Each category is its own page. Keep the row still between them (a re-centred row makes every pill jump),
  // and scroll only if the chosen pill is cut off, just far enough to show it.
  useLayoutEffect(() => {
    const row = nav.current;
    const pill = row?.querySelector<HTMLElement>("[aria-current=page]");
    if (!row || !pill) return;
    let left = lastScroll[key];
    if (pill.offsetLeft < left + EDGE) left = pill.offsetLeft - EDGE;
    else if (pill.offsetLeft + pill.offsetWidth > left + row.clientWidth - EDGE)
      left = pill.offsetLeft + pill.offsetWidth - row.clientWidth + EDGE;
    row.scrollLeft = Math.max(0, left);
    lastScroll[key] = row.scrollLeft;
  }, [current, key]);
  return (
    <nav
      ref={nav}
      onScroll={(e) => (lastScroll[key] = e.currentTarget.scrollLeft)}
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
