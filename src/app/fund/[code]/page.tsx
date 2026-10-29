import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AmcLogo } from "@/components/AmcLogo";
import {
  FundActionBar,
  FundButtons,
  FundTopBar,
  GrowthCard,
  SipCard,
} from "@/components/FundParts";
import { Disclaimer, Page } from "@/components/Page";
import { ScoreStrip } from "@/components/ScoreStrip";
import { Shared } from "@/components/Shared";
import { getFundDetail, type FundDetail, type FundRow } from "@/lib/data";
import { aum, day, fall, inr, month, nav, pct, rankOf } from "@/lib/format";
import { cn } from "@/lib/utils";
import { median, partNotes, plainWords, worstFallWords } from "@/lib/verdict";

export const revalidate = 3600;

/** None at build time; each fund page renders on its first visit, then stays cached for an hour. */
export function generateStaticParams() {
  return [];
}

type Params = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const detail = await getFundDetail(decodeURIComponent((await params).code));
  if (!detail) return { title: "Fund not found" };
  const { fund, board } = detail;
  const score =
    fund.score !== null
      ? `Compass Score ${fund.score.toFixed(1)}, ${rankOf(fund.rank!, board.rated).toLowerCase()} ${board.info.plural}`
      : "Too new to rate";
  return {
    title: `${fund.name}: ${score}`,
    description: `How ${fund.name} (direct, growth) compares with other ${board.info.plural}: returns, consistency, falls and cost, from real prices.`,
  };
}

const PARTS = [
  ["returns", "Returns vs peers"],
  ["consistency", "Consistency"],
  ["downside", "Downside protection"],
  ["cost", "Cost"],
] as const;

function sinceLaunch(d: FundDetail) {
  const f = d.weekly.fund;
  const c = d.weekly.category;
  const g = (s: typeof f) =>
    s.length > 1 && s.at(-1)![0] - s[0][0] >= 365
      ? (Math.pow(s.at(-1)![1] / s[0][1], 365.25 / (s.at(-1)![0] - s[0][0])) -
          1) *
        100
      : null;
  return { fund: g(f), category: g(c) };
}

const riskWords = (r: string | null) =>
  r
    ? r
        .replace(/\s*risk$/i, "")
        .toLowerCase()
        .replace(/^./, (c) => c.toUpperCase())
    : null;
const toneOf = (n: number | null) =>
  n === null
    ? ""
    : Math.round(n * 10) > 0
      ? "text-gain"
      : Math.round(n * 10) < 0
        ? "text-loss"
        : "";
const card = "rounded-[18px] border border-border bg-surface";

