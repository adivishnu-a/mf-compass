import type { Metadata } from "next";
import Link from "next/link";
import { KindIcon } from "@/components/KindIcon";
import { Disclaimer, Page } from "@/components/Page";
import { BackButton } from "@/components/PhoneBar";
import { ScoreStrip } from "@/components/ScoreStrip";
import { SectionLink } from "./SectionLink";
import { CATEGORIES } from "@/lib/categories";
import { getBoard } from "@/lib/data";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Mutual funds, from zero",
  description:
    "What a mutual fund is, what NAV, SIP, returns, falls and cost mean, and how to read every number on MF Compass. Plain words, about 10 minutes.",
};

const SECTIONS = [
  ["what", "What a mutual fund is"],
  ["nav", "NAV: the price of one slice"],
  ["plans", "Direct plans and growth plans"],
  ["kinds", "Kinds of fund"],
  ["sip", "SIP or all at once"],
  ["returns", "Returns, and why years matter"],
  ["falls", "Falls, and coming back"],
  ["cost", "Cost"],
  ["peers", "Judging a fund against its peers"],
  ["before", "Before you invest"],
] as const;

const lakh = (n: number) => `₹${(n / 1e5).toFixed(n >= 1e6 ? 0 : 1)} lakh`;
const rupees = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/* ---------- Illustrations: worked arithmetic, never real fund data ---------- */

function Example({
  title,
  children,
  note,
}: {
  title: string;
  children: React.ReactNode;
  note: string;
}) {
  return (
    <figure className="my-6 rounded-[18px] border border-border bg-surface p-4 md:p-6">
      <figcaption className="mb-4 font-bold">{title}</figcaption>
      {children}
      <p className="mt-4 text-[13px] text-text-3">{note}</p>
    </figure>
  );
}

function NavExample() {
  const funds = [
    ["Fund A", 10, 11],
    ["Fund B", 500, 550],
  ] as const;
  return (
    <Example
      title="₹10,000 in two funds that both rise 10%"
      note="Made-up funds. Only the percentage change matters, not the price."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {funds.map(([name, from, to]) => (
          <div key={name} className="rounded-xl bg-surface-2 p-4">
            <p className="font-semibold">{name}</p>
            <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-[15px]">
              <dt className="text-text-3">NAV when you buy</dt>
              <dd className="text-right">₹{from}</dd>
              <dt className="text-text-3">Units you get</dt>
              <dd className="text-right">
                {(10000 / from).toLocaleString("en-IN")}
              </dd>
              <dt className="text-text-3">NAV a year later</dt>
              <dd className="text-right">₹{to}</dd>
              <dt className="font-semibold">Worth</dt>
              <dd className="text-right font-bold text-gain">
                {rupees((10000 / from) * to)}
              </dd>
            </dl>
          </div>
        ))}
      </div>
    </Example>
  );
}

