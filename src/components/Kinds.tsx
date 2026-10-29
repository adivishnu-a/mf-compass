import Link from "next/link";
import { ChevronRight } from "@/components/icons";
import { KindIcon } from "@/components/KindIcon";
import type { CategoryBoard } from "@/lib/data";

/** Laptop tiles, one per kind of fund (mock: LaptopHome "Pick a kind of fund"). Home and Explore share them. */
export function KindTiles({ boards }: { boards: CategoryBoard[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
      {boards.map((b) => {
        const top = b.funds[0]?.score !== null ? b.funds[0] : null;
        return (
          <Link
            key={b.info.slug}
            href={`/funds/${b.info.slug}`}
            transitionTypes={["nav-forward"]}
            className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-[18px] text-ink transition-[translate,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-border-hover hover:text-ink hover:shadow-card"
          >
            <span className="flex items-center gap-3">
              <KindIcon slug={b.info.slug} size={40} className="shrink-0" />
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-[19px] font-bold">
                  {b.info.label}
                </span>
                <span className="block text-[13px] text-text-3">
                  {b.rated} rated
                </span>
              </span>
            </span>
            <span className="min-h-[46px] text-[15px] text-text-2">
              {b.info.line}
            </span>
            {top && (
              <span className="flex items-center gap-2.5 border-t border-hairline pt-2.5 text-sm">
                <span className="text-text-3">Best record</span>
                <span className="min-w-0 flex-1 truncate font-semibold">
                  {top.name}
                </span>
                <strong>{top.score!.toFixed(1)}</strong>
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

/** Phone list of kinds (mock: PhoneHome "Kinds of funds"). */
export function KindList({
  boards,
  counts,
  className,
}: {
  boards: CategoryBoard[];
  counts?: boolean;
  className?: string;
}) {
  return (
    <ul
      className={`rounded-2xl border border-border bg-surface px-3.5 ${className ?? ""}`}
    >
      {boards.map((b, i) => (
        <li key={b.info.slug} className={i ? "border-t border-hairline" : ""}>
          <Link
            href={`/funds/${b.info.slug}`}
            transitionTypes={["nav-forward"]}
            className="flex min-h-11 items-center gap-3 py-3 text-ink hover:text-ink"
          >
            <KindIcon slug={b.info.slug} size={32} className="shrink-0" />
            <span className="min-w-0 flex-1 leading-[1.3]">
              <span className="block font-semibold">{b.info.label}</span>
              <span className="block text-[13px] text-text-3">
                {b.info.brief}
                {counts ? ` · ${b.rated} rated` : ""}
              </span>
            </span>
            <ChevronRight className="text-text-3" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
