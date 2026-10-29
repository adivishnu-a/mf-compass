"use client";
import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckIcon, ChevronDown } from "@/components/icons";
import { cn } from "@/lib/utils";

export interface Option<T extends string> {
  value: T;
  label: string;
  note?: string;
}

/**
 * A themed select (mock: LaptopFund "Since"): button + listbox popup with the keyboard model of a
 * native select (arrows, Home/End, Enter/Space, Escape, type-ahead). Opens and closes with motion.
 */
export function Listbox<T extends string>({
  label,
  options,
  value,
  onChange,
  align = "start",
  className,
  size = "md",
}: {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  align?: "start" | "end";
  className?: string;
  size?: "sm" | "md";
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const typed = useRef({ text: "", at: 0 });
  const selected = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );

  useEffect(() => {
    if (!open) return;
    list.current?.focus({ preventScroll: true });
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  useEffect(() => {
    const ul = list.current;
    const li = ul?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    if (!open || !ul || !li) return;
    if (li.offsetTop < ul.scrollTop) ul.scrollTop = li.offsetTop - 6;
    else if (li.offsetTop + li.offsetHeight > ul.scrollTop + ul.clientHeight)
      ul.scrollTop = li.offsetTop + li.offsetHeight - ul.clientHeight + 6;
  }, [open, active]);

  const show = () => {
    setActive(selected);
    setOpen(true);
  };
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) button.current?.focus();
  };
  const choose = (i: number) => {
    onChange(options[i].value);
    close();
  };

  function onListKey(e: React.KeyboardEvent) {
    const last = options.length - 1;
    const moves: Record<string, number> = {
      ArrowDown: Math.min(active + 1, last),
      ArrowUp: Math.max(active - 1, 0),
      Home: 0,
      End: last,
    };
    if (e.key in moves) {
      e.preventDefault();
      setActive(moves[e.key]);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(active);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") close(false);
    else if (e.key.length === 1) {
      const now = e.timeStamp;
      typed.current.text =
        (now - typed.current.at > 600 ? "" : typed.current.text) +
        e.key.toLowerCase();
      typed.current.at = now;
      const hit = options.findIndex((o) =>
        o.label.toLowerCase().startsWith(typed.current.text),
      );
      if (hit >= 0) setActive(hit);
    }
  }

  return (
    <div ref={wrap} className={cn("relative", className)}>
      <button
        ref={button}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        aria-label={`${label}: ${options[selected]?.label}`}
        onClick={() => (open ? close() : show())}
        onKeyDown={(e) => {
          if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
            e.preventDefault();
            show();
          }
        }}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-[10px] border bg-surface px-3 text-ink",
          size === "md"
            ? "h-[42px] min-w-[150px] text-base"
            : "h-9 text-[15px]",
          open
            ? "border-brand shadow-[0_0_0_1px_var(--brand)]"
            : "border-border-strong hover:border-border-hover",
        )}
      >
        <span className="truncate">{options[selected]?.label}</span>
        <ChevronDown
          className={cn(
            "shrink-0 text-brand transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            ref={list}
            id={`${id}-list`}
            role="listbox"
            tabIndex={-1}
            aria-label={label}
            aria-activedescendant={`${id}-${active}`}
            onKeyDown={onListKey}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: -4,
              scale: 0.98,
              transition: { duration: 0.12 },
            }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{
              transformOrigin: align === "end" ? "top right" : "top left",
            }}
            className={cn(
              "absolute top-full z-50 mt-2 max-h-80 w-[220px] overflow-auto rounded-[14px] bg-surface p-1.5 text-[15px] text-ink shadow-menu outline-none",
              align === "end" ? "right-0" : "left-0",
            )}
          >
            {options.map((o, i) => {
              const isSelected = i === selected;
              return (
                <li
                  key={o.value}
                  id={`${id}-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={isSelected}
                  onPointerMove={() => setActive(i)}
                  onClick={() => choose(i)}
                  className={cn(
                    "flex min-h-10 cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 transition-colors duration-100",
                    isSelected
                      ? "bg-brand-soft font-bold text-brand-ink"
                      : i === active && "bg-win",
                  )}
                >
                  <span>{o.label}</span>
                  <span className="flex items-center gap-2">
                    {o.note && (
                      <span className="text-[13px] font-normal text-text-3">
                        {o.note}
                      </span>
                    )}
                    {isSelected && <CheckIcon size={14} />}
                  </span>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
