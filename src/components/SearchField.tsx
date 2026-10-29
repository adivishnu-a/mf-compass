"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { SearchIcon } from "@/components/icons";
import {
  ResultRows,
  SearchMessage,
  searchFunds,
  topPicks,
} from "@/components/search-core";
import { prefetchLookup, useLookup } from "@/components/useLookup";
import type { FundLookup } from "@/lib/data";
import { cn } from "@/lib/utils";

/**
 * Inline fund search (mocks: header field and home hero). Typing shows matches in a dropdown under the
 * field; focus with nothing typed shows the best fund of each kind.
 */
export function SearchField({
  variant,
  placeholder,
  className,
}: {
  variant: "header" | "hero" | "phone";
  placeholder: string;
  className?: string;
}) {
  const id = useId();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const { funds, failed } = useLookup(open);

  const typed = query.trim().length > 0;
  const items = useMemo(
    () => (funds ? (typed ? searchFunds(funds, query) : topPicks(funds)) : []),
    [funds, query, typed],
  );

  useEffect(prefetchLookup, []);

  // "/" or Ctrl/⌘K focuses the page's main search: the hero on home (the header hides its field there), else the header.
  useEffect(() => {
    if (variant === "phone") return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing =
        t.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName);
      if (
        (e.key === "/" && !typing) ||
        (e.key === "k" && (e.metaKey || e.ctrlKey))
      ) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [variant]);

  const go = (f: FundLookup) => {
    setOpen(false);
    setQuery("");
    input.current?.blur();
    router.push(`/fund/${encodeURIComponent(f.code)}`, {
      transitionTypes: ["nav-forward"],
    });
  };

  const field = {
    header:
      "h-11 w-[320px] rounded-[10px] border border-border bg-field pr-2 pl-3.5 text-text-3 focus-within:border-border-hover focus-within:bg-surface focus-within:shadow-card",
    hero: "h-14 rounded-[14px] border-2 border-brand bg-surface pr-2.5 pl-[18px] focus-within:shadow-card",
    phone: "h-[52px] rounded-[14px] border-2 border-brand bg-surface px-3.5",
  }[variant];

  return (
    <div
      className={cn("relative", className)}
      data-page-search={variant === "hero" || undefined}
    >
      <label className={cn("flex items-center gap-2.5", field)}>
        <SearchIcon
          size={variant === "header" ? 18 : variant === "hero" ? 22 : 20}
          className={variant === "header" ? "" : "text-brand"}
        />
        <span className="sr-only">Search funds</span>
        <input
          ref={input}
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={
            open && items[active] ? `${id}-list-${active}` : undefined
          }
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          value={query}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, items.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && items[active]) {
              e.preventDefault();
              go(items[active]);
            } else if (e.key === "Escape") {
              if (query) setQuery("");
              else input.current?.blur();
            }
          }}
          className={cn(
            "min-w-0 flex-1 bg-transparent text-ink outline-none",
            variant === "header" ? "text-[15px]" : "text-[17px]",
          )}
        />
        {variant !== "phone" && !query && (
          <kbd className="rounded-md border border-border bg-surface px-2 py-0.5 font-sans text-[13px] text-text-2">
            /
          </kbd>
        )}
      </label>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: "top center" }}
            className={cn(
              "absolute top-full z-50 mt-2 max-h-[min(440px,60vh)] overflow-auto rounded-[14px] bg-surface p-1.5 shadow-menu",
              variant === "header"
                ? "right-0 left-0 min-w-[380px]"
                : "inset-x-0",
            )}
          >
            {!funds || (typed && !items.length) ? (
              <SearchMessage
                query={query}
                failed={failed}
                loading={!funds && !failed}
              />
            ) : (
              <>
                {!typed && (
                  <p className="px-2.5 pt-1.5 pb-1 text-[13px] text-text-3">
                    Best record in each kind of fund
                  </p>
                )}
                <ResultRows
                  id={`${id}-list`}
                  items={items}
                  active={active}
                  query={query}
                  onPick={go}
                  onHover={setActive}
                />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
