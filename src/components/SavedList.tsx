"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { AmcLogo } from "@/components/AmcLogo";
import { BookmarkIcon } from "@/components/icons";
import { useLookup } from "@/components/useLookup";
import { categoryByName } from "@/lib/categories";
import { rankOf } from "@/lib/format";
import { usePicks } from "@/lib/picks";

/** Funds saved in this browser, newest first. Removing one slides it away. */
export function SavedList() {
  const saved = usePicks("saved");
  const { funds, failed } = useLookup(saved.codes.length > 0);

  if (!saved.codes.length)
    return (
      <div className="mt-5 max-w-[560px] rounded-[18px] border border-border bg-surface p-5">
        <p className="text-lg font-bold">Nothing saved yet</p>
        <p className="mt-1 text-[15px] text-text-2">
          Tap <strong className="text-ink">Save</strong> on any fund's page to
          keep it here. It stays in this browser only: no account, nothing sent
          anywhere.
        </p>
        <Link
          href="/funds"
          transitionTypes={["nav-forward"]}
          className="press mt-4 inline-grid h-11 place-items-center rounded-[10px] bg-brand px-5 font-semibold text-on-brand hover:text-on-brand"
        >
          Explore funds
        </Link>
      </div>
    );
  if (failed)
    return (
      <p className="mt-5 text-text-2">
        Couldn't load fund details. Check your connection and reload; your saved
        funds are safe.
      </p>
    );

  const rows = [...saved.codes].reverse();
  return (
    <>
      <ul className="mt-5 max-w-[720px] overflow-hidden rounded-2xl border border-border bg-surface px-3.5">
        <AnimatePresence initial={false}>
          {rows.map((code, i) => {
            const f = funds?.find((x) => x.code === code);
            const cat = f ? categoryByName(f.category) : null;
            return (
              <motion.li
                key={code}
                layout="position"
                exit={{ opacity: 0, height: 0, transition: { duration: 0.22 } }}
                className={i ? "border-t border-hairline" : ""}
              >
                <div className="flex items-center gap-3 py-3">
                  {!funds ? (
                    <div className="mfc-skeleton h-10 flex-1" />
                  ) : f ? (
                    <Link
                      href={`/fund/${encodeURIComponent(code)}`}
                      transitionTypes={["nav-forward"]}
                      className="grid min-w-0 flex-1 grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 text-ink hover:text-ink"
                    >
                      <AmcLogo
                        houseCode={f.houseCode}
                        house={f.house}
                        size={36}
                      />
                      <span className="min-w-0 leading-tight">
                        <span className="block truncate font-semibold">
                          {f.name}
                        </span>
                        <span className="block truncate text-[13px] text-text-3">
                          {cat?.label} ·{" "}
                          {f.rank
                            ? `${rankOf(f.rank, f.rated).toLowerCase()} ${cat?.short}`
                            : "too new to rate"}
                        </span>
                      </span>
                      <strong className="text-xl">
                        {f.score !== null ? f.score.toFixed(1) : "—"}
                      </strong>
                    </Link>
                  ) : (
                    <span className="flex-1 text-[15px] text-text-2">
                      No longer listed ({code})
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => saved.toggle(code)}
                    aria-label={`Remove ${f?.name ?? code} from saved`}
                    className="grid size-10 shrink-0 place-items-center rounded-[10px] text-brand hover:bg-surface-2"
                  >
                    <BookmarkIcon size={20} filled />
                  </button>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
      <p className="mt-3 text-[13px] text-text-3">
        Kept in this browser only. Clearing site data removes them.
      </p>
    </>
  );
}
