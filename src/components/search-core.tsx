"use client";
import { categoryByName } from "@/lib/categories";
import type { FundLookup } from "@/lib/data";
import { AmcLogo } from "@/components/AmcLogo";
import { cn } from "@/lib/utils";

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9& ]+/g, " ");

/** Funds whose name, house or kind contain every typed word; names starting with the query first. */
export function searchFunds(funds: FundLookup[], query: string, limit = 8) {
  const words = norm(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return funds
    .map((f) => {
      const hay = norm(
        `${f.name} ${f.house ?? ""} ${categoryByName(f.category)?.label ?? ""}`,
      );
      if (!words.every((w) => hay.includes(w))) return null;
      return { f, rank: norm(f.name).startsWith(words[0]) ? 0 : 1 };
    })
    .filter((x): x is { f: FundLookup; rank: number } => x !== null)
    .sort((a, b) => a.rank - b.rank || (b.f.score ?? -1) - (a.f.score ?? -1))
    .slice(0, limit)
    .map((x) => x.f);
}

/** Before typing: the best-rated fund in each kind of fund. */
export function topPicks(funds: FundLookup[], limit = 6) {
  const best = new Map<string, FundLookup>();
  for (const f of funds)
    if (f.score !== null && (best.get(f.category)?.score ?? -1) < f.score)
      best.set(f.category, f);
  return [...best.values()].slice(0, limit);
}

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim().split(/\s+/)[0];
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className="text-brand-ink underline decoration-brand/40 underline-offset-2">
        {text.slice(i, i + q.length)}
      </span>
      {text.slice(i + q.length)}
    </>
  );
}

/** The result rows shared by every search surface. */
export function ResultRows({
  id,
  items,
  active,
  query,
  onPick,
  onHover,
}: {
  id: string;
  items: FundLookup[];
  active: number;
  query: string;
  onPick: (f: FundLookup) => void;
  onHover: (i: number) => void;
}) {
  return (
    <ul id={id} role="listbox" aria-label="Funds">
      {items.map((f, i) => (
        <li
          key={f.code}
          id={`${id}-${i}`}
          role="option"
          aria-selected={i === active}
          onPointerMove={() => onHover(i)}
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => onPick(f)}
          className={cn(
            "grid cursor-pointer grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 rounded-[10px] px-2.5 py-2 transition-colors duration-100",
            i === active && "bg-win",
          )}
        >
          <AmcLogo houseCode={f.houseCode} house={f.house} size={28} />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[15px] font-semibold text-ink">
              <Highlight text={f.name} query={query} />
            </span>
            <span className="block truncate text-[13px] text-text-3">
              {categoryByName(f.category)?.label}
              {f.house ? ` · ${f.house}` : ""}
            </span>
          </span>
          <span className="text-[15px] font-bold text-ink">
            {f.score !== null ? (
              f.score.toFixed(1)
            ) : (
              <span className="text-[13px] font-normal text-text-3">
                Too new
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function SearchMessage({
  query,
  failed,
  loading,
}: {
  query: string;
  failed: boolean;
  loading: boolean;
}) {
  if (failed)
    return (
      <p className="px-3 py-3 text-[15px] text-text-2">
        Couldn't load the fund list. Check your connection and try again.
      </p>
    );
  if (loading)
    return (
      <div className="grid gap-1.5 p-1.5" aria-label="Loading funds">
        {[0, 1, 2].map((i) => (
          <div key={i} className="mfc-skeleton h-11" />
        ))}
      </div>
    );
  return (
    <div className="px-3 py-3">
      <p className="text-[15px] font-semibold text-ink">
        No fund matches “{query.trim()}”
      </p>
      <p className="mt-0.5 text-sm text-text-2">
        Try fewer words, or just the fund house, like “Nippon”.
      </p>
    </div>
  );
}
