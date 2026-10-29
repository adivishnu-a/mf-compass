"use client";
import { useEffect, useRef } from "react";
import { animate, useReducedMotion } from "motion/react";
import { inr } from "@/lib/format";

const FORMATS = {
  score: (n: number) => n.toFixed(1),
  inr: (n: number) => inr(n),
  rupees: (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`,
  int: (n: number) => String(Math.round(n)),
};

/** A number that glides to its new value (350 ms) instead of jumping. Server renders the final value. */
export function AnimatedNumber({
  value,
  format,
  className,
}: {
  value: number;
  format: keyof typeof FORMATS;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(value);
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fmt = FORMATS[format];
    if (reduce || shown.current === value) {
      el.textContent = fmt(value);
      shown.current = value;
      return;
    }
    const c = animate(shown.current, value, {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        shown.current = v;
        el.textContent = fmt(v);
      },
    });
    return () => c.stop();
  }, [value, format, reduce]);
  return (
    <span ref={ref} className={className}>
      {FORMATS[format](value)}
    </span>
  );
}
