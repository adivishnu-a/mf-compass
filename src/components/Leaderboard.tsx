"use client";
import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { AmcLogo } from "@/components/AmcLogo";
import { GrowthChart, Legend } from "@/components/GrowthChart";
import { CheckIcon, ChevronDown, SortIcon } from "@/components/icons";
import { ScoreStrip } from "@/components/ScoreStrip";
import { Shared } from "@/components/Shared";
import type { CategoryBoard, FundRow } from "@/lib/data";
import type { Series } from "@/lib/growth";
import { aum, fall, month, nav, rankOf } from "@/lib/format";
import { COMPARE_MAX, usePicks } from "@/lib/picks";
import { cn } from "@/lib/utils";
import { median, summaryLine } from "@/lib/verdict";

type SortKey = "score" | "excess" | "consistency" | "fall" | "cost" | "size";
const SORTS: {
  key: SortKey;
  label: string;
  get: (f: FundRow) => number | null;
  asc?: boolean;
}[] = [
  { key: "score", label: "Compass Score", get: (f) => f.score },
  { key: "excess", label: "Furthest ahead of category", get: (f) => f.excess },
  {
    key: "consistency",
    label: "Beat category most often",
    get: (f) => f.consistency,
  },
  { key: "fall", label: "Smallest worst fall", get: (f) => f.fall },
  { key: "cost", label: "Lowest cost", get: (f) => f.expense, asc: true },
  { key: "size", label: "Largest size", get: (f) => f.aum },
];
const href = (f: FundRow) => `/fund/${encodeURIComponent(f.code)}`;
const signed = (n: number | null) => {
  if (n === null) return "—";
  const r = Number(n.toFixed(1));
  return `${r > 0 ? "+" : r < 0 ? "−" : ""}${Math.abs(r).toFixed(1)}%`;
};
const tone = (n: number | null) => {
  const r = n === null ? 0 : Math.round(n * 10);
  return r > 0 ? "text-gain" : r < 0 ? "text-loss" : "text-text-2";
};
const spring = { type: "spring", stiffness: 420, damping: 38 } as const;

/** Custom compare checkbox (mock: last column). */
function CompareBox({ code, name }: { code: string; name: string }) {
  const picks = usePicks("compare");
  const on = picks.has(code);
  const full = !on && picks.codes.length >= COMPARE_MAX;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      aria-label={`Compare ${name}`}
      disabled={full}
      title={full ? `You can compare up to ${COMPARE_MAX} funds` : undefined}
      onClick={(e) => {
        e.stopPropagation();
        picks.toggle(code);
      }}
      className={cn(
        "grid size-5 place-items-center rounded-[5px] border-[1.5px] disabled:cursor-not-allowed disabled:opacity-40",
        on
          ? "border-brand bg-brand text-on-brand"
          : "border-border-strong bg-surface hover:border-brand",
      )}
    >
      <motion.span
        initial={false}
        animate={{ scale: on ? 1 : 0, opacity: on ? 1 : 0 }}
        transition={{ duration: 0.15 }}
      >
        <CheckIcon size={13} />
      </motion.span>
    </button>
  );
}

const growthCache = new Map<
  string,
  Promise<{ fund: Series; category: Series }>
>();
function useGrowth(code: string) {
  const [data, setData] = useState<{
    code: string;
    fund: Series;
    category: Series;
  } | null>(null);
  useEffect(() => {
    let live = true;
    if (!growthCache.has(code))
      growthCache.set(
        code,
        fetch(`/api/funds/${encodeURIComponent(code)}/growth`).then((r) => {
          if (!r.ok) throw new Error(String(r.status));
          return r.json();
        }),
      );
    growthCache.get(code)!.then(
      (d) => live && setData({ code, ...d }),
      () => growthCache.delete(code),
    );
    return () => {
      live = false;
    };
  }, [code]);
  return data?.code === code ? data : null;
}

