"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { CloseIcon, SearchIcon } from "@/components/icons";
import {
  ResultRows,
  SearchMessage,
  searchFunds,
  topPicks,
} from "@/components/search-core";
import { useLookup } from "@/components/useLookup";
import { categoryByName } from "@/lib/categories";
import type { FundLookup } from "@/lib/data";
import { usePicks } from "@/lib/picks";
import { cn } from "@/lib/utils";

const EVENT = "mfc:overlay";

type Mode =
  | { kind: "search" }
  /** Pick a fund to add to (or swap into) a comparison of `codes`. */
  | {
      kind: "compare";
      codes: string[];
      replace?: string;
      category?: string;
      anchor?: DOMRect;
    };

export const openSearch = () =>
  window.dispatchEvent(
    new CustomEvent<Mode>(EVENT, { detail: { kind: "search" } }),
  );
/** `from` is the button that opened it: on a laptop the picker drops down from it, like the search field's list. */
export const openPicker = (
  codes: string[],
  opts: { replace?: string; category?: string; from?: Element | null } = {},
) =>
  window.dispatchEvent(
    new CustomEvent<Mode>(EVENT, {
      detail: {
        kind: "compare",
        codes,
        replace: opts.replace,
        category: opts.category,
        anchor: opts.from?.getBoundingClientRect(),
      },
    }),
  );

const WIDTH = 440;
/** Fixed position for a dropdown under (or, near the bottom of the screen, over) the anchor. */
function dropFrom(r: DOMRect): React.CSSProperties {
  const left = Math.min(
    Math.max(16, r.right > window.innerWidth / 2 ? r.right - WIDTH : r.left),
    window.innerWidth - WIDTH - 16,
  );
  const below = window.innerHeight - r.bottom - 24;
  return below >= 320
    ? { left, top: r.bottom + 8, maxHeight: Math.min(480, below) }
    : {
        left,
        bottom: window.innerHeight - r.top + 8,
        maxHeight: Math.min(480, r.top - 24),
      };
}

/**
 * Search as an overlay. On a phone it fills the screen (the search button and every "compare" button).
 * On a laptop the compare buttons get a dropdown under the button, styled like the search field's own.
 */