function ScoreCard({
  fund,
  detail,
  peers,
}: {
  fund: FundRow;
  detail: FundDetail;
  peers: number[];
}) {
  const { board } = detail;
  const info = board.info;
  if (fund.score === null || !fund.parts)
    return (
      <section
        aria-label="Compass Score"
        className="rounded-[18px] bg-marigold-soft p-4 text-marigold-ink md:p-6"
      >
        <p className="text-sm md:text-[15px]">Compass Score</p>
        <h2 className="text-[17px] font-bold md:text-[22px]">
          Too new to rate
        </h2>
        <p className="mt-1.5 max-w-[60ch] text-[15px]">
          {fund.unratedReason === "Less than 3 years of history"
            ? `A score needs 3 years of prices to compare fairly with other ${info.plural}.${fund.startDate ? ` This fund started in ${month(fund.startDate)}.` : ""} Its record so far is below; treat a short record with care.`
            : `${fund.unratedReason}. We'll score it once that changes.`}
        </p>
      </section>
    );
  const notes = partNotes(fund);
  const label = `Score ${fund.score.toFixed(1)}: ${rankOf(fund.rank!, board.rated).toLowerCase()} rated ${info.plural}. Grey dots are the others.`;
  return (
    <section aria-label="Compass Score" className={cn(card, "p-4 md:p-6")}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-text-2 md:text-[15px]">Compass Score</p>
          <p className="text-base font-bold md:text-[22px]">
            {rankOf(fund.rank!, board.rated)}{" "}
            <span className="md:hidden">{info.short}</span>
            <span className="hidden md:inline">{info.plural}</span>
          </p>
        </div>
        <Shared name={`score-${fund.code}`}>
          <p className="text-[40px] leading-none font-bold md:text-[52px]">
            {fund.score.toFixed(1)}
          </p>
        </Shared>
      </div>
      <ScoreStrip
        score={fund.score}
        peers={peers}
        size="lg"
        label={label}
        className="mx-2.5 mt-3 md:hidden"
      />
      <ScoreStrip
        score={fund.score}
        peers={peers}
        size="xl"
        label={label}
        className="mx-3 mt-[18px] hidden md:block"
      />
      <div className="flex justify-between text-xs text-text-3 md:text-[13px]">
        <span>Weakest record</span>
        <span>Strongest</span>
      </div>
      {/* Laptop: four columns with notes */}
      <div className="mt-5 hidden grid-cols-4 gap-4 border-t border-hairline pt-5 md:grid">
        {PARTS.map(([k, name], i) => {
          const v = Math.round(fund.parts![k]);
          return (
            <div key={k}>
              <p className="text-sm text-text-2">{name}</p>
              <p className="mt-0.5 mb-1.5 text-2xl font-bold">{v}</p>
              <span
                role="meter"
                aria-label={`${name}: ${v} out of 100`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={v}
                className="block h-2 overflow-hidden rounded bg-bar"
              >
                <span
                  className="mfc-fill block h-full rounded bg-brand"
                  style={{
                    width: `${Math.max(v, 2)}%`,
                    animationDelay: `${150 + i * 80}ms`,
                  }}
                />
              </span>
              {notes[k] && (
                <p className="mt-1.5 text-[13px] text-text-3">{notes[k]}</p>
              )}
            </div>
          );
        })}
      </div>
      {/* Phone: rows */}
      <ul className="mt-3.5 grid gap-2.5 border-t border-hairline pt-3.5 md:hidden">
        {PARTS.map(([k, name], i) => {
          const v = Math.round(fund.parts![k]);
          return (
            <li
              key={k}
              className="grid grid-cols-[140px_minmax(0,1fr)_28px] items-center gap-2.5 text-sm"
            >
              <span className="text-text-2">{name}</span>
              <span
                role="meter"
                aria-label={`${name}: ${v} out of 100`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={v}
                className="block h-2 overflow-hidden rounded bg-bar"
              >
                <span
                  className="mfc-fill block h-full rounded bg-brand"
                  style={{
                    width: `${Math.max(v, 2)}%`,
                    animationDelay: `${150 + i * 80}ms`,
                  }}
                />
              </span>
              <span className="text-right font-semibold">{v}</span>
            </li>
          );
        })}
      </ul>
      <Link
        href="/method"
        transitionTypes={["nav-forward"]}
        className="mt-3 inline-block text-sm font-semibold md:hidden"
      >
        What these mean
      </Link>
    </section>
  );
}

export default async function FundPage({ params }: Params) {
  const detail = await getFundDetail(decodeURIComponent((await params).code));
  if (!detail) notFound();
  const { fund, board } = detail;
  const info = board.info;
  const rated = board.funds.filter((f) => f.score !== null);
  const peers = rated.filter((f) => f.code !== fund.code).map((f) => f.score!);
  const words = plainWords(
    fund,
    info,
    board.returns.r1y,
    median(board.funds.map((f) => f.expense)),
  );
  const launch = sinceLaunch(detail);
  const startYear = fund.startDate?.slice(0, 4);
  const at = fund.rank ? fund.rank - 1 : 0;
  const lo = Math.max(0, Math.min(at - 1, rated.length - 4));
  const rivals = rated.slice(lo, lo + 4);
  const returns = [
    ["1 year", fund.r1y, board.returns.r1y],
    ["3 years", fund.r3y, board.returns.r3y],
    ["5 years", fund.r5y, board.returns.r5y],
    [
      startYear ? `Since ${startYear}` : "Since launch",
      launch.fund,
      launch.category,
    ],
  ] as const;
  const details: [string, React.ReactNode, boolean][] = [
    [
      "Cost per year",
      fund.expense !== null ? `${fund.expense.toFixed(2)}%` : null,
      true,
    ],
    ["Fund size", aum(fund.aum), true],
    [
      fund.managers.length === 1 ? "Manager" : "Managers",
      fund.managers.length
        ? fund.managers.map((m) => (
            <span key={m} className="block">
              {m}
            </span>
          ))
        : null,
      true,
    ],
    ["Smallest SIP", detail.sipMin ? inr(detail.sipMin) : null, true],
    [
      "Lock-in",
      detail.lockInDays === null
        ? null
        : detail.lockInDays <= 0
          ? "None"
          : detail.lockInDays % 365 === 0
            ? `${detail.lockInDays / 365} years`
            : `${detail.lockInDays} days`,
      false,
    ],
    ["Risk (SEBI)", riskWords(detail.risk), true],
  ];
  const navText = `NAV ${nav(fund.nav)}${fund.navDate ? ` on ${day(fund.navDate)}` : ""}`;

  const plainCard = (
    <section
      aria-labelledby="plain-h"
      className="rounded-[18px] bg-brand-soft p-4 md:p-5"
    >
      <h2
        id="plain-h"
        className="mb-2 text-[17px] font-bold text-brand-ink md:mb-2.5 md:text-lg"
      >
        In plain words
      </h2>
      {words.length ? (
        <ul className="grid list-disc gap-1.5 pl-[18px] text-[15px] text-ink marker:text-brand md:gap-2">
          {words.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : (
        <p className="text-[15px] text-ink">
          We'll describe its record once it has 3 years of prices to compare.
        </p>
      )}
    </section>
  );

  return (
    <>
      <FundTopBar
        code={fund.code}
        category={fund.category}
        label={info.label}
        back={`/funds/${info.slug}`}
      />
      <Page className="mx-auto max-w-[1280px] px-4 pb-6 md:px-8 md:pt-6 md:pb-16">
        <nav
          aria-label="Breadcrumb"
          className="hidden text-sm text-text-3 md:block"
        >
          <Link href={`/funds/${info.slug}`} transitionTypes={["nav-back"]}>
            {info.label} funds
          </Link>{" "}
          <span aria-hidden="true">›</span> {fund.name}
        </nav>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-4 pt-1 md:mt-3.5 md:pt-0">
          <div className="flex min-w-0 flex-[1_1_360px] items-center gap-3.5 md:gap-6">
            <span className="md:hidden">
              <Shared name={`logo-${fund.code}`} on="phone">
                <AmcLogo
                  houseCode={fund.houseCode}
                  house={fund.house}
                  size={52}
                  className="bg-white"
                />
              </Shared>
            </span>
            <span className="hidden md:block">
              <Shared name={`logo-${fund.code}`} on="laptop">
                <AmcLogo
                  houseCode={fund.houseCode}
                  house={fund.house}
                  size={64}
                />
              </Shared>
            </span>
            <div className="min-w-0 leading-tight">
              <Shared name={`name-${fund.code}`}>
                <h1 className="text-2xl font-bold tracking-[-0.01em] md:text-[34px] md:tracking-[-0.02em]">
                  {fund.name}
                </h1>
              </Shared>
              <p className="mt-0.5 text-sm text-text-3 md:mt-1.5 md:text-[15px]">
                Direct · Growth
                <span className="hidden md:inline">
                  {fund.house ? ` · ${fund.house}` : ""}
                </span>{" "}
                · {navText}
              </p>
            </div>
          </div>
          <div className="hidden md:block">
            <FundButtons code={fund.code} category={fund.category} />
          </div>
        </div>

        <div className="mt-3.5 flex flex-wrap items-start gap-3.5 md:mt-6 md:gap-6">
          <div className="flex min-w-0 flex-[999_1_720px] flex-col gap-3.5 md:gap-6">
            <ScoreCard fund={fund} detail={detail} peers={peers} />
            <div className="md:hidden">{plainCard}</div>
            <GrowthCard
              name={fund.name}
              peer={info.peer}
              fund={detail.weekly.fund}
              category={detail.weekly.category}
            />
            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-[repeat(auto-fit,minmax(320px,1fr))] md:gap-6">
              <SipCard
                name={fund.name}
                fund={detail.weekly.fund}
                category={detail.weekly.category}
                monthlyFund={detail.monthly.fund}
                monthlyCategory={detail.monthly.category}
              />
              <section
                aria-labelledby="ret-h"
                className={cn(card, "p-4 md:p-6")}
              >
                <h2
                  id="ret-h"
                  className="mb-1.5 text-[17px] font-bold md:mb-2 md:text-xl"
                >
                  Returns, per year
                </h2>
                {/* Laptop table */}
                <table className="hidden w-full border-collapse text-[15px] md:table">
                  <caption className="sr-only">
                    {fund.name} returns per year against its category
                  </caption>
                  <thead>
                    <tr className="text-right text-[13px] text-text-3">
                      <th scope="col" className="py-1.5 text-left font-medium">
                        <span className="sr-only">Period</span>
                      </th>
                      <th scope="col" className="font-medium">
                        This fund
                      </th>
                      <th scope="col" className="font-medium">
                        Category
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {returns.map(([l, f, c]) => (
                      <tr
                        key={l}
                        className="border-t border-hairline text-right"
                      >
                        <th
                          scope="row"
                          className="py-2.5 text-left font-medium"
                        >
                          {l}
                        </th>
                        <td className={cn("font-bold", toneOf(f))}>{pct(f)}</td>
                        <td className="text-text-2">{pct(c)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Phone: four figures */}
                <dl className="grid grid-cols-4 gap-1 text-center md:hidden">
                  {returns.map(([l, f]) => (
                    <div key={l} className="py-2">
                      <dt className="text-[13px] text-text-3">{l}</dt>
                      <dd className={cn("font-bold", toneOf(f))}>{pct(f)}</dd>
                    </div>
                  ))}
                </dl>
                {detail.worst && (
                  <p className="mt-2.5 rounded-xl bg-marigold-soft p-3 text-sm text-marigold-ink md:hidden">
                    <strong className="font-bold">
                      Worst fall: {fall(detail.worst.fall)}
                    </strong>
                    , {month(detail.worst.peak)} to {month(detail.worst.trough)}
                    .{" "}
                    {detail.worst.recovered
                      ? `Back at its old high by ${month(detail.worst.recovered)}.`
                      : "Not yet back at its old high."}
                  </p>
                )}
                <p className="mt-2 text-[13px] text-text-3">
                  {board.asOf ? `To ${day(board.asOf)}. ` : ""}Category: average
                  of direct plans. A dash: not around that long.
                </p>
              </section>
            </div>
            {rated.length > 0 && (
              <section
                aria-labelledby="rivals-h"
                className={cn(card, "p-4 md:p-6")}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2
                    id="rivals-h"
                    className="text-[17px] font-bold md:text-xl"
                  >
                    Closest rivals
                  </h2>
                  <Link
                    href={`/funds/${info.slug}`}
                    transitionTypes={["nav-back"]}
                    className="text-[15px] font-semibold"
                  >
                    All {board.rated} {info.short}
                  </Link>
                </div>
                <table className="-mx-4 mt-2.5 w-[calc(100%+2rem)] border-collapse text-[15px] md:-mx-6 md:w-[calc(100%+3rem)]">
                  <thead>
                    <tr className="text-right text-[13px] text-text-3">
                      <th
                        scope="col"
                        className="py-2 pl-4 text-left font-medium md:pl-6"
                      >
                        Fund
                      </th>
                      <th
                        scope="col"
                        className="pr-4 pl-4 text-right font-medium sm:pr-0"
                      >
                        Compass Score
                      </th>
                      <th
                        scope="col"
                        className="hidden pl-4 font-medium sm:table-cell"
                      >
                        3 yrs
                      </th>
                      <th
                        scope="col"
                        className="hidden pl-4 font-medium max-md:pr-4 sm:table-cell"
                      >
                        Cost
                      </th>
                      <th
                        scope="col"
                        className="hidden pr-6 font-medium md:table-cell"
                      >
                        Size
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rivals.map((r) => {
                      const me = r.code === fund.code;
                      return (
                        <tr
                          key={r.code}
                          className={cn(
                            "border-t border-hairline",
                            me && "bg-[#FBF7EC] dark:bg-[#211d12]",
                          )}
                        >
                          <th
                            scope="row"
                            className="py-3 pl-4 text-left font-semibold md:pl-6"
                          >
                            <Link
                              href={`/fund/${encodeURIComponent(r.code)}`}
                              aria-current={me ? "page" : undefined}
                              className="flex items-center gap-2.5 text-ink hover:text-brand"
                            >
                              <AmcLogo
                                houseCode={r.houseCode}
                                house={r.house}
                                size={28}
                              />
                              <span className="min-w-0 truncate">{r.name}</span>
                            </Link>
                          </th>
                          <td className="pr-4 pl-4 text-right font-bold sm:pr-0">
                            {r.score!.toFixed(1)}
                          </td>
                          <td
                            className={cn(
                              "hidden pl-4 text-right font-semibold sm:table-cell",
                              toneOf(r.r3y),
                            )}
                          >
                            {pct(r.r3y)}
                          </td>
                          <td className="hidden pl-4 text-right max-md:pr-4 sm:table-cell">
                            {r.expense !== null
                              ? `${r.expense.toFixed(2)}%`
                              : "—"}
                          </td>
                          <td className="hidden pr-6 pl-4 text-right whitespace-nowrap text-text-2 md:table-cell">
                            {aum(r.aum)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
            )}
          </div>

          <aside
            className="flex min-w-0 flex-[1_1_320px] flex-col gap-3.5 md:gap-6"
            aria-label="About this fund"
          >
            <div className="hidden md:block">{plainCard}</div>
            {detail.worst && (
              <section
                aria-labelledby="worst-h"
                className="hidden rounded-[18px] bg-marigold-soft p-5 text-marigold-ink md:block"
              >
                <h2 id="worst-h" className="text-lg font-bold">
                  Worst fall: {fall(detail.worst.fall)}
                </h2>
                <p className="mt-1.5 text-[15px]">
                  {worstFallWords(detail.worst)}
                </p>
              </section>
            )}
            <section
              aria-label="Details"
              className={cn(card, "px-4 py-1 md:px-5 md:py-2")}
            >
              <dl className="text-[15px]">
                {details.map(([k, v, phone], i) => (
                  <div
                    key={k}
                    className={cn(
                      "flex justify-between gap-3 py-3",
                      i < details.length - 1 && "border-b border-hairline",
                      !phone && "max-md:hidden",
                    )}
                  >
                    <dt className="text-text-3">{k}</dt>
                    <dd className="min-w-0 text-right font-semibold [overflow-wrap:anywhere]">
                      {v ?? "—"}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
            <Disclaimer className="max-md:text-xs">
              Not investment advice. MF Compass compares past records; past
              returns don't guarantee future ones. Data: AMFI, Kuvera. Category
              figures use direct plans.
            </Disclaimer>
          </aside>
        </div>
      </Page>
      <FundActionBar code={fund.code} category={fund.category} />
    </>
  );
}