/** The fund preview beside the table (mock: Main, right rail). */
function Preview({ fund, board }: { fund: FundRow; board: CategoryBoard }) {
  const peers = board.funds
    .filter((f) => f.score !== null && f.code !== fund.code)
    .map((f) => f.score!);
  const picks = usePicks("compare");
  const growth = useGrowth(fund.code);
  const info = board.info;
  const inCompare = picks.has(fund.code);
  const full = !inCompare && picks.codes.length >= COMPARE_MAX;
  const fEnd = growth?.fund.at(-1)?.[1];
  const cEnd = growth?.category.at(-1)?.[1];

  const costMid = median(board.funds.map((f) => f.expense));
  const dot = (
    <span
      aria-hidden="true"
      className="mt-2 size-2 flex-none rounded-full bg-brand"
    />
  );
  return (
    <aside
      aria-label="Fund preview"
      className="flex min-w-0 flex-col gap-[18px] rounded-2xl border border-border bg-surface p-5"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={fund.code}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, transition: { duration: 0.1 } }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-3"
        >
          <AmcLogo houseCode={fund.houseCode} house={fund.house} size={44} />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[19px] font-bold">{fund.name}</p>
            <p className="text-sm text-text-3">
              Direct · Growth · NAV {nav(fund.nav)}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
      <div>
        <div className="flex items-baseline justify-between">
          <p className="text-[15px] font-semibold">
            {rankOf(fund.rank!, board.rated)} {info.short}
          </p>
          <p className="text-[28px] leading-none font-bold">
            {fund.score!.toFixed(1)}
          </p>
        </div>
        <div
          className="relative mt-2"
          role="img"
          aria-label={`Score ${fund.score!.toFixed(1)} among ${board.rated} ${info.plural}`}
        >
          <ScoreStrip
            score={fund.score!}
            peers={peers}
            size="lg"
            label=""
            bead={false}
          />
          <motion.span
            className="absolute size-5 rounded-full bg-marigold"
            style={{
              top: 8,
              marginLeft: -10,
              boxShadow: "0 0 0 3px var(--surface), 0 0 0 5px var(--brand)",
            }}
            initial={false}
            animate={{ left: `${fund.score}%` }}
            transition={spring}
          />
        </div>
        <div className="flex justify-between text-xs text-text-3">
          <span>Weakest record</span>
          <span>Strongest</span>
        </div>
      </div>
      <ul className="flex flex-col gap-2.5 text-[15px]">
        {fund.excess !== null && fund.consistency !== null && (
          <li className="flex gap-2.5">
            {dot}
            <span>
              {fund.excess >= 0 ? "Beat" : "Trailed"} {info.peer}{" "}
              {fund.excess >= 0 ? "in" : ", ahead in"}{" "}
              <strong>{Math.round(fund.consistency * 100)}%</strong> of 3-year
              periods, by about{" "}
              <strong>
                {Math.abs(fund.excess) >= 2
                  ? Math.round(Math.abs(fund.excess))
                  : Math.abs(fund.excess).toFixed(1)}
                % a year
              </strong>
              .
            </span>
          </li>
        )}
        {fund.fall !== null && fund.categoryFall !== null && (
          <li className="flex gap-2.5">
            {dot}
            <span>
              Fell {fund.fall >= fund.categoryFall ? "less" : "more"} in bad
              months: worst fall <strong>{fall(fund.fall, 0)}</strong> against
              the category's {fall(fund.categoryFall, 0)}
              {fund.fallFrom ? ` since ${fund.fallFrom.slice(0, 4)}` : ""}.
            </span>
          </li>
        )}
        {fund.expense !== null && (
          <li className="flex gap-2.5">
            {dot}
            <span>
              Costs <strong>{fund.expense.toFixed(2)}%</strong> a year
              {costMid !== null && fund.expense !== costMid
                ? `, ${fund.expense < costMid ? "less" : "more"} than most ${info.short}`
                : ""}
              .
            </span>
          </li>
        )}
      </ul>
      <figure>
        <figcaption className="mb-2 min-h-[42px] text-sm text-text-2">
          {fEnd !== undefined && cEnd !== undefined ? (
            <>
              ₹100{" "}
              {growth!.fund.length > 200
                ? "five years ago"
                : `in ${month(new Date(growth!.fund[0][0] * 86_400_000).toISOString())}`}{" "}
              is now <strong className="text-ink">₹{Math.round(fEnd)}</strong>.{" "}
              {info.peer[0].toUpperCase() + info.peer.slice(1)}: ₹
              {Math.round(cEnd)}.
            </>
          ) : (
            <span className="mfc-skeleton block h-4 w-4/5" />
          )}
        </figcaption>
        <div className="h-[120px]">
          {growth && growth.fund.length > 1 ? (
            <GrowthChart
              key={fund.code}
              height={120}
              axis={false}
              fromDay={growth.fund[0][0]}
              label={`Growth of ₹100: ${fund.name} ₹${Math.round(fEnd ?? 0)}, category ₹${Math.round(cEnd ?? 0)}`}
              lines={[
                {
                  label: fund.name,
                  series: growth.fund,
                  color: "var(--series-1)",
                  width: 2.5,
                },
                {
                  label: "Average",
                  series: growth.category,
                  color: "var(--cat-line)",
                  muted: true,
                },
              ]}
            />
          ) : (
            <div className="mfc-skeleton h-full" />
          )}
        </div>
        <Legend
          className="mt-2 text-[13px]"
          lines={[
            { label: fund.name, color: "var(--series-1)" },
            {
              label: `Average ${info.label.toLowerCase()}`,
              color: "var(--cat-line)",
              muted: true,
            },
          ]}
        />
      </figure>
      <div className="flex gap-2">
        <Link
          href={href(fund)}
          transitionTypes={["nav-forward"]}
          className="press grid h-11 flex-1 place-items-center rounded-[10px] bg-brand font-semibold text-on-brand hover:bg-brand-hover hover:text-on-brand"
        >
          Open fund
        </Link>
        <button
          type="button"
          aria-pressed={inCompare}
          disabled={full}
          onClick={() => picks.toggle(fund.code)}
          className={cn(
            "h-11 flex-1 rounded-[10px] border font-semibold disabled:opacity-50",
            inCompare
              ? "border-brand bg-brand-soft text-brand-ink"
              : "border-border-strong bg-surface text-ink hover:border-border-hover",
          )}
        >
          {inCompare ? "In compare" : "Compare"}
        </button>
      </div>
    </aside>
  );
}

