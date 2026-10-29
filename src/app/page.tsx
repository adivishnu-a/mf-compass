import Link from "next/link";
import { AmcLogo } from "@/components/AmcLogo";
import { ChevronRight } from "@/components/icons";
import { KindList, KindTiles } from "@/components/Kinds";
import { Mark } from "@/components/Mark";
import { Disclaimer, Page } from "@/components/Page";
import { SavedStrip } from "@/components/SavedStrip";
import { ScoreStrip } from "@/components/ScoreStrip";
import { SearchField } from "@/components/SearchField";
import { Shared } from "@/components/Shared";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getAllBoards } from "@/lib/data";
import { day, rankOf } from "@/lib/format";

export const revalidate = 3600;

const PARTS = [
  [
    "Returns vs peers · 35%",
    "How far ahead or behind the average fund of its kind, per year.",
  ],
  [
    "Consistency · 25%",
    "How often it was ahead, so one great year can't carry it.",
  ],
  ["Downside protection · 30%", "How much less it fell when markets fell."],
  ["Cost · 10%", "What it charges you every year."],
] as const;

const fundHref = (code: string) => `/fund/${encodeURIComponent(code)}`;

export default async function Home() {
  const boards = await getAllBoards();
  const total = boards.reduce((s, b) => s + b.funds.length, 0);
  const asOf =
    boards
      .map((b) => b.asOf)
      .filter(Boolean)
      .sort()
      .at(-1) ?? null;
  const best = ["large-cap", "mid-cap", "small-cap"]
    .map((slug) => boards.find((b) => b.info.slug === slug))
    .filter((b) => b && b.funds[0]?.score != null)
    .map((b) => ({ board: b!, fund: b!.funds[0] }));

  return (
    <Page>
      {/* ---------- Phone (mock: PhoneHome) ---------- */}
      <div className="md:hidden">
        <header className="flex items-center gap-2.5 px-4 pt-[calc(14px+env(safe-area-inset-top))] pb-1.5">
          <Mark size={30} />
          <span className="flex-1 text-[19px] font-bold">MF Compass</span>
          <ThemeToggle />
        </header>
        <div className="flex flex-col gap-[18px] px-4 pt-2">
          <section>
            <h1 className="text-[28px] leading-[1.1] font-bold tracking-[-0.02em]">
              Which funds have really beaten their peers?
            </h1>
            <SearchField
              variant="phone"
              placeholder="Search a fund"
              className="mt-3.5"
            />
          </section>
          <Link
            href="/finder"
            transitionTypes={["nav-forward"]}
            className="press flex items-center gap-3.5 rounded-[18px] bg-brand p-4 text-on-brand hover:text-on-brand"
          >
            <svg
              width="44"
              height="44"
              viewBox="0 0 44 44"
              aria-hidden="true"
              className="shrink-0"
            >
              <circle cx="22" cy="22" r="21" fill="#08455F" />
              <g
                className="mfc-needle"
                style={{ transformOrigin: "22px 22px" }}
              >
                <polygon points="31,13 24.6,24.6 19.4,19.4" fill="#F0A202" />
                <polygon points="13,31 19.4,19.4 24.6,24.6" fill="#FFFFFF" />
              </g>
            </svg>
            <span className="flex-1 leading-[1.3]">
              <span className="block text-[17px] font-bold">
                Not sure where to start?
              </span>
              <span className="block text-sm text-brand-muted dark:text-[#0E1519]/75">
                3 quick questions, then the kinds of funds that fit
              </span>
            </span>
            <ChevronRight size={20} />
          </Link>
          <SavedStrip />
          {best.length > 0 && (
            <section aria-labelledby="best-p">
              <h2 id="best-p" className="text-lg font-bold">
                Best records right now
              </h2>
              <ul className="mt-2.5 rounded-2xl border border-border bg-surface px-3.5 py-1">
                {best.map(({ board, fund }, i) => (
                  <li
                    key={fund.code}
                    className={i ? "border-t border-hairline" : ""}
                  >
                    <Link
                      href={fundHref(fund.code)}
                      transitionTypes={["nav-forward"]}
                      className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 py-3 text-ink hover:text-ink"
                    >
                      <Shared name={`logo-${fund.code}`} on="phone">
                        <AmcLogo
                          houseCode={fund.houseCode}
                          house={fund.house}
                          size={36}
                        />
                      </Shared>
                      <span className="min-w-0 leading-tight">
                        <span className="block truncate font-semibold">
                          {fund.name}
                        </span>
                        <span className="block text-[13px] text-text-3">
                          {board.info.label} ·{" "}
                          {rankOf(1, board.rated).toLowerCase()}
                        </span>
                      </span>
                      <strong className="text-xl">
                        {fund.score!.toFixed(1)}
                      </strong>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section aria-labelledby="kinds-p">
            <h2 id="kinds-p" className="text-lg font-bold">
              Kinds of funds
            </h2>
            <KindList boards={boards} className="mt-2.5" />
          </section>
          <Link
            href="/learn"
            transitionTypes={["nav-forward"]}
            className="flex items-center gap-3.5 rounded-2xl border border-border bg-surface p-4 text-ink hover:text-ink"
          >
            <span className="min-w-0 flex-1 leading-[1.3]">
              <span className="block font-bold">New to mutual funds?</span>
              <span className="block text-sm text-text-2">
                Learn the basics in about 10 minutes
              </span>
            </span>
            <span className="grid h-10 shrink-0 place-items-center rounded-[10px] bg-brand px-3.5 text-[15px] font-semibold text-on-brand">
              Learn
            </span>
          </Link>
          <Disclaimer className="pb-2 text-xs">
            Not investment advice. MF Compass compares funds' past records and
            is not a SEBI-registered adviser. Direct, growth plans only. Data:
            AMFI, Kuvera.
          </Disclaimer>
        </div>
      </div>

      {/* ---------- Laptop (mock: LaptopHome) ---------- */}
      <div className="mx-auto hidden max-w-[1280px] px-8 pt-12 pb-16 md:block">
        <section className="flex flex-wrap items-center gap-10">
          <div className="min-w-0 flex-[1_1_520px]">
            <h1 className="max-w-[15ch] text-[46px] leading-[1.05] font-bold tracking-[-0.03em]">
              Which funds have really beaten their peers?
            </h1>
            <p className="mt-4 max-w-[46ch] text-lg text-text-2">
              We compare every direct mutual fund with others like it, across
              years, falls and costs, and say it plainly. Free, no sign-up.
            </p>
            <SearchField
              variant="hero"
              placeholder="Search a fund, e.g. Parag Parikh flexi"
              className="mt-7 max-w-[560px]"
            />
            <p className="mt-3.5 text-[15px] text-text-2">
              Not sure where to start?{" "}
              <Link
                href="/finder"
                transitionTypes={["nav-forward"]}
                className="font-bold"
              >
                Answer 3 questions
              </Link>{" "}
              and see which kinds of funds fit.
            </p>
          </div>
          {best.length > 0 && (
            <section
              aria-labelledby="best-l"
              className="min-w-0 flex-[1_1_400px] rounded-[20px] border border-border bg-surface p-[22px]"
            >
              <h2 id="best-l" className="text-lg font-bold">
                Best records right now
              </h2>
              <p className="mt-0.5 mb-3.5 text-sm text-text-3">
                Top Compass Score in each of three popular categories
              </p>
              <ul className="grid gap-1">
                {best.map(({ board, fund }) => (
                  <li key={fund.code}>
                    <Link
                      href={fundHref(fund.code)}
                      transitionTypes={["nav-forward"]}
                      className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-1.5 py-2.5 text-ink hover:bg-row-hover hover:text-ink"
                    >
                      <Shared name={`logo-${fund.code}`} on="laptop">
                        <AmcLogo
                          houseCode={fund.houseCode}
                          house={fund.house}
                          size={40}
                        />
                      </Shared>
                      <span className="min-w-0 leading-tight">
                        <span className="block truncate font-semibold">
                          {fund.name}
                        </span>
                        <span className="block text-[13px] text-text-3">
                          {board.info.label} ·{" "}
                          {rankOf(1, board.rated).toLowerCase()}
                        </span>
                        <ScoreStrip
                          score={fund.score!}
                          peers={board.funds
                            .slice(1)
                            .flatMap((f) =>
                              f.score === null ? [] : [f.score],
                            )}
                          size="sm"
                          className="mt-1.5 mr-2"
                          label={`Score ${fund.score!.toFixed(1)}, best of ${board.rated} ${board.info.plural}. Grey dots are the others.`}
                        />
                      </span>
                      <span className="text-2xl font-bold">
                        {fund.score!.toFixed(1)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </section>

        <section aria-labelledby="cats" className="mt-16">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="cats" className="text-[28px] font-bold tracking-[-0.015em]">
              Pick a kind of fund
            </h2>
            <p className="text-sm text-text-3">
              {total} direct, growth funds
              {asOf ? ` · prices as of ${day(asOf)}` : ""}
            </p>
          </div>
          <div className="mt-[18px]">
            <KindTiles boards={boards} />
          </div>
        </section>

        <section
          aria-labelledby="how"
          className="mt-16 rounded-[20px] border border-border bg-surface p-8"
        >
          <h2 id="how" className="text-[28px] font-bold tracking-[-0.015em]">
            How the Compass Score works
          </h2>
          <p className="mt-2 max-w-[62ch] text-[17px] text-text-2">
            Each fund is compared with others of its kind over every 3-year
            stretch of the last six years, not one lucky year. It looks back. It
            doesn't predict, and it isn't advice.
          </p>
          <dl className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6">
            {PARTS.map(([name, line]) => (
              <div key={name}>
                <dt className="font-bold">{name}</dt>
                <dd className="mt-1 text-[15px] text-text-2">{line}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-[15px] text-text-2">
            Funds younger than 3 years show as{" "}
            <strong className="text-ink">too new to rate</strong> instead of
            getting a score.{" "}
            <Link
              href="/method"
              transitionTypes={["nav-forward"]}
              className="font-semibold"
            >
              The full method
            </Link>
          </p>
        </section>
        <section
          aria-labelledby="learn"
          className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4 rounded-[20px] bg-brand-soft px-8 py-7"
        >
          <div className="min-w-0 flex-[1_1_420px]">
            <h2
              id="learn"
              className="text-[22px] font-bold tracking-[-0.01em] text-brand-ink"
            >
              New to mutual funds?
            </h2>
            <p className="mt-1 max-w-[60ch] text-[17px] text-ink">
              What a fund is, what NAV, SIP and cost mean, and how to read every
              number on this site. About 10 minutes, no jargon.
            </p>
          </div>
          <Link
            href="/learn"
            transitionTypes={["nav-forward"]}
            className="press grid h-12 place-items-center rounded-xl bg-brand px-6 text-base font-semibold text-on-brand hover:bg-brand-hover hover:text-on-brand"
          >
            Learn the basics
          </Link>
        </section>
        <Disclaimer className="mt-12 max-w-[900px]">
          Not investment advice. MF Compass compares funds' past records and is
          not a SEBI-registered adviser. Direct, growth plans only. NAVs from
          AMFI; fund details from Kuvera. No tracking, no ads.
        </Disclaimer>
      </div>
    </Page>
  );
}
