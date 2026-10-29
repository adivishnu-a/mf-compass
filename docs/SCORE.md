# Compass Score

How a fund's track record compares with the rest of its category, on a 0–100 scale. Code:
`src/lib/metrics/series.ts` (NAV primitives) and `src/lib/metrics/compass.ts` (score). Research scripts:
`scripts/research/`.

## What it is, and what it isn't

It measures how good a fund's record has been, fairly: against its own category, over many periods,
including how it behaved when markets fell. It does **not** predict which fund will win next. We tested
that directly (below): no method we tried, including the previous score, predicts the next 2–3 years
better than chance. That matches global evidence (S&P SPIVA persistence reports) and is why Morningstar
calls its ratings backward-looking. Copy on the site must never present the score as a forecast or advice.

## Inputs

- Daily NAVs per fund from AMFI scheme codes (via mfapi.in), cleaned:
  - drops zero, negative, missing, non-numeric and infinite NAVs and impossible dates;
  - one price per day (later row wins);
  - removes isolated one-day spikes over 15% that reverse by over 10% the next day (data errors);
  - joins verified pre-merger history (see Lineage).
- The category index: the category's direct-plan funds averaged with equal weight, step by step on days
  with at least 5 priced funds. Built by us, so it compares like with like (Kuvera's averages appear to
  include regular plans, which flatter every direct fund).
- Expense ratio from Kuvera.

## The four parts

All measured against the category index over the same dates, so a rising or falling market never moves
a score by itself.

| Part        | Weight | Measure                                                                                                                                                            |
| ----------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Returns     | 35%    | Median of rolling 3-year annualised return minus the category's, windows ending weekly over the last 3 years (≈ 6 years of history)                                |
| Consistency | 25%    | Share of those windows in which the fund beat the category (ties count half)                                                                                       |
| Downside    | 30%    | 60% downside capture (its average move in the category's falling months, as % of the category's) + 40% worst fall vs the category's worst fall over the same dates |
| Cost        | 10%    | Expense ratio (lower is better)                                                                                                                                    |

Each part becomes a mid-rank percentile among the category's rated funds: `(below + equal/2) / n`. The best
fund sits just under 100 and the worst just over 0; ties share a value; nobody is forced to 100. The score
is the weighted average of the parts a fund has. Returns and consistency are required; a missing downside
or cost part re-weights the rest rather than counting as zero.

Reads as: "on balance, better than this share of its peers".

## Fairness rules

- **Too new to rate**: under 3 years of history, or under 4 weekly 3-year windows. Shown as "too new to
  rate", never ranked.
- **Short records are shrunk, not punished**: median excess and consistency are pulled toward "same as
  the category" in proportion to how few windows there are (prior of 26 windows).
- **No recent prices** (over 14 days stale): not rated.
- **Tiny categories**: fewer than 5 rated funds, nobody in that category is scored.
- **No look-ahead**: everything is computed from data on or before the as-of date.

## Lineage (mergers)

AMFI issues a new scheme code when a fund house is taken over, so 22 funds' histories started years after
their real launch (HSBC after L&T, LIC after IDBI, Sundaram after Principal, Baroda BNP, Edelweiss after
JPMorgan…). A predecessor is joined only if both hold:

1. its last NAV continues into the fund's first NAV (within 10 days and 2%), and
2. the joined series reproduces Kuvera's since-launch return within 0.75 percentage points, starting
   within 60 days of the fund's real launch.

11 funds pass. The check rejected plausible-looking wrong matches (e.g. a JPMorgan Greater China fund
for Edelweiss Mid Cap, off by 4 pp). Funds without a verifiable predecessor are rated on their own history
(all have at least 4 years).

## Evidence (October 2026 data, 324 funds)

Variant study (`scripts/research/evaluate.ts`):

| Method                                | Agreement (good − weak funds, percentile points) | Stability 3 m | Stability 6 m | Predicts next 3 y (ρ) |
| ------------------------------------- | ------------------------------------------------ | ------------- | ------------- | --------------------- |
| Previous score (live)                 | 32.5                                             | 0.73          | 0.60          | 0.01                  |
| Previous score, bugs fixed            | 29.6                                             | 0.82          | 0.72          | 0.20                  |
| Compass, 5-year lookback              | 36.4                                             | 0.97          | 0.94          | 0.00                  |
| **Compass, 3-year lookback (chosen)** | **41.8**                                         | **0.99**      | **0.97**      | **0.06**              |

- Agreement uses a small check set: Adi's view of good mid and small caps, plus the analyst consensus found
  online (Value Research and other platform ratings, Morningstar India 2026 awards) for mid, small, large
  and flexi caps. It is a sanity check, not a target; varying weights and shrinkage moved it only 41–43.
- Prediction is noise for every method (about ±0.4 is meaningless at ~20 funds a category).

## Known limits

- Survivorship: the universe is today's funds, so closed or merged-away funds are missing from the
  category index. This affects every fund in a category roughly equally.
- 10 funds have shortened histories (no verifiable predecessor); their worst-fall window may miss 2020.
- Manager changes, portfolio overlap and holdings quality aren't in the data.
