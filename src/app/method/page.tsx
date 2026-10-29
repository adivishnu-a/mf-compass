import type { Metadata } from "next";
import Link from "next/link";
import { Page } from "@/components/Page";
import { BackButton } from "@/components/PhoneBar";

export const metadata: Metadata = {
  title: "How the Compass Score works",
  description:
    "What the Compass Score measures, how each fund is compared with its own category, and what it can't tell you.",
};

const PARTS = [
  [
    "Returns vs peers",
    "35%",
    "Take every 3-year stretch ending each week over the last 3 years. In each, how much did the fund earn per year more (or less) than the average fund of its kind? We use the typical (median) stretch, so one freak period can't decide it.",
  ],
  [
    "Consistency",
    "25%",
    "In what share of those 3-year stretches was the fund ahead? A fund ahead 95% of the time is more dependable than one ahead by a lot, but only half the time.",
  ],
  [
    "Downside protection",
    "30%",
    "In the months its category fell, how much did the fund fall by comparison? Plus its worst fall from a high against the category's worst fall over the same dates.",
  ],
  [
    "Cost",
    "10%",
    "The expense ratio: what the fund charges every year, taken out of your money whether it does well or not.",
  ],
] as const;

export default function MethodPage() {
  return (
    <>
      <header className="flex items-center px-2 pt-[calc(8px+env(safe-area-inset-top))] md:hidden">
        <BackButton fallback="/" label="Back" />
      </header>
      <Page>
        <article className="mx-auto max-w-[720px] px-4 pt-2 pb-12 md:px-8 md:pt-12 md:pb-16">
          <h1 className="text-[28px] leading-tight font-bold tracking-[-0.02em] md:text-[36px]">
            How the Compass Score works
          </h1>
          <p className="mt-3 text-[17px] text-text-2 md:text-lg">
            The Compass Score says how good a fund's record has been compared
            with other funds of the same kind, from 0 to 100. A score of 80
            reads as: on balance, a better record than about 80% of its peers.
          </p>

          <h2 className="mt-10 text-[22px] font-bold tracking-[-0.01em]">
            Compared with its own kind
          </h2>
          <p className="mt-2 text-[16px] text-text-2">
            A small cap fund is only compared with small cap funds, a large cap
            with large caps. For each kind we build our own average of the
            direct plans, priced day by day, and compare each fund with it over
            the same dates. So a rising or falling market never moves a score by
            itself; only doing better or worse than similar funds does.
          </p>

          <h2 className="mt-10 text-[22px] font-bold tracking-[-0.01em]">
            Four parts
          </h2>
          <dl className="mt-4 grid gap-5">
            {PARTS.map(([name, weight, text]) => (
              <div
                key={name}
                className="rounded-[18px] border border-border bg-surface p-5"
              >
                <dt className="font-bold">
                  {name}{" "}
                  <span className="font-normal text-text-3">· {weight}</span>
                </dt>
                <dd className="mt-1 text-text-2">{text}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-text-2">
            Each part is ranked within the category, then the four are weighted
            together. Nobody is forced to 100: the best fund sits just under it,
            and funds that tie share a place. A fund needs 3 years of prices
            before it gets a score; until then it shows as "too new to rate".
          </p>

          <h2 className="mt-10 text-[22px] font-bold tracking-[-0.01em]">
            What it can't tell you
          </h2>
          <p className="mt-2 text-[16px] text-text-2">
            It looks back. We tested whether any version of the score, or the
            score it replaced, could pick which funds would do best over the
            next 2 to 3 years. None could do better than chance, which matches
            research from around the world. A strong record is still worth
            knowing: it shows a fund has been run well against its peers,
            through good years and bad. It isn't a promise, and it isn't advice.
          </p>
          <p className="mt-3 text-text-2">
            It also doesn't see what the fund holds, changes of manager, or how
            much its portfolio overlaps with funds you already own.
          </p>

          <h2 className="mt-10 text-[22px] font-bold tracking-[-0.01em]">
            Data
          </h2>
          <p className="mt-2 text-[16px] text-text-2">
            Daily prices come from AMFI, the mutual fund industry body. Fund
            details such as cost, size and managers come from Kuvera. Prices
            update every weekday morning; scores are recalculated with them.
            Only direct, growth plans are covered.
          </p>

          <p className="mt-10">
            <Link href="/funds" className="font-semibold">
              Explore the rankings
            </Link>
          </p>
        </article>
      </Page>
    </>
  );
}