function SipExample() {
  const prices = [20, 16, 12, 16, 20, 24];
  const units = prices.map((p) => 1000 / p);
  const total = units.reduce((a, b) => a + b, 0);
  const max = Math.max(...units);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  return (
    <Example
      title="₹1,000 every month while the price moves"
      note="Made-up prices. Averaging lowers what you pay per unit when prices swing; it doesn't stop you losing money if prices keep falling."
    >
      <table className="w-full border-collapse text-[15px]">
        <thead>
          <tr className="text-left text-[13px] text-text-3">
            <th className="pb-2 font-medium">Month</th>
            <th className="pb-2 text-right font-medium">Price of a unit</th>
            <th className="pb-2 pl-4 font-medium">Units ₹1,000 buys</th>
          </tr>
        </thead>
        <tbody>
          {prices.map((p, i) => (
            <tr key={i} className="border-t border-hairline">
              <td className="py-2">{months[i]}</td>
              <td className="py-2 text-right">₹{p}</td>
              <td className="py-2 pl-4">
                <span className="flex items-center gap-3">
                  <span
                    className="h-2 rounded bg-bar"
                    style={{ width: "100%", maxWidth: 160 }}
                  >
                    <span
                      className="mfc-fill block h-full rounded bg-brand"
                      style={{
                        width: `${(units[i] / max) * 100}%`,
                        animationDelay: `${i * 60}ms`,
                      }}
                    />
                  </span>
                  <span className="w-12 shrink-0 text-right tabular-nums">
                    {units[i].toFixed(1)}
                  </span>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 text-[15px]">
        You put in <strong>₹6,000</strong> and own{" "}
        <strong>{total.toFixed(0)} units</strong>. That's{" "}
        <strong>₹{(6000 / total).toFixed(2)}</strong> a unit on average, though
        the price averaged ₹
        {(prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2)}: the
        cheap months bought more. At June's price they're worth{" "}
        <strong>{rupees(total * prices.at(-1)!)}</strong>.
      </p>
    </Example>
  );
}

function CompoundExample() {
  const rows = [0, 5, 10, 20, 30].map(
    (y) => [y, 1e5 * Math.pow(1.12, y)] as const,
  );
  const max = rows.at(-1)![1];
  return (
    <Example
      title="₹1 lakh growing at 12% a year, left alone"
      note="A steady 12% every year, for the arithmetic. Real returns go up and down from year to year."
    >
      <div className="grid gap-2.5">
        {rows.map(([y, v], i) => (
          <div
            key={y}
            className="grid grid-cols-[88px_minmax(0,1fr)_92px] items-center gap-3 text-[15px]"
          >
            <span className="text-text-3">{y ? `${y} years` : "Today"}</span>
            <span className="h-3 rounded bg-bar">
              <span
                className="mfc-fill block h-full rounded bg-brand"
                style={{
                  width: `${Math.max((v / max) * 100, 1.5)}%`,
                  animationDelay: `${i * 80}ms`,
                }}
              />
            </span>
            <strong className="text-right tabular-nums">{lakh(v)}</strong>
          </div>
        ))}
      </div>
    </Example>
  );
}

/** A made-up price path: a climb, a 35% fall, the slow climb back. */
function FallExample() {
  const pts: [number, number][] = [];
  const at = (m: number) => {
    if (m <= 18) return 100 + (40 * m) / 18;
    if (m <= 24) return 140 - 49 * Math.sin((((m - 18) / 6) * Math.PI) / 2);
    if (m <= 38) return 91 + 49 * Math.sin((((m - 24) / 14) * Math.PI) / 2);
    return 140 + ((m - 38) * 15) / 10;
  };
  for (let m = 0; m <= 48; m += 0.5)
    pts.push([m, at(m) + (m > 0 && m < 48 ? Math.sin(m * 2.1) * 1.6 : 0)]);
  const W = 600;
  const H = 200;
  const x = (m: number) => (m / 48) * W;
  const y = (v: number) => H - ((v - 80) / (160 - 80)) * H;
  const d = pts
    .map(([m, v], i) => `${i ? "L" : "M"}${x(m).toFixed(1)} ${y(v).toFixed(1)}`)
    .join("");
  const pct = (m: number, v: number) => ({
    left: `${(x(m) / W) * 100}%`,
    top: `${(y(v) / H) * 100}%`,
  });
  return (
    <Example
      title="A fall of 35%, and the 14 months back"
      note="Made-up prices. On a fund's page, the real worst fall and its dates are shown."
    >
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full overflow-visible"
          aria-hidden="true"
        >
          <line
            x1={x(18)}
            x2={x(38)}
            y1={y(140)}
            y2={y(140)}
            stroke="var(--marigold)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
          <path
            d={d}
            fill="none"
            stroke="var(--brand)"
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          {[
            [18, 140],
            [24, 91],
            [38, 140],
          ].map(([m, v]) => (
            <circle
              key={m}
              cx={x(m)}
              cy={y(v)}
              r={5}
              fill="var(--marigold)"
              stroke="var(--surface)"
              strokeWidth={2}
            />
          ))}
        </svg>
        <span
          className="absolute -translate-x-1/2 -translate-y-[calc(100%+10px)] text-[13px] font-semibold whitespace-nowrap"
          style={pct(18, 140)}
        >
          Old high
        </span>
        <span
          className="absolute -translate-x-1/2 translate-y-3 text-[13px] font-semibold whitespace-nowrap text-loss"
          style={pct(24, 91)}
        >
          Worst fall: −35%
        </span>
        <span
          className="absolute translate-x-2 translate-y-2 text-[13px] font-semibold whitespace-nowrap"
          style={pct(38, 140)}
        >
          Back, 14 months on
        </span>
      </div>
    </Example>
  );
}

function CostExample() {
  const cheap = 1e5 * Math.pow(1 + 0.12 - 0.005, 20);
  const dear = 1e5 * Math.pow(1 + 0.12 - 0.015, 20);
  return (
    <Example
      title="₹1 lakh for 20 years, the same 12% before costs"
      note="Made-up funds with identical returns before costs. Costs come out of the fund every day, so you never see a bill."
    >
      <div className="grid grid-cols-2 gap-3">
        {(
          [
            ["Costs 0.5% a year", cheap],
            ["Costs 1.5% a year", dear],
          ] as const
        ).map(([k, v]) => (
          <div key={k} className="rounded-xl bg-surface-2 p-4">
            <p className="text-[13px] text-text-3">{k}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{lakh(v)}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[15px]">
        One percentage point a year adds up to{" "}
        <strong>{lakh(cheap - dear)}</strong> less after 20 years.
      </p>
    </Example>
  );
}

/* ---------- Page ---------- */

const H2 = ({ id, children }: { id: string; children: React.ReactNode }) => (
  <h2
    id={id}
    className="mt-14 scroll-mt-6 text-[24px] leading-tight font-bold tracking-[-0.015em] first:mt-0 md:text-[28px]"
  >
    {children}
  </h2>
);
const P = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-3 text-text-2">{children}</p>
);
const Analogy = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-4 rounded-[14px] bg-brand-soft px-4 py-3.5 text-ink">
    {children}
  </p>
);

export default async function LearnPage() {
  const mid = await getBoard("Mid Cap Fund");
  const scores =
    mid?.funds.flatMap((f) => (f.score === null ? [] : [f.score])) ?? [];
  const top = scores[0];

  return (
    <>
      <header className="flex items-center px-2 pt-[calc(8px+env(safe-area-inset-top))] md:hidden">
        <BackButton fallback="/" label="Back" />
      </header>
      <Page className="mx-auto max-w-[1080px] px-4 pt-2 pb-14 md:px-8 md:pt-12 md:pb-20">
        <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-14">
          <nav aria-label="On this page" className="hidden lg:block">
            <div className="sticky top-8">
              <p className="text-[13px] font-semibold text-text-3">
                On this page
              </p>
              <ol className="mt-2 grid gap-1 text-sm">
                {SECTIONS.map(([id, title]) => (
                  <li key={id}>
                    <SectionLink
                      id={id}
                      className="block rounded-md py-1 text-text-2 hover:text-ink"
                    >
                      {title}
                    </SectionLink>
                  </li>
                ))}
              </ol>
            </div>
          </nav>

          <article className="max-w-[680px] text-[17px] leading-[1.65]">
            <h1 className="text-[32px] leading-[1.1] font-bold tracking-[-0.02em] md:text-[40px]">
              Mutual funds, from zero
            </h1>
            <p className="mt-4 text-lg text-text-2">
              Everything you need to read this site with confidence, in plain
              words. No prior knowledge needed; about 10 minutes.
            </p>

            <div className="mt-12">
              <H2 id="what">What a mutual fund is</H2>
              <P>
                Buying shares of good companies one by one takes money, time and
                know-how. A mutual fund does it for you. Many people put money
                into one shared pot, and a professional, the{" "}
                <strong className="text-ink">fund manager</strong>, uses that
                pot to buy a spread of investments: shares of companies, bonds,
                sometimes gold.
              </P>
              <Analogy>
                Think of friends pooling money to buy a big box of fruit at
                wholesale prices. Each friend owns a share of the box in
                proportion to what they put in. If the fruit becomes more
                valuable, everyone's share is worth more.
              </Analogy>
              <P>
                Your share of the pot is counted in{" "}
                <strong className="text-ink">units</strong>. Owning a share of a
                company means owning a tiny piece of that business; a bond means
                lending money and being paid interest. A fund that holds 50
                companies spreads your money so one company's bad year hurts
                less. Every fund is regulated by SEBI, and your money is held by
                a separate custodian, not by the fund manager.
              </P>

              <H2 id="nav">NAV: the price of one slice</H2>
              <P>
                The <strong className="text-ink">NAV</strong> (net asset value)
                is the price of one unit. After the market closes each working
                day, the fund adds up what everything it owns is worth, takes
                off its costs, and divides by the number of units. If the pot is
                worth ₹100 crore and there are 5 crore units, the NAV is ₹20.
              </P>
              <P>
                A low NAV doesn't make a fund cheap, and a high one doesn't make
                it expensive. What matters is how much the NAV changes.
              </P>
              <NavExample />

              <H2 id="plans">Direct plans and growth plans</H2>
              <P>
                Every fund comes in two versions with the same manager and the
                same investments. A{" "}
                <strong className="text-ink">regular plan</strong> pays a
                commission to whoever sold it to you, taken out of your money
                every year. A <strong className="text-ink">direct plan</strong>{" "}
                pays none, so it costs less and grows a little faster.
              </P>
              <P>
                Funds also choose what to do with profits. A{" "}
                <strong className="text-ink">growth</strong> plan keeps them
                invested, so they grow too. An IDCW plan pays some out now and
                then. This site covers only direct, growth plans: the cleanest
                way to compare funds.
              </P>

              <H2 id="kinds">Kinds of fund</H2>
              <P>
                SEBI groups funds by what they're allowed to buy. Company size
                is the big one. Large caps are India's 100 biggest companies by
                market value, mid caps are the next 150, and small caps are
                everything after that. Bigger companies tend to be steadier;
                smaller ones can grow faster but swing harder.
              </P>
              <ul className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                {CATEGORIES.map((c) => (
                  <li key={c.slug} className="flex gap-3">
                    <KindIcon
                      slug={c.slug}
                      size={36}
                      className="mt-0.5 shrink-0"
                    />
                    <span className="leading-snug">
                      <Link
                        href={`/funds/${c.slug}`}
                        transitionTypes={["nav-forward"]}
                        className="font-semibold"
                      >
                        {c.label}
                      </Link>
                      <span className="block text-[15px] text-text-2">
                        {c.line}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <P>
                Hybrid funds mix shares with bonds (loans that pay interest) or
                gold, which usually fall less than shares when markets drop. We
                only ever compare a fund with others of its own kind.
              </P>

              <H2 id="sip">SIP or all at once</H2>
              <P>
                You can put in a lump sum once, or start a{" "}
                <strong className="text-ink">SIP</strong> (systematic investment
                plan): a fixed amount taken from your bank account every month,
                often from ₹500 or ₹1,000. A SIP builds the habit and removes
                the worry of picking the right day, because you buy every month,
                at high prices and low ones.
              </P>
              <SipExample />

              <H2 id="returns">Returns, and why years matter</H2>
              <P>
                Returns on this site are given{" "}
                <strong className="text-ink">a year</strong> (annualised).
                &ldquo;12% a year over 5 years&rdquo; means the fund grew as
                much as if it had earned 12% every single year, even though some
                years were up 30% and others down 10%.
              </P>
              <P>
                Money left invested earns returns on its earlier returns too.
                That's <strong className="text-ink">compounding</strong>, and
                it's why time matters more than timing.
              </P>
              <CompoundExample />

              <H2 id="falls">Falls, and coming back</H2>
              <P>
                Funds that hold shares fall when markets fall, sometimes by a
                third or more. The{" "}
                <strong className="text-ink">worst fall</strong> is the biggest
                drop from a high point to the low that followed. It tells you
                what living with the fund has felt like, and how long it took to
                climb back.
              </P>
              <Analogy>
                When the tide goes out, every boat in the harbour drops with it.
                A market fall works the same way: nearly every fund of a kind
                falls together. The useful question is which ones fell less, and
                how quickly they came back.
              </Analogy>
              <FallExample />
              <P>
                If you might need the money within a few years, a big fall at
                the wrong moment can force you to sell low. Money for the next
                year or two belongs somewhere steadier than a share fund.
              </P>

              <H2 id="cost">Cost</H2>
              <P>
                Every fund charges a yearly fee, the{" "}
                <strong className="text-ink">expense ratio</strong>, taken out
                of the fund bit by bit every day. It looks small, a fraction of
                a percent, but it comes off every year whether the fund does
                well or not.
              </P>
              <CostExample />

              <H2 id="peers">Judging a fund against its peers</H2>
              <P>
                &ldquo;Up 20% this year&rdquo; says little on its own: in a
                great year for mid caps, nearly every mid cap fund was up. The
                fair question is how a fund did compared with others of the same
                kind, over the same dates, through good years and bad. That's
                what the <strong className="text-ink">Compass Score</strong>{" "}
                answers, from 0 to 100, built from four things:
              </P>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                {(
                  [
                    [
                      "Returns vs peers",
                      "How far ahead of the average fund of its kind, a year.",
                    ],
                    [
                      "Consistency",
                      "How often it was ahead, so one lucky year can't carry it.",
                    ],
                    [
                      "Downside protection",
                      "How much less it fell when markets fell.",
                    ],
                    ["Cost", "What it charges you every year."],
                  ] as const
                ).map(([k, v]) => (
                  <div
                    key={k}
                    className="rounded-[14px] border border-border bg-surface p-4"
                  >
                    <dt className="font-semibold">{k}</dt>
                    <dd className="mt-0.5 text-[15px] text-text-2">{v}</dd>
                  </div>
                ))}
              </dl>
              {mid && top !== undefined && (
                <figure className="my-6 rounded-[18px] border border-border bg-surface p-4 md:p-6">
                  <figcaption className="mb-1 font-bold">
                    Today&rsquo;s {scores.length} rated mid cap funds
                  </figcaption>
                  <p className="text-[15px] text-text-2">
                    Each grey dot is a fund. The bead is the best record of the
                    group, {mid.funds[0].name}, at {top.toFixed(1)}.
                  </p>
                  <ScoreStrip
                    score={top}
                    peers={scores.slice(1)}
                    size="lg"
                    className="mx-2.5 mt-4"
                    label={`${scores.length} mid cap funds by Compass Score; the best is ${top.toFixed(1)}.`}
                  />
                  <div className="flex justify-between text-[13px] text-text-3">
                    <span>Weakest record</span>
                    <span>Strongest</span>
                  </div>
                </figure>
              )}
              <P>
                A score looks back. It shows how well a fund has been run
                against its peers, not what it will do next, and it&rsquo;s not
                a recommendation. Funds younger than 3 years show as &ldquo;too
                new to rate&rdquo;.{" "}
                <Link
                  href="/method"
                  transitionTypes={["nav-forward"]}
                  className="font-semibold"
                >
                  How the score works in detail
                </Link>
              </P>

              <H2 id="before">Before you invest</H2>
              <ul className="mt-4 grid list-disc gap-2.5 ps-5 text-text-2 marker:text-brand">
                <li>
                  <strong className="text-ink">
                    Know what the money is for, and when you&rsquo;ll need it.
                  </strong>{" "}
                  Share funds suit goals at least 5 years away; the further off,
                  the more ups and downs you can sit through.
                </li>
                <li>
                  <strong className="text-ink">
                    Keep an emergency fund first.
                  </strong>{" "}
                  A few months of expenses somewhere you can reach quickly, so
                  you&rsquo;re never forced to sell in a fall.
                </li>
                <li>
                  <strong className="text-ink">
                    Check the risk level and any lock-in.
                  </strong>{" "}
                  Every fund carries SEBI&rsquo;s risk label, from Low to Very
                  high. Tax-saving (ELSS) funds lock your money in for 3 years.
                </li>
                <li>
                  <strong className="text-ink">
                    Don&rsquo;t chase last year&rsquo;s winner.
                  </strong>{" "}
                  Look for a record that held up against its peers over many
                  years, at a fair cost.
                </li>
                <li>
                  <strong className="text-ink">
                    Start small and stay steady.
                  </strong>{" "}
                  A modest SIP you keep going beats a large one you stop in the
                  first bad year.
                </li>
              </ul>
              <P>
                To invest, you complete a one-time KYC (identity check) with a
                SEBI-registered platform or the fund house itself, then choose
                the direct plan of the fund you want.
              </P>

              <div className="mt-12 flex flex-wrap gap-3">
                <Link
                  href="/funds"
                  transitionTypes={["nav-forward"]}
                  className="press grid h-12 place-items-center rounded-xl bg-brand px-6 text-base font-semibold text-on-brand hover:bg-brand-hover hover:text-on-brand"
                >
                  Explore funds by kind
                </Link>
                <Link
                  href="/finder"
                  transitionTypes={["nav-forward"]}
                  className="grid h-12 place-items-center rounded-xl border border-border-strong bg-surface px-6 text-base font-semibold text-ink hover:border-border-hover hover:text-ink"
                >
                  Answer 3 questions
                </Link>
              </div>
              <Disclaimer className="mt-10">
                For learning only, not investment advice. MF Compass is not a
                SEBI-registered adviser. Mutual fund investments are subject to
                market risks; read all scheme-related documents carefully.
              </Disclaimer>
            </div>
          </article>
        </div>
      </Page>
    </>
  );
}
