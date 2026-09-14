import React from "react";
import Link from "next/link";
import { TrendingUp, ShieldCheck, Award } from "lucide-react";
import { SearchButton } from "@/components/home/SearchButton";

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden border-b border-border bg-card px-4 py-20 sm:px-6 lg:py-28">
        {/* Subtle grid pattern background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
          style={{
            backgroundImage: `radial-gradient(var(--foreground) 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-12">
          {/* Left Column: Text & CTAs */}
          <div className="flex flex-col items-center text-center lg:col-span-7 lg:items-start lg:text-left">
            <h1 className="mt-2 font-heading text-4xl leading-[1.15] font-extrabold tracking-tight text-foreground sm:text-6xl">
              Discover Indian Mutual Funds <br className="hidden sm:inline" />
              that <span className="text-primary">Truly Outperform</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              MF Compass answers one question fast. We rank funds by relative
              outperformance over category averages (relative alpha) instead of
              absolute returns. Direct and growth plans only. Refreshed daily.
            </p>

            {/* Action CTAs */}
            <div className="mt-10 flex w-full max-w-md flex-col items-center gap-4 sm:flex-row">
              <Link
                href="/funds"
                className="w-full rounded-lg bg-primary px-8 py-3 text-center text-sm font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
              >
                Explore Rankings
              </Link>

              <SearchButton />
            </div>

            <div className="mt-6 hidden text-[10px] text-muted-foreground lg:block">
              Press{" "}
              <kbd className="font-data rounded border border-border bg-muted px-1">
                ⌘K
              </kbd>{" "}
              or{" "}
              <kbd className="font-data rounded border border-border bg-muted px-1">
                Ctrl+K
              </kbd>{" "}
              to search from anywhere
            </div>
          </div>

          {/* Right Column: Interactive Floating Card Mockup */}
          <div className="group relative flex w-full justify-center lg:col-span-5">
            {/* The Card Surface */}
            <div className="relative w-full max-w-md rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:border-primary/40">
              {/* Header inside card */}
              <div className="flex items-center justify-between gap-4 border-b border-border/40 pb-4">
                <div className="text-left">
                  <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500">
                    Flexi Cap Fund
                  </span>
                  <p className="mt-2 font-heading text-lg font-bold tracking-tight text-foreground">
                    Alpha Growth Direct-Growth
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Alpha Asset Management
                  </p>
                </div>

                {/* Total Score Badge */}
                <div className="flex flex-col items-center justify-center rounded-xl border border-primary/20 bg-primary/10 px-3.5 py-2.5">
                  <span className="font-mono text-2xl font-black tracking-tight text-primary">
                    96.4
                  </span>
                  <span className="mt-0.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    MF Score
                  </span>
                </div>
              </div>

              {/* Mid section: Metrics */}
              <div className="grid grid-cols-2 gap-4 border-b border-border/40 py-4 text-left">
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    Relative 3Y Return
                  </span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="font-mono text-xl font-bold text-emerald-500">
                      +8.45%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      vs avg
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    Expense Ratio
                  </span>
                  <div className="mt-1">
                    <span className="font-mono text-xl font-bold text-foreground">
                      0.38%
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    Total AUM
                  </span>
                  <div className="mt-1">
                    <span className="font-mono text-base font-bold text-foreground">
                      ₹4,820 Cr
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    Consistency Rating
                  </span>
                  <div className="mt-1 flex items-center gap-0.5 text-sm text-emerald-500">
                    ★ ★ ★ ★ ★
                  </div>
                </div>
              </div>

              {/* Footer: Monospaced Performance Matrix */}
              <div className="flex items-center justify-between pt-4">
                <div className="text-left">
                  <span className="block text-[10px] text-muted-foreground">
                    Relative Alpha
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    Peer outperformance matrix
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="font-data inline-flex items-center rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                    1Y: +12.4%
                  </span>
                  <span className="font-data inline-flex items-center rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                    5Y: +8.9%
                  </span>
                </div>
              </div>
            </div>

            <span className="absolute right-2 -bottom-9 text-[10px] text-muted-foreground">
              Illustrative example, not a real fund
            </span>

            {/* Small floating badges around the card for depth */}
            <div className="absolute -top-4 -right-4 flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-[11px] font-bold text-foreground shadow-lg">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Rank #1 in Category
            </div>
            <div className="absolute -bottom-3 -left-4 flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-[11px] font-bold text-foreground shadow-lg">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Direct &
              Commission-Free
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="w-full border-b border-border bg-background px-4 py-10 sm:px-6">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 text-center sm:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
            <span className="font-data font-heading text-3xl font-extrabold text-foreground sm:text-4xl">
              310+
            </span>
            <p className="mt-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Open-Ended Funds Tracked
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
            <span className="font-data font-heading text-3xl font-extrabold text-foreground sm:text-4xl">
              9
            </span>
            <p className="mt-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Core Categories Ranks
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
            <span className="font-data font-heading text-3xl font-extrabold text-primary sm:text-4xl">
              Daily
            </span>
            <p className="mt-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              NAV & Outperformance Updates
            </p>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="w-full bg-card px-4 pt-16 pb-8 sm:px-6 lg:pt-24 lg:pb-12">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Engineered for Rational Investors
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
              We cut through marketing noise, stars ratings, and commission
              biases. Rankings are strictly performance-relative.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Prop 1 */}
            <div className="flex flex-col items-start rounded-2xl border border-border bg-background p-6 transition-all duration-200 hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-heading text-base font-semibold text-foreground">
                Relative Alpha Metrics
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Absolute returns are deceptive during bull or bear markets. We
                compare each fund's return against its category average across
                1W, 1Y, 3Y, and 5Y to measure true alpha.
              </p>
            </div>

            {/* Prop 2 */}
            <div className="flex flex-col items-start rounded-2xl border border-border bg-background p-6 transition-all duration-200 hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-heading text-base font-semibold text-foreground">
                100% Free & Anonymous
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                No accounts, no phone numbers, and no brokerage integrations. We
                don't sell mutual funds, so we have zero interest in pushing
                specific schemes.
              </p>
            </div>

            {/* Prop 3 */}
            <div className="flex flex-col items-start rounded-2xl border border-border bg-background p-6 transition-all duration-200 hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-heading text-base font-semibold text-foreground">
                Direct & Growth Only
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Regular plans with commission loads are excluded. We show only
                Direct Growth plans to evaluate compounding potential cleanly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="w-full bg-background px-4 py-8 sm:px-6 lg:py-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-6 rounded-xl border border-primary/10 bg-[#0050b3] px-8 py-10 sm:px-12 sm:py-12 md:flex-row">
            <div className="text-center md:text-left">
              <h2 className="font-heading text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Ready to optimize your portfolio?
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/90 sm:text-base">
                Explore the complete outperformance database and compare funds
                with institutional-grade relative metrics. 100% free.
              </p>
            </div>

            <div className="flex w-full flex-shrink-0 justify-center md:w-auto">
              <Link
                href="/funds"
                className="inline-flex w-full items-center justify-center rounded-lg bg-white px-8 py-3.5 text-sm font-extrabold text-[#0050b3] shadow-sm transition-all hover:bg-white/90 active:scale-[0.98] md:w-auto"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
