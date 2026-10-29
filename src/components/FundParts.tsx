"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { GrowthChart, Legend } from "@/components/GrowthChart";
import { BookmarkIcon, ShareIcon } from "@/components/icons";
import { Listbox, type Option } from "@/components/Listbox";
import { BackButton } from "@/components/PhoneBar";
import { openPicker } from "@/components/SearchOverlay";
import { Segmented } from "@/components/Segmented";
import { lumpSum, sip, type Series } from "@/lib/growth";
import { inr, monthOfDay } from "@/lib/format";
import { COMPARE_MAX, usePicks } from "@/lib/picks";
import { cn } from "@/lib/utils";

const DAY = 86_400_000;
const monthStart = (day: number, backYears = 0, backMonths = 0) => {
  const d = new Date(day * DAY);
  return Math.round(
    Date.UTC(d.getUTCFullYear() - backYears, d.getUTCMonth() - backMonths, 1) /
      DAY,
  );
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------------- Actions ---------------- */

function useActions(code: string, category: string) {
  const saved = usePicks("saved");
  const compare = usePicks("compare");
  const [copied, setCopied] = useState(false);
  return {
    isSaved: saved.has(code),
    toggleSave: () => saved.toggle(code),
    /** Opens the picker with this fund already in; choosing a second opens the comparison. */
    compareWith: (e: React.MouseEvent<HTMLElement>) => {
      const others = compare.codes.filter((c) => c !== code);
      const base = [...others.slice(0, COMPARE_MAX - 1), code];
      openPicker(base, { category, from: e.currentTarget });
    },
    copied,
    share: async () => {
      const url = window.location.href;
      try {
        if (navigator.share)
          await navigator.share({ title: document.title, url });
        else {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        }
      } catch {}
    },
  };
}

function SaveGlyph({ on, size = 20 }: { on: boolean; size?: number }) {
  return (
    <motion.span
      className="grid place-items-center"
      animate={on ? { scale: [1, 1.25, 1] } : { scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <BookmarkIcon size={size} filled={on} />
    </motion.span>
  );
}

/** Laptop: Save + Compare with another (mock: LaptopFund header). */
export function FundButtons({
  code,
  category,
}: {
  code: string;
  category: string;
}) {
  const a = useActions(code, category);
  return (
    <div className="flex gap-2">
      <button
        type="button"
        aria-pressed={a.isSaved}
        onClick={a.toggleSave}
        className={cn(
          "flex h-11 items-center gap-2 rounded-[10px] border px-[18px] font-semibold",
          a.isSaved
            ? "border-brand bg-brand-soft text-brand-ink"
            : "border-border-strong bg-surface text-ink hover:border-border-hover",
        )}
      >
        <SaveGlyph on={a.isSaved} size={18} />
        {a.isSaved ? "Saved" : "Save"}
      </button>
      <button
        type="button"
        onClick={a.share}
        className="flex h-11 items-center gap-2 rounded-[10px] border border-border-strong bg-surface px-3.5 font-semibold text-ink hover:border-border-hover"
        aria-label="Share this fund"
      >
        <ShareIcon size={18} />
        <span aria-live="polite" className={a.copied ? "" : "sr-only"}>
          {a.copied ? "Link copied" : ""}
        </span>
      </button>
      <button
        type="button"
        onClick={a.compareWith}
        className="press h-11 rounded-[10px] bg-brand px-[18px] font-bold text-on-brand hover:bg-brand-hover"
      >
        Compare with another
      </button>
    </div>
  );
}

/** Phone top bar: back, category, save, share (mock: PeacockPhoneFund). */
export function FundTopBar({
  code,
  category,
  label,
  back,
}: {
  code: string;
  category: string;
  label: string;
  back: string;
}) {
  const a = useActions(code, category);
  return (
    <header className="flex items-center gap-1 px-2 pt-[calc(8px+env(safe-area-inset-top))] pb-2 md:hidden">
      <BackButton fallback={back} label={`Back to ${label} funds`} />
      <span className="flex-1 text-[15px] text-text-2">{label}</span>
      <button
        type="button"
        aria-pressed={a.isSaved}
        aria-label={a.isSaved ? "Saved" : "Save"}
        onClick={a.toggleSave}
        className={cn(
          "grid size-11 place-items-center rounded-xl",
          a.isSaved ? "text-brand" : "text-ink",
        )}
      >
        <SaveGlyph on={a.isSaved} size={22} />
      </button>
      <button
        type="button"
        aria-label={a.copied ? "Link copied" : "Share"}
        onClick={a.share}
        className="grid size-11 place-items-center rounded-xl text-ink"
      >
        <ShareIcon />
      </button>
    </header>
  );
}

/** Phone bottom bar: Save + Compare with another (mock: PeacockPhoneFund). */
export function FundActionBar({
  code,
  category,
}: {
  code: string;
  category: string;
}) {
  const a = useActions(code, category);
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 flex gap-2.5 border-t border-border bg-surface px-4 pt-3 pb-[max(14px,env(safe-area-inset-bottom))] md:hidden"
      style={{ viewTransitionName: "tab-bar" }}
    >
      <button
        type="button"
        aria-pressed={a.isSaved}
        onClick={a.toggleSave}
        className={cn(
          "flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border text-base font-semibold",
          a.isSaved
            ? "border-brand bg-brand-soft text-brand-ink"
            : "border-border-strong bg-surface text-ink",
        )}
      >
        <SaveGlyph on={a.isSaved} size={18} />
        {a.isSaved ? "Saved" : "Save"}
      </button>
      <button
        type="button"
        onClick={a.compareWith}
        className="press h-12 flex-[2] rounded-xl bg-brand text-base font-bold text-on-brand"
      >
        Compare with another
      </button>
    </div>
  );
}

/* ---------------- Growth ---------------- */

type Period = "1" | "3" | "5" | "all";

export function GrowthCard({
  name,
  peer,
  fund,
  category,
}: {
  name: string;
  peer: string;
  fund: Series;
  category: Series;
}) {
  const first = fund[0]?.[0];
  const last = fund.at(-1)?.[0];
  const has = (y: number) =>
    first !== undefined &&
    last !== undefined &&
    monthStart(last, y) + 0 >= first - 7;
  const [period, setPeriod] = useState<Period>(has(5) ? "5" : "all");
  if (first === undefined || last === undefined)
    return (
      <section
        aria-label="Growth"
        className="rounded-[18px] border border-border bg-surface p-4 md:p-6"
      >
        <h2 className="text-[17px] font-bold md:text-xl">Growth of ₹100</h2>
        <p className="mt-2 text-text-2">
          This fund's price history isn't loaded yet. It appears after the next
          daily update.
        </p>
      </section>
    );
  const back = (y: number) => {
    const d = new Date(last * DAY);
    d.setUTCFullYear(d.getUTCFullYear() - y);
    return Math.round(d.getTime() / DAY);
  };
  const from = period === "all" ? first : Math.max(back(Number(period)), first);
  const at = (s: Series, d: number) => {
    let v: number | null = null;
    for (const [day, x] of s) {
      if (day >= d) {
        v = v ?? x;
        break;
      }
      v = x;
    }
    return v;
  };
  const f0 = at(fund, from);
  const c0 = at(category, from);
  const fEnd = f0 ? (fund.at(-1)![1] / f0) * 100 : null;
  const cEnd = c0 && category.length ? (category.at(-1)![1] / c0) * 100 : null;
  const lines = [
    { label: name, series: fund, color: "var(--series-1)" },
    {
      label: `${cap(peer.replace(/^the /, ""))} (direct plans)`,
      series: category,
      color: "var(--cat-line)",
      muted: true,
    },
  ];
  const opts = (phone: boolean) => [
    { value: "1" as const, label: "1Y", disabled: !has(1) },
    { value: "3" as const, label: "3Y", disabled: !has(3) },
    { value: "5" as const, label: "5Y", disabled: !has(5) },
    ...(phone
      ? []
      : [
          {
            value: "all" as const,
            label: `Since ${new Date(first * DAY).getUTCFullYear()}`,
          },
        ]),
  ];

  return (
    <section
      aria-labelledby="growth-h"
      className="rounded-[18px] border border-border bg-surface p-4 md:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 md:gap-3">
        <h2 id="growth-h" className="text-[17px] font-bold md:text-xl">
          Growth of ₹100
        </h2>
        <div className="md:hidden">
          <Segmented
            compact
            label="Period"
            value={period === "all" ? "5" : period}
            onChange={setPeriod}
            options={opts(true)}
          />
        </div>
        <div className="hidden md:block">
          <Segmented
            label="Period"
            value={period}
            onChange={setPeriod}
            options={opts(false)}
          />
        </div>
      </div>
      {fEnd !== null && (
        <p
          className="mt-2.5 mb-3 text-[15px] text-text-2 md:mb-4 md:text-base"
          aria-live="polite"
        >
          ₹100 in {monthOfDay(from)} is{" "}
          <AnimatedNumber
            value={fEnd}
            format="rupees"
            className="font-bold text-ink"
          />{" "}
          today.
          {cEnd !== null && (
            <>
              {" "}
              {cap(peer)} turned it into{" "}
              <AnimatedNumber value={cEnd} format="rupees" />.
            </>
          )}
        </p>
      )}
      <div className="md:hidden">
        <GrowthChart
          height={140}
          fromDay={from}
          lines={lines.map((l) => ({ ...l, width: l.muted ? 2 : 2.5 }))}
          label={`${name} against ${peer}, growth of ₹100 since ${monthOfDay(from)}`}
        />
      </div>
      <div className="hidden md:block">
        <GrowthChart
          height={240}
          fromDay={from}
          lines={lines}
          label={`${name} against ${peer}, growth of ₹100 since ${monthOfDay(from)}`}
        />
      </div>
      <Legend
        className="mt-3 text-[13px] md:text-sm"
        lines={[{ ...lines[0], label: name }, lines[1]]}
      />
    </section>
  );
}

/* ---------------- SIP ---------------- */

const PRESETS = [1000, 5000, 10000];

export function SipCard({
  name,
  fund,
  category,
  monthlyFund,
  monthlyCategory,
}: {
  name: string;
  fund: Series;
  category: Series;
  monthlyFund: Series;
  monthlyCategory: Series;
}) {
  const first = fund[0]?.[0];
  const last = fund.at(-1)?.[0];
  const [mode, setMode] = useState<"sip" | "once">("sip");
  const [amount, setAmount] = useState(5000);
  const [other, setOther] = useState(false);
  const firstMonth =
    first !== undefined
      ? monthStart(first, 0, first - monthStart(first) > 7 ? -1 : 0)
      : 0;

  const months = useMemo(() => {
    if (last === undefined) return [] as Option<string>[];
    const opts: Option<string>[] = [];
    for (const y of [10, 8, 6, 5, 4, 3, 2, 1]) {
      const d = monthStart(last, y);
      if (d >= firstMonth)
        opts.push({
          value: String(d),
          label: monthOfDay(d),
          note: `${y} year${y > 1 ? "s" : ""}`,
        });
    }
    if (!opts.some((o) => o.value === String(firstMonth)))
      opts.unshift({
        value: String(firstMonth),
        label: monthOfDay(firstMonth),
        note: "launch",
      });
    return opts;
  }, [last, firstMonth]);
  const [since, setSince] = useState(() => {
    if (last === undefined) return "0";
    const five = monthStart(last, 5);
    return String(five >= firstMonth ? five : firstMonth);
  });

  if (first === undefined || last === undefined) return null;
  const fromDay = Number(since);
  const run = (monthly: Series, daily: Series) =>
    mode === "sip"
      ? sip(monthly, daily, fromDay, amount)
      : lumpSum(monthly, daily, fromDay, amount);
  const f = run(monthlyFund, fund);
  const c = run(monthlyCategory, category);
  const per = mode === "sip" ? " a month" : "";
  const title =
    mode === "sip" ? "If you'd started a SIP" : "If you'd invested once";

  const amountField = (
    <input
      type="text"
      inputMode="numeric"
      aria-label={mode === "sip" ? "Every month" : "Amount"}
      value={`₹${amount.toLocaleString("en-IN")}`}
      onChange={(e) => {
        const n = Number(e.target.value.replace(/[^0-9]/g, "").slice(0, 9));
        setAmount(n);
      }}
      className="h-10 w-[120px] rounded-[10px] border border-border-strong bg-surface px-3 text-base text-ink focus:border-brand"
    />
  );

  return (
    <section
      aria-labelledby="sip-h"
      className="rounded-[18px] border border-border bg-surface p-4 md:p-6"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id="sip-h" className="text-[17px] font-bold md:text-xl">
          {title}
        </h2>
        <Segmented
          compact
          label="How"
          value={mode}
          onChange={(m) => {
            setMode(m);
            setAmount(m === "sip" ? 5000 : 100000);
            setOther(false);
          }}
          options={[
            { value: "sip", label: "Monthly" },
            { value: "once", label: "Once" },
          ]}
        />
      </div>

      {/* Laptop controls (mock: LaptopFund SIP card) */}
      <div className="mt-3.5 hidden flex-wrap gap-2 md:flex">
        <label className="flex flex-col gap-1 text-[13px] text-text-3">
          {mode === "sip" ? "Every month" : "Amount"}
          {amountField}
        </label>
        <div className="flex flex-col gap-1 text-[13px] text-text-3">
          <span>Since</span>
          <Listbox
            label="Since"
            options={months}
            value={since}
            onChange={setSince}
          />
        </div>
      </div>

      {/* Phone controls (mock: PeacockPhoneFund SIP card) */}
      <div className="mt-3 flex gap-2 md:hidden">
        {(mode === "sip" ? PRESETS : [10000, 100000, 500000]).map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={!other && amount === p}
            onClick={() => {
              setAmount(p);
              setOther(false);
            }}
            className={cn(
              "h-10 flex-1 rounded-[10px] border text-[15px]",
              !other && amount === p
                ? "border-brand bg-brand-soft font-bold text-brand-ink"
                : "border-border bg-surface text-ink",
            )}
          >
            {inr(p).replace(" lakh", "L")}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={other}
          onClick={() => setOther(true)}
          className={cn(
            "h-10 flex-1 rounded-[10px] border text-[15px]",
            other
              ? "border-brand bg-brand-soft font-bold text-brand-ink"
              : "border-border bg-surface text-ink",
          )}
        >
          Other
        </button>
      </div>
      <AnimatePresence initial={false}>
        {other && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden md:hidden"
          >
            <div className="pt-2">{amountField}</div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mt-3.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] text-text-2 md:hidden">
        <span>
          {inr(amount)}
          {per} since
        </span>
        <Listbox
          label="Since"
          options={months}
          value={since}
          onChange={setSince}
          size="sm"
          className="min-w-28"
        />
      </div>

      {f && amount > 0 ? (
        <>
          <p className="mt-0.5 text-[36px] leading-[1.15] font-bold md:mt-4 md:text-[40px] md:leading-[1.1]">
            <AnimatedNumber value={f.value} format="inr" />{" "}
            <span className="text-base font-medium text-text-2 md:hidden">
              today
            </span>
          </p>
          <dl className="mt-3.5 grid grid-cols-3 border-t border-hairline pt-3">
            {[
              [
                mode === "sip" ? "You put in" : "Invested",
                <AnimatedNumber key="i" value={f.invested} format="inr" />,
                "",
              ],
              [
                "Return a year",
                f.perYear !== null
                  ? `${f.perYear < 0 ? "−" : "+"}${Math.abs(f.perYear).toFixed(1)}%`
                  : "—",
                f.perYear === null
                  ? ""
                  : f.perYear >= 0
                    ? "text-gain"
                    : "text-loss",
              ],
              [
                "Category",
                c ? (
                  <AnimatedNumber key="c" value={c.value} format="inr" />
                ) : (
                  "—"
                ),
                "",
              ],
            ].map(([k, v, tone], i) => (
              <div
                key={i}
                className={cn(
                  "min-w-0",
                  i > 0 && "border-l border-hairline pl-3",
                )}
              >
                <dt className="truncate text-[13px] text-text-3">{k}</dt>
                <dd
                  className={cn(
                    "mt-0.5 text-[17px] font-bold tabular-nums",
                    tone as string,
                  )}
                >
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </>
      ) : (
        <p className="mt-4 text-text-2">
          {amount > 0
            ? "Pick an earlier month: there are no prices after it yet."
            : "Enter an amount."}
        </p>
      )}
      <p className="mt-2.5 text-[13px] text-text-3">
        Uses real past prices
        {mode === "sip" ? ", on the first trading day of each month" : ""}. The
        past isn't a promise.
      </p>
      <span className="sr-only" aria-live="polite">
        {f ? `${name}: ${inr(f.value)} from ${inr(f.invested)}` : ""}
      </span>
    </section>
  );
}