export function SearchOverlay() {
  const router = useRouter();
  const compare = usePicks("compare");
  const input = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode | null>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const { funds, failed } = useLookup(mode !== null);
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const show = (e: Event) => {
      setWide(window.matchMedia("(min-width: 768px)").matches);
      setMode((e as CustomEvent<Mode>).detail);
      setQuery("");
      setActive(0);
    };
    window.addEventListener(EVENT, show);
    return () => window.removeEventListener(EVENT, show);
  }, []);

  useEffect(() => {
    if (!mode) return;
    const t = setTimeout(() => input.current?.focus(), 60);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMode(null);
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [mode]);

  const typed = query.trim().length > 0;
  const pool = useMemo(() => {
    if (!funds || !mode) return [];
    if (mode.kind !== "compare") return funds;
    // Comparing within one kind of fund first: same-category funds lead the suggestions.
    return funds.filter((f) => !mode.codes.includes(f.code));
  }, [funds, mode]);
  const items = useMemo(() => {
    if (typed) return searchFunds(pool, query);
    if (mode?.kind === "compare" && mode.category)
      return pool
        .filter((f) => f.category === mode.category && f.score !== null)
        .sort((a, b) => b.score! - a.score!)
        .slice(0, 6);
    return topPicks(pool);
  }, [pool, query, typed, mode]);

  function pick(f: FundLookup) {
    const m = mode;
    setMode(null);
    if (!m) return;
    if (m.kind === "search") {
      router.push(`/fund/${encodeURIComponent(f.code)}`, {
        transitionTypes: ["nav-forward"],
      });
      return;
    }
    const codes = m.replace
      ? m.codes.map((c) => (c === m.replace ? f.code : c))
      : [...m.codes, f.code];
    compare.set(codes);
    router.push(`/compare?funds=${codes.map(encodeURIComponent).join(",")}`, {
      transitionTypes: ["nav-forward"],
    });
  }

  const heading =
    mode?.kind === "compare"
      ? mode.replace
        ? "Swap for another fund"
        : "Add a fund to compare"
      : "Search funds";
  const hint =
    mode?.kind === "compare" && mode.category && !typed
      ? `Best ${categoryByName(mode.category)?.short ?? "funds"} to compare with`
      : "Best record in each kind of fund";

  const anchor = wide && mode?.kind === "compare" ? mode.anchor : undefined;
  const field = (
    <input
      ref={input}
      type="search"
      role="combobox"
      aria-expanded="true"
      aria-controls="overlay-list"
      aria-activedescendant={
        items[active] ? `overlay-list-${active}` : undefined
      }
      aria-label={heading}
      placeholder={
        mode?.kind === "compare"
          ? "Search a fund to compare"
          : funds
            ? `Search ${funds.length} funds`
            : "Search funds"
      }
      autoComplete="off"
      spellCheck={false}
      value={query}
      onChange={(e) => {
        setQuery(e.target.value);
        setActive(0);
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
          pick(items[active]);
        }
      }}
      className={cn(
        "min-w-0 flex-1 bg-transparent text-ink outline-none",
        anchor ? "text-[15px]" : "h-14 text-[17px]",
      )}
    />
  );
  const results =
    !funds || (typed && !items.length) ? (
      <SearchMessage
        query={query}
        failed={failed}
        loading={!funds && !failed}
      />
    ) : (
      <>
        {!typed && (
          <p className="px-2.5 pt-1.5 pb-1 text-[13px] text-text-3">{hint}</p>
        )}
        <ResultRows
          id="overlay-list"
          items={items}
          active={active}
          query={query}
          onPick={pick}
          onHover={setActive}
        />
      </>
    );

  return (
    <AnimatePresence>
      {mode && anchor && (
        <motion.div
          key="drop"
          className="fixed inset-0 z-[60]"
          exit={{ opacity: 0, transition: { duration: 0.12 } }}
        >
          <div
            className="absolute inset-0"
            onClick={() => setMode(null)}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-label={heading}
            initial={{ opacity: 0, y: -6, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              ...dropFrom(anchor),
              width: WIDTH,
              transformOrigin: "top center",
            }}
            className="fixed flex flex-col rounded-[14px] bg-surface p-1.5 shadow-menu"
          >
            <label className="flex h-11 shrink-0 items-center gap-2.5 rounded-[10px] bg-field pr-1 pl-3 text-text-3">
              <SearchIcon size={18} />
              {field}
            </label>
            <div className="min-h-0 flex-1 overflow-auto pt-1">{results}</div>
          </motion.div>
        </motion.div>
      )}
      {mode && !anchor && (
        <motion.div
          key="overlay"
          className="fixed inset-0 z-[60] flex items-start justify-center md:px-4 md:pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
        >
          <div
            className="absolute inset-0 bg-[rgb(19_33_42/0.4)]"
            onClick={() => setMode(null)}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={heading}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: 10,
              scale: 0.98,
              transition: { duration: 0.15 },
            }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex h-dvh w-full flex-col bg-surface md:h-auto md:max-h-[70vh] md:max-w-[560px] md:rounded-[18px] md:shadow-menu"
          >
            <div className="flex items-center gap-2 border-b border-hairline px-3 pt-[env(safe-area-inset-top)] md:px-4">
              <SearchIcon size={20} className="shrink-0 text-text-3" />
              {field}
              <button
                type="button"
                onClick={() => setMode(null)}
                aria-label="Close"
                className="grid size-11 shrink-0 place-items-center rounded-xl text-text-2 hover:bg-surface-2"
              >
                <CloseIcon size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-1.5 md:p-2">{results}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
