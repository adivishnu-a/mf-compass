import type { Metadata } from "next";
import Link from "next/link";
import { AmcLogo } from "@/components/AmcLogo";
import {
  AddFund,
  CompareStart,
  RemoveLink,
  ShareButton,
  SwapButton,
  SyncPicks,
} from "@/components/CompareBits";
import { GrowthChart, Legend, type Line } from "@/components/GrowthChart";
import { Disclaimer, Page } from "@/components/Page";
import { BackButton, PhoneTitleBar } from "@/components/PhoneBar";
import { categoryByName } from "@/lib/categories";
import { getFundDetail, type FundDetail } from "@/lib/data";
import {
  aum,
  fall,
  houseShort,
  inr,
  month,
  monthOfDay,
  nav,
  pct,
  rankOf,
  span,
  year,
} from "@/lib/format";
import { sip } from "@/lib/growth";
import { COMPARE_MAX } from "@/lib/limits";
import { cn } from "@/lib/utils";

export const revalidate = 3600;

type Search = { searchParams: Promise<{ funds?: string }> };

const codesFrom = (raw?: string) =>
  [
    ...new Set(
      (raw ?? "")
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
    ),
  ].slice(0, COMPARE_MAX);
async function load(raw?: string) {
  const details = await Promise.all(
    codesFrom(raw).map((c) => getFundDetail(c)),
  );
  return details.filter((d): d is FundDetail => d !== null);
}
const andJoin = (xs: string[]) =>
  xs.length < 2
    ? xs.join("")
    : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`;

export async function generateMetadata({
  searchParams,
}: Search): Promise<Metadata> {
  const details = await load((await searchParams).funds);
  if (details.length < 2) return { title: "Compare funds" };
  return {
    title: `Compare ${andJoin(details.map((d) => d.fund.name))}`,
    robots: { index: false },
  };
}

interface Row {
  label: string;
  hint?: string;
  values: (string | null)[];
  raw?: (number | null)[];
  better?: "high" | "low";
  /** Phrase for "Who leads on what", and its clipped phone form. */
  phrase?: string;
  short?: string;
  /** A return period ("1-year"): leads on several are joined into one phrase. */
  period?: string;
}

function leaders(row: Row) {
  if (!row.raw || !row.better) return new Set<number>();
  const vals = row.raw.flatMap((v, i) => (v === null ? [] : [[v, i] as const]));
  if (vals.length < 2) return new Set<number>();
  const best =
    row.better === "high"
      ? Math.max(...vals.map(([v]) => v))
      : Math.min(...vals.map(([v]) => v));
  const winners = vals
    .filter(([v]) => Math.abs(v - best) < 1e-9)
    .map(([, i]) => i);
  return winners.length === vals.length ? new Set<number>() : new Set(winners);
}

const DAY = 86_400_000;
const monthsBack = (day: number, years: number) => {
  const d = new Date(day * DAY);
  return Math.round(
    Date.UTC(d.getUTCFullYear() - years, d.getUTCMonth(), 1) / DAY,
  );
};

export default async function ComparePage({ searchParams }: Search) {
  const raw = (await searchParams).funds;
  const details = await load(raw);
  const codes = details.map((d) => d.fund.code);

  if (details.length < 2)
    return (
      <>
        <div className="md:hidden">
          <PhoneTitleBar title="Compare" />
        </div>
        <Page className="mx-auto max-w-[1280px] px-4 pt-5 md:px-8 md:pt-7">
          <h1 className="hidden text-[34px] font-bold tracking-[-0.02em] md:block">
            Compare funds
          </h1>
          <p className="max-w-[60ch] text-[15px] text-text-2 md:mt-2 md:text-[17px]">
            See up to {COMPARE_MAX} funds side by side: how far ahead of their
            peers they were, how often, how hard they fell, and what they cost.
          </p>
          <CompareStart />
        </Page>
        {/* Plain /compare (the nav link) keeps the picks; a link with funds in it sets them. */}
        {raw && <SyncPicks codes={codes} />}
      </>
    );

  const funds = details.map((d) => d.fund);
  const n = funds.length;
  const sameCat =
    new Set(funds.map((f) => f.category)).size === 1
      ? categoryByName(funds[0].category)
      : null;
  const board = details[0].board;

  // A common start: five years back, or the youngest fund's first full month.
  const lastDay = Math.min(
    ...details.map((d) => d.weekly.fund.at(-1)?.[0] ?? 0),
  );
  const youngest = Math.max(
    ...details.map((d) => d.weekly.fund[0]?.[0] ?? Infinity),
  );
  const y = new Date(youngest * DAY);
  const firstMonth = Math.round(
    Date.UTC(
      y.getUTCFullYear(),
      y.getUTCMonth() + (y.getUTCDate() > 7 ? 1 : 0),
      1,
    ) / DAY,
  );
  const fromDay = Math.max(monthsBack(lastDay, 5), firstMonth);
  const sipOut = details.map((d) =>
    sip(d.monthly.fund, d.weekly.fund, fromDay, 5000),
  );
  const catSip = sameCat
    ? sip(
        details[0].monthly.category,
        details[0].weekly.category,
        fromDay,
        5000,
      )
    : null;
  const invested = sipOut.find(Boolean)?.invested ?? null;
  const cat = (v: number | null) =>
    sameCat && v !== null ? `category ${pct(v)}` : undefined;
  const annual = (v: number | null) =>
    ["annualised", cat(v)].filter(Boolean).join(" · ");

  const rows: Row[] = [
    {
      label: "Returns vs peers",
      hint: "a year, over 3-year periods",
      values: funds.map((f) => (f.excess === null ? null : pct(f.excess))),
      raw: funds.map((f) => f.excess),
      better: "high",
      phrase: "further ahead of its peers",
      short: "further ahead",
    },
    {
      label: "Consistency",
      hint: "ahead of peers",
      values: funds.map((f) =>
        f.consistency === null
          ? null
          : `${Math.round(f.consistency * 100)}% of the time`,
      ),
      raw: funds.map((f) => f.consistency),
      better: "high",
      phrase: "was ahead more consistently",
      short: "more consistent",
    },
    {
      label: "Falls vs peers",
      hint: "in falling months",
      values: funds.map((f) =>
        f.downCapture === null
          ? null
          : Math.abs(100 - f.downCapture) < 0.5
            ? "Same"
            : `${Math.round(Math.abs(100 - f.downCapture))}% ${f.downCapture < 100 ? "less" : "more"}`,
      ),
      raw: funds.map((f) => f.downCapture),
      better: "low",
      phrase: "fell less in bad months",
      short: "falls less",
    },
    {
      label: board.fallFrom
        ? `Worst fall since ${year(board.fallFrom)}`
        : "Worst fall, recent",
      hint:
        sameCat && board.fall !== null
          ? `category ${fall(board.fall, 0)}`
          : undefined,
      values: funds.map((f) => (f.fall === null ? null : fall(f.fall, 0))),
      raw: funds.map((f) => f.fall),
      better: "high",
      phrase: "had the smaller worst fall",
      short: "smaller worst fall",
    },
    {
      label: "Cost",
      hint: "per year",
      values: funds.map((f) =>
        f.expense === null ? null : `${f.expense.toFixed(2)}%`,
      ),
      raw: funds.map((f) => f.expense),
      better: "low",
      phrase: "costs less",
      short: "cheaper",
    },
    {
      label: "1 year",
      hint: cat(board.returns.r1y),
      values: funds.map((f) => (f.r1y === null ? null : pct(f.r1y))),
      raw: funds.map((f) => f.r1y),
      better: "high",
      period: "1-year",
    },
    {
      label: "3 years",
      hint: annual(board.returns.r3y),
      values: funds.map((f) => (f.r3y === null ? null : pct(f.r3y))),
      raw: funds.map((f) => f.r3y),
      better: "high",
      period: "3-year",
    },
    {
      label: "5 years",
      hint: annual(board.returns.r5y),
      values: funds.map((f) => (f.r5y === null ? null : pct(f.r5y))),
      raw: funds.map((f) => f.r5y),
      better: "high",
      period: "5-year",
    },
    {
      label: `₹5,000 a month since ${monthOfDay(fromDay)}`,
      hint: invested
        ? `${inr(invested)} put in${catSip ? ` · category ${inr(catSip.value)}` : ""}`
        : undefined,
      values: sipOut.map((s) => (s ? inr(s.value) : null)),
      raw: sipOut.map((s) => s?.value ?? null),
      better: "high",
    },
    {
      label: "Worst fall ever",
      hint: "when it happened, and the recovery",
      values: details.map((d) =>
        d.worst
          ? `${fall(d.worst.fall)}, ${month(d.worst.peak)} to ${month(d.worst.trough)}\n${d.worst.recovered ? `Recovered by ${month(d.worst.recovered)}, ${span(d.worst.trough, d.worst.recovered)} after the low` : "Not yet back at its high"}`
          : null,
      ),
    },
    { label: "Size", values: funds.map((f) => (f.aum ? aum(f.aum) : null)) },
    {
      label: "Managers",
      values: funds.map((f) =>
        f.managers.length ? f.managers.join("\n") : null,
      ),
    },
  ];
  const leads = rows.map(leaders);

  // Who leads on what, in sentences.
  const top = sameCat
    ? funds.reduce(
        (b, f, i) => ((f.score ?? -1) > (funds[b].score ?? -1) ? i : b),
        0,
      )
    : -1;
  const summary = funds
    .map((f, i) => {
      const led = rows.filter((r, k) => leads[k].has(i));
      const phrases = led.flatMap((r) => (r.phrase ? [r.phrase] : []));
      const shorts = led.flatMap((r) => (r.short ? [r.short] : []));
      const periods = led.flatMap((r) => (r.period ? [r.period] : []));
      if (periods.length) {
        phrases.push(
          `has the better ${andJoin(periods)} return${periods.length > 1 ? "s" : ""}`,
        );
        shorts.push(
          `better ${andJoin(periods.map((p) => p.replace("-year", "")))} year${periods.length > 1 || periods[0] !== "1-year" ? "s" : ""}`,
        );
      }
      if (!phrases.length) return null;
      const best = i === top && f.score !== null;
      return {
        name: f.name,
        text: best
          ? `has the stronger record overall: ${andJoin(phrases)}.`
          : `${andJoin(phrases)}.`,
        short: `${best ? "stronger record, " : ""}${shorts.join(", ")}.`,
      };
    })
    .filter(
      (x): x is { name: string; text: string; short: string } => x !== null,
    );
  const values = sipOut.flatMap((s) => (s ? [s.value] : []));
  const sipSpread =
    values.length >= 2
      ? Math.round((Math.max(...values) - Math.min(...values)) / 100) * 100
      : null;

  const chartFrom = Math.max(monthsBack(lastDay, 5), youngest);
  const colors = [
    "var(--series-1)",
    "var(--series-2)",
    "var(--series-3)",
    "var(--series-4)",
  ];
  const lines: Line[] = details.map((d, i) => ({
    label: d.fund.name,
    series: d.weekly.fund,
    color: colors[i],
    width: i === 0 ? 3 : 2.5,
  }));
  if (sameCat)
    lines.push({
      label: `Average ${sameCat.label.toLowerCase()}`,
      series: details[0].weekly.category,
      color: "var(--cat-line)",
      muted: true,
    });
  const growthEnd = (s: Line["series"]) => {
    const i = s.findIndex(([d]) => d >= chartFrom);
    return i < 0 ? null : (s.at(-1)![1] / s[i][1]) * 100;
  };
  const ends = lines.flatMap((l) => {
    const v = growthEnd(l.series);
    return v === null
      ? []
      : [
          `${l.muted ? l.label.toLowerCase() : l.label.split(" ")[0]} ₹${Math.round(v)}`,
        ];
  });

  const remove = (code: string) => {
    const rest = codes.filter((c) => c !== code);
    return rest.length
      ? `/compare?funds=${rest.map(encodeURIComponent).join(",")}`
      : "/compare";
  };
  const rankText = (i: number) =>
    funds[i].score !== null
      ? rankOf(funds[i].rank!, details[i].board.rated)
      : "Too new to rate";
  const winCell = "bg-win font-bold text-brand-ink";
  const cols =
    n === 2 ? "grid-cols-2" : n === 3 ? "grid-cols-3" : "grid-cols-4";

  const leadsCard = (summary.length > 0 || sipSpread !== null) && (
    <section
      aria-labelledby="leads-h"
      className="rounded-2xl bg-brand-soft p-4 md:rounded-[18px] md:px-6 md:py-5"
    >
      <h2
        id="leads-h"
        className="mb-1.5 text-base font-bold text-brand-ink md:mb-2 md:text-lg"
      >
        Who leads on what
      </h2>
      <p className="text-[15px] md:hidden">
        {summary.map((x) => (
          <span key={x.name}>
            <strong>{houseShort(x.name)}</strong>: {x.short}{" "}
          </span>
        ))}
        {sipSpread !== null &&
          `A SIP since ${year(new Date(fromDay * DAY).toISOString())} ends up within ${inr(sipSpread)}.`}
      </p>
      <ul className="hidden list-disc gap-1 pl-[18px] text-base marker:text-brand md:grid">
        {summary.map((s) => (
          <li key={s.name}>
            <strong>{s.name}</strong> {s.text}
          </li>
        ))}
        {sipSpread !== null && (
          <li>
            Started the same ₹5,000 SIP in {monthOfDay(fromDay)},{" "}
            {n === 2 ? "both" : `all ${n}`} would be within {inr(sipSpread)} of
            each other today.
          </li>
        )}
      </ul>
      {!sameCat && (
        <p className="mt-2 text-sm text-text-2">
          These are different kinds of fund, so each score is measured against
          its own peers.
        </p>
      )}
    </section>
  );

  return (
    <>
      <SyncPicks codes={codes} />
      <header className="flex items-center gap-1 px-2 pt-[calc(8px+env(safe-area-inset-top))] pb-2 md:hidden">
        <BackButton fallback="/funds" label="Back" />
        <h1 className="flex-1 text-xl font-bold">Compare</h1>
        <ShareButton />
      </header>
      <Page className="mx-auto max-w-[1280px] pb-8 md:px-8 md:pt-7 md:pb-16">
        {/* ---------- Laptop (mock: LaptopCompare) ---------- */}
        <div className="hidden md:block">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-[34px] font-bold tracking-[-0.02em]">
              {sameCat ? `Compare ${sameCat.plural}` : "Compare funds"}
            </h2>
          </div>
          <div className="mt-5">{leadsCard}</div>
          <div className="mt-5 overflow-x-auto rounded-[18px] border border-border bg-surface">
            <table className="w-full min-w-[960px] table-fixed border-collapse text-[15px]">
              <colgroup>
                <col className="w-[220px]" />
                {funds.map((f) => (
                  <col key={f.code} />
                ))}
                {n < COMPARE_MAX && <col className="w-[220px]" />}
              </colgroup>
              <thead>
                <tr className="align-top">
                  <th
                    scope="col"
                    className="p-5 text-left font-medium text-text-3"
                  >
                    Funds
                  </th>
                  {funds.map((f, i) => (
                    <th
                      key={f.code}
                      scope="col"
                      className="relative border-l border-hairline p-5 text-left"
                    >
                      <RemoveLink
                        href={remove(f.code)}
                        name={f.name}
                        className="absolute top-3 right-3"
                      />
                      <span className="flex items-center gap-3 pr-6">
                        <AmcLogo
                          houseCode={f.houseCode}
                          house={f.house}
                          size={44}
                        />
                        <span className="min-w-0 leading-tight">
                          <Link
                            href={`/fund/${encodeURIComponent(f.code)}`}
                            transitionTypes={["nav-forward"]}
                            className="block text-lg font-bold text-ink hover:text-brand"
                          >
                            {f.name}
                          </Link>
                          <span className="block text-[13px] font-normal text-text-3">
                            NAV {nav(f.nav)} · since {year(f.startDate)}
                          </span>
                        </span>
                      </span>
                      <span className="mt-3.5 flex items-baseline gap-2.5">
                        <span className="text-[34px] leading-none font-bold">
                          {f.score !== null ? f.score.toFixed(1) : "—"}
                        </span>
                        <span className="text-sm font-medium text-text-2">
                          {rankText(i)}
                        </span>
                      </span>
                    </th>
                  ))}
                  {n < COMPARE_MAX && (
                    <th scope="col" className="border-l border-hairline p-5">
                      <AddFund
                        codes={codes}
                        category={sameCat?.name}
                        variant="column"
                      />
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, k) => (
                  <tr key={r.label} className="border-t border-hairline">
                    <th
                      scope="row"
                      className="px-5 py-3.5 text-left font-semibold"
                    >
                      {r.label}
                      {r.hint && (
                        <span className="block text-[13px] font-normal text-text-3">
                          {r.hint}
                        </span>
                      )}
                    </th>
                    {r.values.map((v, i) => (
                      <td
                        key={i}
                        className={cn(
                          "border-l border-hairline px-5 py-3.5 [overflow-wrap:anywhere] whitespace-pre-line",
                          leads[k].has(i) && winCell,
                        )}
                      >
                        {v ?? <span className="text-text-3">—</span>}
                        {leads[k].has(i) && (
                          <span className="sr-only"> (leads)</span>
                        )}
                      </td>
                    ))}
                    {n < COMPARE_MAX && (
                      <td className="border-l border-hairline" />
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ---------- Phone (mock: PhoneCompare) ---------- */}
        <div className="md:hidden">
          <div className="sticky top-0 z-30 bg-bg px-3 pt-[env(safe-area-inset-top)] pb-2.5">
            <div className={cn("grid gap-2", cols)}>
              {funds.map((f, i) => (
                <div
                  key={f.code}
                  className="min-w-0 rounded-2xl border border-border bg-surface p-3"
                >
                  <span className="flex items-center justify-between gap-1">
                    <AmcLogo
                      houseCode={f.houseCode}
                      house={f.house}
                      size={n > 2 ? 28 : 32}
                    />
                    {n > 2 ? (
                      <RemoveLink
                        href={remove(f.code)}
                        name={f.name}
                        className="-m-1"
                      />
                    ) : (
                      <SwapButton
                        codes={codes}
                        code={f.code}
                        name={f.name}
                        category={f.category}
                      />
                    )}
                  </span>
                  <Link
                    href={`/fund/${encodeURIComponent(f.code)}`}
                    transitionTypes={["nav-forward"]}
                    className={cn(
                      "mt-2 block leading-tight font-bold text-ink",
                      n > 2 && "text-sm",
                    )}
                  >
                    {f.name}
                  </Link>
                  <span className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5">
                    <strong
                      className={cn(
                        "leading-none",
                        n > 2 ? "text-xl" : "text-[26px]",
                      )}
                    >
                      {f.score !== null ? f.score.toFixed(1) : "—"}
                    </strong>
                    <span className="text-[13px] text-text-2">
                      {f.score !== null
                        ? rankOf(f.rank!, details[i].board.rated).replace(
                            "Best",
                            "best",
                          )
                        : "Too new"}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3 px-3 pt-1">
            {leadsCard}
            <dl className="overflow-hidden rounded-2xl border border-border bg-surface">
              {rows.map((r, k) => (
                <div
                  key={r.label}
                  className={cn("p-3", k > 0 && "border-t border-hairline")}
                >
                  <dt className="px-1 text-[13px] text-text-3">
                    {r.label}
                    {r.hint ? ` (${r.hint})` : ""}
                  </dt>
                  <dd className={cn("mt-1.5 grid gap-2", cols)}>
                    {r.values.map((v, i) => (
                      <span
                        key={i}
                        className={cn(
                          "block rounded-[10px] px-2.5 py-2 [overflow-wrap:anywhere] whitespace-pre-line",
                          n > 2 ? "text-[13px]" : "text-[15px]",
                          leads[k].has(i) ? winCell : "bg-surface-2 text-ink",
                        )}
                      >
                        {v ?? "—"}
                      </span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
            <Disclaimer className="text-xs">
              Highlighted values lead that row. Past records only; not advice.
            </Disclaimer>
          </div>
        </div>

        <section
          aria-labelledby="growth-c"
          className="mx-3 mt-3 rounded-[18px] border border-border bg-surface p-4 md:mx-0 md:mt-5 md:p-6"
        >
          <h2 id="growth-c" className="text-[17px] font-bold md:text-xl">
            ₹100{" "}
            {chartFrom === monthsBack(lastDay, 5)
              ? "over five years"
              : `since ${monthOfDay(chartFrom)}`}
          </h2>
          <p className="mt-1.5 mb-3.5 text-[15px] text-text-2">
            {ends.join(" · ")}
          </p>
          <div className="md:hidden">
            <GrowthChart
              height={160}
              fromDay={chartFrom}
              lines={lines}
              label={`Growth of ₹100: ${ends.join(", ")}`}
            />
          </div>
          <div className="hidden md:block">
            <GrowthChart
              height={220}
              fromDay={chartFrom}
              lines={lines}
              label={`Growth of ₹100: ${ends.join(", ")}`}
            />
          </div>
          <Legend className="mt-3" lines={lines} />
        </section>
        <Disclaimer className="mt-5 hidden md:block">
          Not investment advice. Compares past records only. Highlighted cells
          lead that row.
        </Disclaimer>
      </Page>
      <AddFund codes={codes} category={sameCat?.name} variant="bar" />
    </>
  );
}
