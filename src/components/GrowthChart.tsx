"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { animate, useReducedMotion } from "motion/react";
import type { Series } from "@/lib/growth";
import { dayOfDay, monthOfDay } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface Line {
  label: string;
  /** Raw prices (any scale); the chart shows them as growth of ₹100 from `fromDay`. */
  series: Series;
  color: string;
  /** The category average: thinner and grey, drawn solid so it stays still while the chart re-scales. */
  muted?: boolean;
  width?: number;
}

/** Value on day d, linearly between the points around it (so a moving start never jumps a week). */
function valueOn(s: Series, d: number) {
  let lo = 0;
  let hi = s.length - 1;
  if (!s.length || d < s[0][0]) return null;
  if (d >= s[hi][0]) return s[hi][1];
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (s[mid][0] <= d) lo = mid;
    else hi = mid;
  }
  const [d0, v0] = s[lo];
  const [d1, v1] = s[hi];
  return v0 + ((v1 - v0) * (d - d0)) / (d1 - d0 || 1);
}

const DAY = 86_400_000;
const yearOf = (d: number) => new Date(d * DAY).getUTCFullYear();

/**
 * Growth of ₹100 lines (mocks: fund page, compare). Changing `fromDay` glides the window and scale to
 * the new period. Hover, touch-drag or arrow keys read out every line's value on a date.
 */
