"use client";

import React from "react";
import Link from "next/link";
import { TrendingUp, ShieldCheck, Award, Search, ShieldAlert } from "lucide-react";

export default function Home() {
  const triggerSearch = () => {
    window.dispatchEvent(new CustomEvent("mfc-open-search"));
  };

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden border-b border-border bg-card px-4 py-20 sm:px-6 lg:py-28">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05] pointer-events-none" 
             style={{ 
               backgroundImage: `radial-gradient(var(--foreground) 1px, transparent 1px)`, 
               backgroundSize: "24px 24px" 
             }} 
        />
        
        <div className="mx-auto max-w-6xl relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center px-4 sm:px-6">
          {/* Left Column: Text & CTAs */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
            {/* Logo */}
            <div className="mt-2">
              <img 
                src="/logo-96.png" 
                alt="MF Compass Logo" 
                width={64} 
                height={64} 
                className="h-16 w-16 object-contain"
              />
            </div>
            
            <h1 className="mt-6 font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl leading-[1.15]">
              Discover Indian Mutual Funds <br className="hidden sm:inline" />
              that <span className="text-primary">Truly Outperform</span>
            </h1>
            
            <p className="mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              MF Compass answers one question fast. We rank funds by relative outperformance over category averages (relative alpha) instead of absolute returns. Direct and growth plans only. Refreshed daily.
            </p>

            {/* Action CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full max-w-md">
              <Link
                href="/funds"
                className="w-full rounded-lg bg-primary px-8 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 text-center"
              >
                Explore Rankings
              </Link>
              
              <button
                onClick={triggerSearch}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-background/50 px-8 py-3 text-sm font-bold text-foreground transition-all hover:bg-accent"
              >
                <Search className="h-4 w-4" /> Search Funds
              </button>
            </div>
            
            <div className="mt-6 text-[10px] text-muted-foreground hidden lg:block">
              Press <kbd className="rounded border border-border bg-muted px-1 font-data">⌘K</kbd> or <kbd className="rounded border border-border bg-muted px-1 font-data">Ctrl+K</kbd> to search from anywhere
            </div>
          </div>

          {/* Right Column: Interactive Floating Card Mockup */}
          <div className="lg:col-span-5 flex justify-center w-full relative group">
            {/* Ambient Glow behind the card */}
            <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-primary/20 to-emerald-500/20 opacity-40 blur-xl transition duration-1000 group-hover:opacity-60" />
            
            {/* The Card Surface */}
            <div className="w-full max-w-md relative rounded-2xl border border-border/80 bg-card/70 backdrop-blur-xl p-6 shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:border-primary/40">
              
              {/* Header inside card */}
              <div className="flex items-center justify-between gap-4 border-b border-border/40 pb-4">
                <div className="text-left">
                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500 border border-emerald-500/20">
                    Flexi Cap Fund
                  </span>
                  <h3 className="mt-2 font-heading font-bold text-lg text-foreground tracking-tight">
                    Alpha Growth Direct-Growth
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Quantum Asset Management
                  </p>
                </div>
                
                {/* Total Score Badge */}
                <div className="flex flex-col items-center justify-center rounded-xl bg-primary/10 border border-primary/20 px-3.5 py-2.5">
                  <span className="text-2xl font-black text-primary font-mono tracking-tight">
                    96.4
                  </span>
                  <span className="text-[10px] font-bold text-primary/80 uppercase tracking-wider mt-0.5">
                    MF Score
                  </span>
                </div>
              </div>
              
              {/* Mid section: Metrics */}
              <div className="grid grid-cols-2 gap-4 py-4 text-left border-b border-border/40">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Relative 3Y Return
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-bold text-emerald-500 font-mono">
                      +8.45%
                    </span>
                    <span className="text-xs text-muted-foreground">vs avg</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Expense Ratio
                  </span>
                  <div className="mt-1">
                    <span className="text-xl font-bold text-foreground font-mono">
                      0.38%
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Total AUM
                  </span>
                  <div className="mt-1">
                    <span className="text-base font-bold text-foreground font-mono">
                      ₹4,820 Cr
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Consistency Rating
                  </span>
                  <div className="flex items-center gap-0.5 mt-1 text-emerald-500 text-sm">
                    ★ ★ ★ ★ ★
                  </div>
                </div>
              </div>
              
              {/* Footer: Sparkline / Trend */}
              <div className="flex items-center justify-between pt-4">
                <div className="text-left">
                  <span className="text-[10px] text-muted-foreground block">
                    Alpha Trend (5 Years)
                  </span>
                  <span className="text-xs font-bold text-emerald-500">
                    Consistent Outperformance
                  </span>
                </div>
                
                {/* SVG Sparkline */}
                <div className="w-24 h-8">
                  <svg viewBox="0 0 100 30" className="w-full h-full">
                    <defs>
                      <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,25 Q15,22 30,12 T60,15 T90,3 L100,2 L100,30 L0,30 Z"
                      fill="url(#gradient)"
                    />
                    <path
                      d="M0,25 Q15,22 30,12 T60,15 T90,3 L100,2"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Small floating badges around the card for depth */}
            <div className="absolute -top-4 -right-4 bg-background border border-border shadow-lg rounded-full px-3 py-1 flex items-center gap-1.5 text-[11px] font-bold text-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Rank #1 in Category
            </div>
            <div className="absolute -bottom-3 -left-4 bg-background border border-border shadow-lg rounded-full px-3 py-1 flex items-center gap-1 text-[11px] font-bold text-foreground">
              🛡️ Direct & Commission-Free
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="w-full border-b border-border bg-background py-10 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl grid grid-cols-1 gap-6 sm:grid-cols-3 text-center">
          <div className="border border-border/60 rounded-xl p-6 bg-card shadow-sm">
            <span className="font-heading font-extrabold text-3xl sm:text-4xl text-foreground font-data">
              310+
            </span>
            <p className="mt-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Open-Ended Funds Tracked
            </p>
          </div>
          <div className="border border-border/60 rounded-xl p-6 bg-card shadow-sm">
            <span className="font-heading font-extrabold text-3xl sm:text-4xl text-foreground font-data">
              9
            </span>
            <p className="mt-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Core Categories Ranks
            </p>
          </div>
          <div className="border border-border/60 rounded-xl p-6 bg-card shadow-sm">
            <span className="font-heading font-extrabold text-3xl sm:text-4xl text-primary font-data">
              Daily
            </span>
            <p className="mt-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              NAV & Outperformance Updates
            </p>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="w-full bg-card px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Engineered for Rational Investors
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-muted-foreground">
              We cut through marketing noise, stars ratings, and commission biases. Rankings are strictly performance-relative.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {/* Prop 1 */}
            <div className="flex flex-col items-start rounded-2xl border border-border bg-background p-6 transition-all hover:shadow-md duration-200">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-heading font-semibold text-base text-foreground">
                Relative Alpha Metrics
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Absolute returns are deceptive during bull or bear markets. We compare each fund's return against its category average across 1W, 1Y, 3Y, and 5Y to measure true alpha.
              </p>
            </div>

            {/* Prop 2 */}
            <div className="flex flex-col items-start rounded-2xl border border-border bg-background p-6 transition-all hover:shadow-md duration-200">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-heading font-semibold text-base text-foreground">
                100% Free & Anonymous
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                No accounts, no phone numbers, and no brokerage integrations. We don't sell mutual funds, so we have zero interest in pushing specific schemes.
              </p>
            </div>

            {/* Prop 3 */}
            <div className="flex flex-col items-start rounded-2xl border border-border bg-background p-6 transition-all hover:shadow-md duration-200">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-heading font-semibold text-base text-foreground">
                Direct & Growth Only
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Regular plans with commission loads are excluded. We show only Direct Growth plans to evaluate compounding potential cleanly.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
