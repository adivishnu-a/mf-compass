"use client";
import { useId } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/** Period/mode switch (mock: "1Y 3Y 5Y"): a white pill slides to the chosen option. */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  compact,
}: {
  label: string;
  options: { value: T; label: string; disabled?: boolean }[];
  value: T;
  onChange: (v: T) => void;
  compact?: boolean;
}) {
  const id = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex gap-0.5 rounded-[10px] bg-seg p-[3px]"
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative rounded-lg px-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-35",
              compact ? "h-8 min-w-11" : "h-[34px] min-w-[52px]",
              on ? "font-bold text-ink" : "text-text-2 hover:text-ink",
            )}
          >
            {on && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-lg bg-surface shadow-seg"
                transition={{ type: "spring", stiffness: 520, damping: 40 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