export function GrowthChart({
  lines,
  fromDay,
  height,
  label,
  axis = true,
}: {
  lines: Line[];
  fromDay: number;
  height: number;
  label: string;
  axis?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  // The window's start, and while gliding to a new period, each line's ₹100 base.
  const [{ from, bases }, setFrame] = useState<{
    from: number;
    bases: (number | null)[] | null;
  }>({ from: fromDay, bases: null });
  const [hover, setHover] = useState<number | null>(null);
  const [drawn, setDrawn] = useState(false);
  const reduce = useReducedMotion();
  const shown = useRef<{ from: number; bases: (number | null)[] | null }>({
    from: fromDay,
    bases: null,
  });

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) =>
      setWidth(Math.round(e.contentRect.width)),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Gliding to a new period: the window slides, and each line's base eases from its old value to its new one.
  // Re-basing on the actual price at every in-between day instead would make a line twitch with each up and
  // down week it passes; the line the scale follows hides it, the other (the grey average) shows it.
  useEffect(() => {
    const start = shown.current;
    if (reduce || start.from === fromDay) {
      shown.current = { from: fromDay, bases: null };
      setFrame(shown.current);
      return;
    }
    const a = start.bases ?? lines.map((l) => valueOn(l.series, start.from));
    const b = lines.map((l) => valueOn(l.series, fromDay));
    const c = animate(0, 1, {
      duration: 0.55,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (p) => {
        shown.current = {
          from: start.from + (fromDay - start.from) * p,
          bases: b.map((end, i) => {
            const st = a[i];
            return st && end ? st * Math.pow(end / st, p) : end;
          }),
        };
        setFrame(shown.current);
      },
      onComplete: () => {
        shown.current = { from: fromDay, bases: null };
        setFrame(shown.current);
      },
    });
    return () => c.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lines are read at the start of each glide only
  }, [fromDay, reduce]);

  useEffect(() => {
    const t = setTimeout(() => setDrawn(true), 1100);
    return () => clearTimeout(t);
  }, []);

  const end = Math.max(...lines.map((l) => l.series.at(-1)?.[0] ?? 0));
  const geo = useMemo(() => {
    if (!width) return null;
    const visible = lines.map((l, i) => {
      const start = valueOn(l.series, from);
      const base = bases?.[i] ?? start;
      if (!base || !start) return [] as Series;
      const pts: Series = [[from, (start / base) * 100]];
      for (const [d, v] of l.series)
        if (d > from) pts.push([d, (v / base) * 100]);
      return pts;
    });
    let lo = Infinity;
    let hi = -Infinity;
    for (const s of visible)
      for (const [, v] of s) {
        lo = Math.min(lo, v);
        hi = Math.max(hi, v);
      }
    if (!Number.isFinite(lo)) return null;
    const pad = (hi - lo) * 0.08 || 2;
    lo -= pad;
    hi += pad;
    const sx = (d: number) => ((d - from) / (end - from || 1)) * width;
    const sy = (v: number) => (1 - (v - lo) / (hi - lo)) * height;
    const paths = visible.map((s) =>
      s
        .map(
          ([d, v], i) =>
            `${i ? "L" : "M"}${sx(d).toFixed(1)},${sy(v).toFixed(1)}`,
        )
        .join(""),
    );
    return { visible, sx, sy, paths };
  }, [lines, from, bases, end, width, height]);

  // x labels: start month, each new year that fits, end month.
  const ticks = useMemo(() => {
    if (!width) return [];
    const out: { d: number; text: string; align: "start" | "mid" | "end" }[] = [
      { d: from, text: monthOfDay(from), align: "start" },
    ];
    const years = yearOf(end) - yearOf(from);
    const every = Math.max(
      1,
      Math.ceil(years / Math.max(1, Math.floor(width / 90))),
    );
    for (let y = yearOf(from) + 1; y <= yearOf(end); y += every) {
      const d = Date.UTC(y, 0, 1) / DAY;
      const x = ((d - from) / (end - from)) * width;
      if (x > 70 && x < width - 70)
        out.push({ d, text: String(y), align: "mid" });
    }
    out.push({ d: end, text: monthOfDay(end), align: "end" });
    return out;
  }, [from, end, width]);

  const base = geo?.visible[0] ?? [];
  const at = hover !== null && base[hover] ? base[hover][0] : null;

  function pick(clientX: number) {
    if (!geo || !box.current || !base.length) return;
    const x = clientX - box.current.getBoundingClientRect().left;
    const d = from + (x / width) * (end - from);
    let best = 0;
    for (let i = 0; i < base.length; i++)
      if (Math.abs(base[i][0] - d) < Math.abs(base[best][0] - d)) best = i;
    setHover(best);
  }

  return (
    <div>
      <div
        ref={box}
        role="img"
        aria-label={label}
        tabIndex={0}
        className="relative touch-pan-y rounded-md select-none"
        style={{ height }}
        onPointerMove={(e) => pick(e.clientX)}
        onPointerDown={(e) => pick(e.clientX)}
        onPointerLeave={(e) => e.pointerType === "mouse" && setHover(null)}
        onPointerCancel={() => setHover(null)}
        onBlur={() => setHover(null)}
        onKeyDown={(e) => {
          if (!base.length) return;
          const step = e.shiftKey ? 13 : 1;
          if (e.key === "ArrowRight")
            setHover((h) => Math.min((h ?? -1) + step, base.length - 1));
          else if (e.key === "ArrowLeft")
            setHover((h) => Math.max((h ?? base.length) - step, 0));
          else if (e.key === "Escape") setHover(null);
          else return;
          e.preventDefault();
        }}
      >
        {geo && (
          <svg
            width={width}
            height={height}
            aria-hidden="true"
            className="block overflow-visible"
          >
            {[...lines].reverse().map((l, ri) => {
              const i = lines.length - 1 - ri;
              return (
                <path
                  key={l.label}
                  d={geo.paths[i]}
                  fill="none"
                  stroke={l.color}
                  strokeWidth={l.width ?? (l.muted ? 2 : 3)}
                  strokeDasharray={drawn || reduce ? undefined : 1}
                  pathLength={drawn || reduce ? undefined : 1}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  className={drawn || reduce ? undefined : "mfc-line"}
                />
              );
            })}
            {at !== null && (
              <g>
                <line
                  x1={geo.sx(at)}
                  x2={geo.sx(at)}
                  y1={0}
                  y2={height}
                  stroke="var(--track)"
                />
                {geo.visible.map((s, i) => {
                  const p = s.find(([d]) => d >= at);
                  return p ? (
                    <circle
                      key={i}
                      cx={geo.sx(p[0])}
                      cy={geo.sy(p[1])}
                      r={4}
                      fill={lines[i].color}
                      stroke="var(--surface)"
                      strokeWidth={2}
                    />
                  ) : null;
                })}
              </g>
            )}
          </svg>
        )}
        {geo && at !== null && (
          <div
            className="pointer-events-none absolute top-0 z-10 rounded-[10px] bg-surface px-3 py-2 text-[13px] shadow-menu"
            style={
              geo.sx(at) > width / 2
                ? { right: width - geo.sx(at) + 12 }
                : { left: geo.sx(at) + 12 }
            }
          >
            <p className="font-semibold text-ink">{dayOfDay(at)}</p>
            {geo.visible.map((s, i) => {
              const p = s.find(([d]) => d >= at);
              return (
                <p
                  key={i}
                  className="flex items-center gap-2 whitespace-nowrap text-text-2"
                >
                  <span
                    className="inline-block h-[3px] w-3 rounded"
                    style={{ background: lines[i].color }}
                  />
                  <span className="flex-1">{lines[i].label}</span>
                  <strong className="ml-3 text-ink">
                    {p ? `₹${Math.round(p[1])}` : "—"}
                  </strong>
                </p>
              );
            })}
          </div>
        )}
      </div>
      {axis && (
        <div
          className="relative mt-2 h-5 text-[13px] text-text-3"
          aria-hidden="true"
        >
          {ticks.map((t) => (
            <span
              key={`${t.text}-${t.align}`}
              className={cn(
                "absolute top-0 whitespace-nowrap",
                t.align === "mid" && "-translate-x-1/2",
              )}
              style={
                t.align === "end"
                  ? { right: 0 }
                  : { left: geo ? geo.sx(t.d) : 0 }
              }
            >
              {t.text}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function Legend({
  lines,
  className,
}: {
  lines: Pick<Line, "label" | "color" | "muted">[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-x-5 gap-y-1 text-sm text-text-2",
        className,
      )}
    >
      {lines.map((l) => (
        <span key={l.label} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="w-4"
            style={{
              height: l.muted ? 2 : 3,
              background: l.color,
              borderRadius: 2,
            }}
          />
          {l.label}
        </span>
      ))}
    </div>
  );
}
