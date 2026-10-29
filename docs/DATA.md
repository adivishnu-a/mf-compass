# Data pipeline

Two sources, four jobs, every write idempotent. Code: `scripts/sync/` (jobs), `src/lib/metrics/` (maths).

## Tables

| Table            | Rows                | What                                                                                                                                                 |
| ---------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `funds`          | ~324                | Kuvera fund details: names, house, category, cost, size, managers, SIP minimum, risk label; 3Y/5Y/since-launch returns (only to verify merger joins) |
| `fund_sources`   | 1 per fund          | AMFI scheme code, plus a verified pre-merger predecessor and its join scale                                                                          |
| `nav_history`    | ~630k, ~41 MB       | Daily NAV per fund. Primary key `(fund_id, nav_date)`, no surrogate id. Pre-merger days are stored already scaled onto the fund                      |
| `category_index` | ~3,400 per category | Daily points of each category's equal-weight direct-plan index (exact figures and charts)                                                            |
| `fund_metrics`   | 1 per fund          | Compass Score, its four parts and the numbers behind them, worst fall with dates                                                                     |

New tables come from `drizzle/migrations/0001_nav_history_and_metrics.sql`; `0002` retires the old score
(`category_averages`, `funds.total_score`) and Kuvera fields nothing reads. Each is applied with
`npm run db:apply -- <file>` (one transaction; 0001 refuses a half-applied state; both are no-ops when already applied).
The database was created with `drizzle-kit push`, so don't run `drizzle-kit migrate` (it would replay 0000).

## Jobs

| When                                    | Job               | Reads                                                | Writes                                                                                              |
| --------------------------------------- | ----------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Daily (Tue–Sat 11:00 IST, after Kuvera) | `appendDailyNavs` | 1 AMFI download (~2 MB, every scheme)                | 1 upsert of ~324 rows; a row whose NAV didn't change isn't rewritten                                |
| Daily                                   | `computeScores`   | `nav_history` per category (9 queries)               | 324 `fund_metrics` rows, the 9 daily category indexes (~30k rows, replaced in one transaction each) |
| Weekly (Sun 02:30 IST)                  | `backfillNavs`    | mfapi.in, only for funds with no history (new funds) | Their full history, then the `fund_sources` row                                                     |
| Weekly                                  | `reconcileNavs`   | mfapi.in full history per fund                       | Only days in the last 120 that are missing or differ                                                |

Manual: `npm run sync:navs -- backfill | daily | reconcile | compute`.

## Safety

- **Idempotent**: every NAV write is `INSERT … ON CONFLICT (fund_id, nav_date)`; re-running any job is harmless.
- **Validated before writing** (`scripts/sync/nav/validate.ts`): no zero, negative or non-numeric NAVs, no
  future dates, never older than what's stored, and a move over 25% in a day is held and logged; the
  weekly reconcile settles it from the second source.
- **Self-healing**: a missed daily run or a NAV AMFI corrected later is fixed by the weekly reconcile.
- **Resumable backfill**: NAV rows are written before the `fund_sources` row, so a fund whose backfill
  failed midway is picked up again next run.
- **Settled date**: scores are computed as of the latest day on which 90% of the category has a price, so
  a run during AMFI's evening update never compares funds with and without that day's NAV.
- **Failures are loud, not destructive**: a failed NAV step marks the Actions run failed (exit code 1) but
  never rolls back the Kuvera data written before it.
- **Deletes cascade**: a fund the weekly discovery drops takes its history, sources and metrics with it.
- **Merger joins** need two independent checks (NAV continuity and Kuvera's since-launch return); see
  `docs/SCORE.md`.

## Sources

- AMFI `NAVAll.txt` (official, free): latest NAV for every scheme, with ISINs.
- mfapi.in (free, no key): full daily history per AMFI scheme code; also the scheme list used to find
  pre-merger predecessors.
- Kuvera (existing): fund details, expense ratio, trailing returns, start dates.