/** Funds under 3 years old, folded away below the ranking (mock: rankings footer). */
function Unrated({
  funds,
  phone,
  className,
}: {
  funds: FundRow[];
  phone?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center gap-3 text-left",
          phone ? "min-h-12 px-3.5 py-3" : "px-5 py-3.5",
        )}
      >
        <span className="min-w-0 flex-1 text-[15px]">
          <strong className="font-semibold text-ink">
            Too new to rate ({funds.length})
          </strong>
          <span className="block text-sm text-text-3">
            A score needs 3 years of prices to compare fairly.
          </span>
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="text-text-3"
        >
          <ChevronDown />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <ul
              className={cn(
                "border-t border-hairline",
                phone ? "px-3.5" : "px-5",
              )}
            >
              {funds.map((f, i) => (
                <li
                  key={f.code}
                  className={cn(i > 0 && "border-t border-hairline")}
                >
                  <Link
                    href={href(f)}
                    transitionTypes={["nav-forward"]}
                    className="flex items-center gap-3 py-2.5 text-ink hover:text-ink"
                  >
                    <AmcLogo
                      houseCode={f.houseCode}
                      house={f.house}
                      size={28}
                    />
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block truncate font-semibold">
                        {f.name}
                      </span>
                      <span className="block truncate text-[13px] text-text-3">
                        {f.startDate
                          ? `Started ${month(f.startDate)}`
                          : f.house}
                      </span>
                    </span>
                    <span className="w-24 text-right text-sm whitespace-nowrap text-text-2">
                      {aum(f.aum)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SortSheet({
  open,
  value,
  onChange,
  onClose,
}: {
  open: boolean;
  value: SortKey;
  onChange: (k: SortKey) => void;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-[rgb(19_33_42/0.4)]"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Sort funds"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%", transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, i) => i.offset.y > 80 && onClose()}
            className="absolute inset-x-0 bottom-0 rounded-t-[20px] bg-surface px-4 pt-2 pb-[calc(16px+env(safe-area-inset-bottom))]"
          >
            <div
              className="mx-auto mb-3 h-1 w-10 rounded-full bg-track"
              aria-hidden="true"
            />
            <h2 className="px-1 text-lg font-bold">Sort by</h2>
            <div role="radiogroup" aria-label="Sort by" className="mt-2 grid">
              {SORTS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  role="radio"
                  aria-checked={value === s.key}
                  onClick={() => {
                    onChange(s.key);
                    onClose();
                  }}
                  className={cn(
                    "flex min-h-12 items-center justify-between rounded-xl px-3 text-start text-base",
                    value === s.key
                      ? "bg-brand-soft font-bold text-brand-ink"
                      : "text-ink",
                  )}
                >
                  {s.label}
                  {value === s.key && <CheckIcon />}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Leaderboard({ board }: { board: CategoryBoard }) {
  const [sort, setSort] = useState<SortKey>("score");
  // Rows glide to their new places only once the user re-sorts; before that, a layout shift (fonts, logos
  // loading) would set them moving for no reason.
  const [resorted, setResorted] = useState(false);
  const [asc, setAsc] = useState(false);
  const [sheet, setSheet] = useState(false);
  const rated = board.funds.filter((f) => f.score !== null);
  const unrated = board.funds.filter((f) => f.score === null);
  const [focus, setFocus] = useState(rated[0]?.code ?? null);
  const info = board.info;

  const rows = useMemo(() => {
    const s = SORTS.find((o) => o.key === sort)!;
    const dir = (s.asc ? 1 : -1) * (asc ? -1 : 1);
    return [...rated].sort((a, b) => {
      const x = s.get(a);
      const y = s.get(b);
      if (x === null && y === null) return a.rank! - b.rank!;
      if (x === null) return 1;
      if (y === null) return -1;
      return (x - y) * dir || a.rank! - b.rank!;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, asc, board]);
  const focused = rated.find((f) => f.code === focus) ?? rated[0];

  function sortBy(k: SortKey) {
    setResorted(true);
    if (k === sort) setAsc(!asc);
    else {
      setSort(k);
      setAsc(false);
    }
  }
  const sortState = (k: SortKey) =>
    sort === k
      ? asc !== !!SORTS.find((s) => s.key === k)!.asc
        ? "ascending"
        : "descending"
      : "none";
  const th = (k: SortKey, title: string, sub?: string, className?: string) => {
    const state = sortState(k);
    return (
      <th
        key={k}
        scope="col"
        aria-sort={state}
        className={cn("px-2 py-3 align-bottom font-medium", className)}
      >
        <button
          type="button"
          onClick={() => sortBy(k)}
          className={cn(
            "group inline-flex flex-col rounded text-[13px] leading-snug",
            className?.includes("text-right") && "items-end",
            state !== "none"
              ? "font-semibold text-ink"
              : "text-text-3 hover:text-ink",
          )}
        >
          <span className="whitespace-nowrap">
            {title}
            <span
              aria-hidden="true"
              className={cn(
                "ml-0.5 inline-block transition-transform duration-200",
                state === "none" && "opacity-0 group-hover:opacity-50",
                state === "ascending" && "rotate-180",
              )}
            >
              ↓
            </span>
          </span>
          {sub && (
            <span className="font-normal whitespace-nowrap text-text-3">
              {sub}
            </span>
          )}
        </button>
      </th>
    );
  };

  if (!rated.length)
    return (
      <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
        <p className="font-semibold">No {info.plural} can be rated yet.</p>
        <p className="mt-1 text-text-2">
          A score needs 3 years of prices, and at least 5 rated funds in the
          category.
        </p>
      </div>
    );

  return (
    <>
      {/* ---------- Laptop (mock: Main) ---------- */}
      <div className="mt-6 hidden gap-6 md:flex md:items-start">
        <section
          aria-label="Rankings"
          className="min-w-0 flex-[999_1_720px] overflow-hidden rounded-2xl border border-border bg-surface"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-4">
            <p className="text-[15px] text-text-2">
              <strong className="font-semibold text-ink">Compass Score</strong>{" "}
              compares each fund's record with other {info.short}, 0 to 100. It
              looks back; it doesn't predict.
            </p>
            <Link
              href="/method"
              transitionTypes={["nav-forward"]}
              className="text-[15px] font-semibold"
            >
              How we score
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[15px]">
              <caption className="sr-only">{info.label} funds ranked</caption>
              <thead>
                <tr className="text-left">
                  <th
                    scope="col"
                    className="w-9 py-3 pr-2 pl-5 align-bottom text-[13px] font-medium text-text-3"
                  >
                    #
                  </th>
                  <th
                    scope="col"
                    className="px-2 py-3 align-bottom text-[13px] font-medium text-text-3"
                  >
                    Fund
                  </th>
                  {th("score", "Compass Score", "0 to 100", "text-right")}
                  {th(
                    "excess",
                    "vs category",
                    "per year, 3-yr periods",
                    "text-right",
                  )}
                  {th(
                    "consistency",
                    "Beat category",
                    "share of periods",
                    "text-right",
                  )}
                  {th(
                    "fall",
                    "Worst fall",
                    board.fall !== null
                      ? `category ${fall(board.fall, 0)}`
                      : `since ${board.fallFrom?.slice(0, 4) ?? ""}`,
                    "text-right",
                  )}
                  {th("cost", "Cost", "per year", "text-right")}
                  {th(
                    "size",
                    "Size",
                    undefined,
                    "text-right xl:hidden wide:table-cell",
                  )}
                  <th
                    scope="col"
                    className="py-3 pr-5 pl-2 text-center align-bottom text-[13px] font-medium text-text-3"
                  >
                    Compare
                  </th>
                </tr>
              </thead>
              <LayoutGroup>
                <tbody>
                  {rows.map((f, i) => {
                    const sel = focused?.code === f.code;
                    return (
                      <motion.tr
                        key={f.code}
                        layout={resorted ? "position" : false}
                        transition={spring}
                        onClick={() => setFocus(f.code)}
                        className={cn(
                          "mfc-tr cursor-pointer border-t border-hairline",
                          sel
                            ? "bg-[#FBF7EC] dark:bg-[#211d12]"
                            : "hover:bg-row-hover",
                        )}
                      >
                        <td className="py-3.5 pr-2 pl-5 text-text-3">
                          {sort === "score" && !asc ? f.rank : i + 1}
                        </td>
                        <td className="px-2 py-3.5">
                          <Link
                            href={href(f)}
                            transitionTypes={["nav-forward"]}
                            onFocus={() => setFocus(f.code)}
                            className="flex items-center gap-3 text-ink hover:text-ink"
                          >
                            <Shared name={`logo-${f.code}`} on="laptop">
                              <AmcLogo
                                houseCode={f.houseCode}
                                house={f.house}
                                size={32}
                              />
                            </Shared>
                            <span className="flex w-[clamp(140px,16vw,240px)] min-w-0 flex-col leading-tight">
                              <Shared name={`name-${f.code}`} on="laptop">
                                <span className="truncate font-semibold hover:text-brand hover:underline">
                                  {f.name}
                                </span>
                              </Shared>
                              <span className="truncate text-[13px] text-text-3">
                                {f.house}
                              </span>
                            </span>
                          </Link>
                        </td>
                        <td className="px-2 py-3.5 text-right">
                          <span className="text-xl font-bold">
                            {f.score!.toFixed(1)}
                          </span>
                        </td>
                        <td
                          className={cn(
                            "px-2 py-3.5 text-right font-semibold",
                            tone(f.excess),
                          )}
                        >
                          {signed(f.excess)}
                        </td>
                        <td className="px-2 py-3.5 text-right">
                          {f.consistency !== null
                            ? `${Math.round(f.consistency * 100)}%`
                            : "—"}
                        </td>
                        <td className="px-2 py-3.5 text-right">
                          {fall(f.fall, 0)}
                        </td>
                        <td className="px-2 py-3.5 text-right">
                          {f.expense !== null
                            ? `${f.expense.toFixed(2)}%`
                            : "—"}
                        </td>
                        <td className="px-2 py-3.5 text-right whitespace-nowrap text-text-2 xl:hidden wide:table-cell">
                          {aum(f.aum)}
                        </td>
                        <td className="py-3.5 pr-5 pl-2">
                          <div className="flex justify-center">
                            <CompareBox code={f.code} name={f.name} />
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </LayoutGroup>
            </table>
          </div>
          {unrated.length > 0 && (
            <Unrated
              funds={unrated}
              className="border-t border-hairline bg-surface-2"
            />
          )}
        </section>
        {focused && (
          // Sticky on the column itself: it sits in the tall flex row, so it can follow the table down.
          <div className="sticky top-6 hidden min-w-0 flex-[1_1_340px] self-start xl:block">
            <Preview fund={focused} board={board} />
          </div>
        )}
      </div>

      {/* ---------- Phone (mock: PeacockPhoneRankings) ---------- */}
      <div className="md:hidden">
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <p className="text-sm text-text-3">
            {rated.length} rated · by{" "}
            {sort === "score"
              ? "Compass Score"
              : SORTS.find((s) => s.key === sort)!.label.toLowerCase()}
          </p>
          <button
            type="button"
            onClick={() => setSheet(true)}
            className="flex h-9 items-center gap-1.5 rounded-[10px] border border-border bg-surface px-3 text-sm font-semibold text-ink"
          >
            <SortIcon /> Sort
          </button>
        </div>
        <ol
          aria-label={`${info.label} funds ranked`}
          className="grid grid-cols-1 gap-2.5 px-4 pt-2"
        >
          {rows.map((f, i) => (
            <motion.li
              key={f.code}
              layout={resorted ? "position" : false}
              transition={spring}
            >
              <Link
                href={href(f)}
                transitionTypes={["nav-forward"]}
                className="press block rounded-2xl border border-border bg-surface p-3.5 text-ink hover:text-ink"
              >
                <div className="flex items-center gap-3">
                  <span className="w-[18px] text-sm text-text-3">
                    {sort === "score" ? f.rank : i + 1}
                  </span>
                  <Shared name={`logo-${f.code}`} on="phone">
                    <AmcLogo
                      houseCode={f.houseCode}
                      house={f.house}
                      size={36}
                    />
                  </Shared>
                  <span className="min-w-0 flex-1 leading-tight">
                    <Shared name={`name-${f.code}`} on="phone">
                      <span className="block truncate font-semibold">
                        {f.name}
                      </span>
                    </Shared>
                    <span className="block text-[13px] text-text-3">
                      {aum(f.aum)}
                    </span>
                  </span>
                  <span className="text-2xl font-bold">
                    {f.score!.toFixed(1)}
                  </span>
                </div>
                <span className="mt-2 ml-[30px] block text-sm text-text-2">
                  {summaryLine(f)}
                </span>
              </Link>
            </motion.li>
          ))}
        </ol>
        {unrated.length > 0 && (
          <Unrated
            funds={unrated}
            phone
            className="mx-4 mt-2.5 rounded-2xl border border-border bg-surface"
          />
        )}
        <SortSheet
          open={sheet}
          value={sort}
          onChange={(k) => (setSort(k), setAsc(false), setResorted(true))}
          onClose={() => setSheet(false)}
        />
      </div>
    </>
  );
}
