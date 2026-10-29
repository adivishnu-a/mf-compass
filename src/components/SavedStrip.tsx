"use client";
import Link from "next/link";
import { AmcLogo } from "@/components/AmcLogo";
import { useLookup } from "@/components/useLookup";
import { categoryByName } from "@/lib/categories";
import { rankOf } from "@/lib/format";
import { usePicks } from "@/lib/picks";

/** "Your saved funds" on the phone home (mock: PhoneHome); hidden until something is saved. */
export function SavedStrip() {
  const saved = usePicks("saved");
  const { funds } = useLookup(saved.codes.length > 0);
  if (!saved.codes.length) return null;
  const rows = [...saved.codes]
    .reverse()
    .map((c) => funds?.find((f) => f.code === c))
    .filter((f) => f !== undefined);
  return (
    <section aria-labelledby="saved-h">
      <div className="flex items-baseline justify-between">
        <h2 id="saved-h" className="text-lg font-bold">
          Your saved funds
        </h2>
        <Link href="/saved" className="text-sm font-semibold">
          All
        </Link>
      </div>
      <div className="-mx-4 mt-2.5 flex [scrollbar-width:none] gap-2.5 overflow-x-auto px-4 pb-1">
        {!funds
          ? saved.codes
              .slice(0, 2)
              .map((c) => (
                <div
                  key={c}
                  className="mfc-skeleton h-[106px] w-[168px] flex-none rounded-2xl"
                />
              ))
          : rows.map((f) => {
              const cat = categoryByName(f.category);
              return (
                <Link
                  key={f.code}
                  href={`/fund/${encodeURIComponent(f.code)}`}
                  transitionTypes={["nav-forward"]}
                  className="press w-[168px] flex-none rounded-2xl border border-border bg-surface p-3 text-ink hover:text-ink"
                >
                  <span className="flex items-center justify-between">
                    <AmcLogo
                      houseCode={f.houseCode}
                      house={f.house}
                      size={32}
                    />
                    <strong className="text-xl">
                      {f.score !== null ? f.score.toFixed(1) : "—"}
                    </strong>
                  </span>
                  <span className="mt-2 block text-[15px] leading-tight font-semibold">
                    {f.name}
                  </span>
                  <span className="block text-[13px] font-semibold text-text-2">
                    {f.rank
                      ? `${rankOf(f.rank, f.rated)} ${cat?.short}`
                      : "Too new to rate"}
                  </span>
                </Link>
              );
            })}
      </div>
    </section>
  );
}
