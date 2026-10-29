"use client";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/utils";

/**
 * Category pills (mock: rankings), built like a segmented control. A switch glides the selection from the old
 * pill to the new one: for the glide, a second row of every pill in the selected style is laid over the first and
 * cut down to the moving selection, so every label is crisp white inside it and dark outside it at every frame.
 * The rest of the time the plain row shows the selected pill itself, so the server render is already right.
 *
 * Each category is its own page, so the row is rebuilt on every switch. What carries over is kept here: where
 * the row was scrolled and which pill was selected when one was tapped. While the content below crossfades, the
 * row takes no part in the page transition ("cat-pills" in globals.css), so its slide plays live on top.
 */
type Box = { left: number; width: number };
type Row = "phone" | "laptop";
const memory: Record<Row, { scroll: number; from: Box | null; at: number }> = {
  phone: { scroll: 0, from: null, at: 0 },
  laptop: { scroll: 0, from: null, at: 0 },
};
const EDGE = 16;
const FRESH_MS = 1500;
const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

/** A pill was just tapped: this page arrives by a category switch (read once, when the row mounts). */
const arrivingBySwitch = (row: Row) =>
  memory[row].from !== null && performance.now() - memory[row].at < FRESH_MS;
/** The selection to glide from, used up by the first row that reads it. */
function takeFrom(row: Row) {
  const from = memory[row].from;
  memory[row].from = null;
  return from;
}
const remember = (row: Row, patch: Partial<(typeof memory)[Row]>) =>
  Object.assign(memory[row], patch);
const savedScroll = (row: Row) => memory[row].scroll;

export function CategoryPills({
  current,
  phone,
}: {
  current: string;
  phone?: boolean;
}) {
  const key: Row = phone ? "phone" : "laptop";
  const nav = useRef<HTMLElement>(null);
  const cover = useRef<HTMLDivElement>(null);
  // Known at the first render, so the new page's row is already named when the transition captures it.
  const [switching] = useState(() => arrivingBySwitch(key));

  useLayoutEffect(() => {
    const row = nav.current;
    const top = cover.current;
    const pill = row?.querySelector<HTMLElement>(`li[data-slug="${current}"]`);
    if (!row || !top || !pill) return;
    const total = top.offsetWidth;
    const clip = (b: Box) =>
      `inset(0 ${total - b.left - b.width}px 0 ${b.left}px round 999px)`;
    const to = { left: pill.offsetLeft, width: pill.offsetWidth };

    // Keep the row where the user left it; if the chosen pill is cut off, glide just far enough to show it.
    row.scrollLeft = savedScroll(key);
    let left = row.scrollLeft;
    if (pill.offsetLeft < left + EDGE) left = pill.offsetLeft - EDGE;
    else if (pill.offsetLeft + pill.offsetWidth > left + row.clientWidth - EDGE)
      left = pill.offsetLeft + pill.offsetWidth - row.clientWidth + EDGE;
    left = Math.max(0, left);

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = takeFrom(key);
    if (left !== row.scrollLeft)
      row.scrollTo({
        left,
        behavior: switching && !reduce ? "smooth" : "auto",
      });
    remember(key, { scroll: left });
    if (switching && from && !reduce && from.left !== to.left) {
      // During the glide the destination pill looks plain; the overlay lands on it exactly, then steps aside.
      row.dataset.gliding = "";
      top.style.visibility = "visible";
      const glide = top.animate(
        [{ clipPath: clip(from) }, { clipPath: clip(to) }],
        { duration: 420, easing: EASE, fill: "forwards" },
      );
      glide.finished
        .catch(() => {})
        .finally(() => {
          delete row.dataset.gliding;
          top.style.visibility = "";
          glide.cancel();
        });
    }
    // The name is only for this switch: a forward push later must carry the row along with the page.
    if (switching) {
      const t = setTimeout(() => (row.style.viewTransitionName = ""), 600);
      return () => clearTimeout(t);
    }
  }, [current, key, switching]);

  const size = phone ? "h-9 px-3.5" : "h-10 px-4";
  const pill =
    "flex items-center rounded-full border text-[15px] whitespace-nowrap";
  const selected = "border-brand bg-brand font-semibold text-on-brand";
  const plain = "border-border bg-surface font-medium text-ink";

  return (
    <nav
      ref={nav}
      onScroll={(e) => remember(key, { scroll: e.currentTarget.scrollLeft })}
      aria-label="Kinds of fund"
      style={
        switching
          ? { viewTransitionName: phone ? "cat-pills-p" : "cat-pills" }
          : undefined
      }
      className={cn(
        "group [scrollbar-width:none] overflow-x-auto",
        phone ? "-mx-4 mt-3 px-4" : "mt-6 pb-1",
      )}
    >
      <div className="relative w-max">
        <ul className="flex gap-2">
          {CATEGORIES.map((c) => {
            const on = c.slug === current;
            return (
              <li key={c.slug} data-slug={c.slug}>
                <Link
                  href={`/funds/${c.slug}`}
                  transitionTypes={["category"]}
                  aria-current={on ? "page" : undefined}
                  scroll={false}
                  onClick={(e) => {
                    if (on) return;
                    const active = e.currentTarget
                      .closest("ul")
                      ?.querySelector<HTMLElement>(
                        `li[data-slug="${current}"]`,
                      );
                    remember(key, {
                      from: active
                        ? { left: active.offsetLeft, width: active.offsetWidth }
                        : null,
                      at: performance.now(),
                    });
                  }}
                  className={cn(
                    pill,
                    size,
                    on
                      ? `${selected} group-data-gliding:border-border group-data-gliding:bg-surface group-data-gliding:text-ink hover:text-on-brand`
                      : `${plain} hover:border-border-hover hover:text-ink`,
                  )}
                >
                  {c.label}
                </Link>
              </li>
            );
          })}
        </ul>
        {/* Every pill in the selected style, visible only during a glide and only through the moving clip.
            Same weights as the row beneath (bold for the current one), so each pill lies exactly on its twin. */}
        <div
          ref={cover}
          aria-hidden="true"
          className="pointer-events-none invisible absolute inset-0 flex gap-2"
        >
          {CATEGORIES.map((c) => (
            <span
              key={c.slug}
              className={cn(
                pill,
                size,
                selected,
                c.slug !== current && "font-medium",
              )}
            >
              {c.label}
            </span>
          ))}
        </div>
      </div>
    </nav>
  );
}
