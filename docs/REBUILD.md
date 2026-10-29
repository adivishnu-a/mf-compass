# MF Compass rebuild: plan and progress

Branch: `rebuild`. The live site stays on `main` until this ships.
Status: ✅ done · 🔄 in progress · ⏳ next · 💬 needs a decision · ⬜ not started

## Decisions so far

- Scrap and redesign the whole front end. Keep the database, sync scripts, API routes, search index, SEO metadata and security headers.
- Audience: ordinary Indian investors, first-timers to DIY researchers. Friendly to both.
- Laptop and phone (website and installed PWA) are both first-class, each with its own tailored layout.
- Light theme by default, dark as an option.
- Never "buy this": screening and explanation only, with a clear disclaimer (SEBI).
- No logins, alerts or portfolio tracking (cost and upkeep).
- Database writes (re-sync, new tables) only after Adi's OK.

## 1. Score correctness (bugs)

- ✅ Missing returns stored as `0.0000` and scored as a real 0% (young funds ranked on one year; empty funds ranked above established ones). Found in the DB: 28 one-year, 84 three-year, 129 five-year fake zeros
- ✅ The negative-return "penalty" multiplied wins over the category as well as losses
- ⏳ Re-sync so stored rows drop the fake zeros (`.env.local` is in place; run once the new score ships, so the live site never shows a half-fixed state)

## 2. NAV history

- ✅ ISIN → AMFI scheme code mapping: all 324 funds map (AMFI NAVAll.txt)
- ✅ Full NAV histories fetched and quality-checked (research cache): zero NAVs, duplicate dates, reverting spikes (Quant 2014–15), merger-truncated histories found and handled in `cleanSeries`
- ✅ Merger lineage: 11 funds joined to their pre-merger scheme, each verified by NAV continuity and Kuvera's since-launch return (±0.75 pp); 10 left on their own history (no verifiable predecessor). ⚠ Adi to eyeball: HDFC Small Cap ← "HDFC Focused Large-Cap" (passes both checks)
- ✅ `nav_history`, `fund_sources`, `category_index`, `fund_metrics` tables (migration 0001, applied; existing tables untouched)
- ✅ Backfilled: 628,021 NAVs for all 324 funds, 41 MB, 11 merger joins (same as research)
- ✅ Daily append (AMFI, one upsert, validated) and weekly backfill + 120-day reconcile wired into `daily.ts` / `weekly.ts`; idempotence checked live (second daily run wrote 0 rows). Design in `docs/DATA.md`
- ✅ Category index (equal-weight direct-plan "average fund") in `src/lib/metrics/series.ts`, tested

## 3. Compass Score (on NAV history)

- ✅ Method in `src/lib/metrics/compass.ts`; write-up in `docs/SCORE.md`
- ✅ Parts: returns (median rolling 3-year excess vs category), consistency (share of windows beating it), downside (downside capture + worst fall vs category), cost; shrinkage for short records; "too new to rate" under 3 years; mid-rank percentiles, nothing forced to 100
- ✅ Backtest and variant study (`scripts/research/evaluate.ts`): no method predicts future winners (ρ ≈ 0, as in global research), so the score is a fair track-record measure; chosen variant has the best agreement with analysts and Adi's priors (41.8 vs 32.5 today) and stability (0.99 vs 0.73)
- ✅ 61 edge-case tests (zeros, negatives, missing values, bad dates, spikes, gaps, ties, tiny categories, stale funds, no look-ahead)
- ✅ Adi approved the method
- ✅ `fund_metrics` filled from stored history (239 rated, 85 too new); matches the research run; scores computed as of the settled date
- ✅ Switch wired: daily and weekly jobs publish the Compass Score to `funds.total_score`; leaderboard sorts unrated last. Goes live when `rebuild` merges (the live old UI would put unrated funds on top)

## 4. Data fixes

- ✅ Peer table from our own direct-plan rows: "Closest rivals" and every ranking come from `fund_metrics` + our NAVs (Kuvera `comparison` no longer shown)
- ✅ Fields audited: star rating, raw tags and 1-day return dropped from the UI; all-caps fund houses title-cased; returns for fund and category computed from NAVs on the same dates (a fund younger than the period shows a dash, never a fake 0%)

## 5. Design direction

- ✅ Direction: calm fintech base, precision-instrument habits on laptop, playfulness only in the finder and small moments; Groww-level friendliness with our own identity
- ✅ Palette: tuned peacock #0A5878, leaf-green gains #1A7A35, loss #B83A32, marigold #F0A202 accent; dark theme peacock #6BC3E0 (studies on the canvas)
- ✅ Score marker: marigold bead ringed in peacock on a hairline in lists; bead among peer dots on the fund page and compare; words like "Best of 29" beside it. Part scores (returns, consistency, downside, cost) use filled progress bars
- ✅ Rules from review: custom dropdowns/listboxes everywhere (never the browser's native select); long values (fund managers) wrap one per line; solid moon for the theme toggle; motion = bead pop, bars grow, menus 180 ms, hover/press 150 ms, focus ring, reduced-motion fades
- ✅ Mocks on the canvas (https://claude.ai/artifact/3w3iAZHHsYpdmiwJkk2PNf): laptop rankings, fund page, home, compare; phone rankings, fund page (light and dark), home, compare, fund finder; logo
- ✅ Data check while mocking: category figures now from our direct-plan index (mid cap 1Y −1.3%, not Kuvera's −2.8%); category index stored daily so dated figures are exact
- ✅ Logo and icon set as files (`scripts/brand-icons.ts` renders them): `src/app/icon.svg`, `favicon.ico` (16/32/48), `apple-icon.png` 180, PWA 192/512 + maskable 512, theme colours, share images in the new brand (site and per fund, with the bead among peers)

## 6. Front end rebuild

- ✅ Old UI removed (39 files: pages, components, hooks, theme, format, styles, old icons)
- ✅ Tokens (light default, dark opt-in via `data-theme`), Anek Latin with tabular numbers, motion system with reduced-motion fallbacks (`src/app/globals.css`)
- ✅ Pages: home, explore (`/funds`), category rankings (`/funds/[slug]`), fund page, compare (`?funds=a,b`), saved, fund finder, method, 404, error, loading skeletons. Old links redirect (`/funds?category=…`, `/watchlist`)
- ✅ Features: plain-language verdict; part bars; bead among peers; growth of ₹100 vs category (1Y–since launch, crosshair on hover/touch/keys); SIP and one-time calculator on real NAVs with XIRR (custom "Starting" listbox + any month); worst fall and recovery; cost per ₹1 lakh; closest rivals; head-to-head compare (up to 4, leaders highlighted, "who leads on what", shared chart, ₹5,000 SIP row); guided finder (3 questions → kinds of fund + top funds); search (`/` or Ctrl/⌘K) with "add to compare" mode; saved funds and compare tray in this browser only
- ✅ Phone: bottom tab bar (Home, Explore, Compare, Saved) with safe areas, cards instead of the table, sticky compare header for two funds, full-screen search
- ⬜ Offline shell (service worker). Install works from the manifest; offline is deferred: a stale offline price page could mislead, so it needs care

### 6b. Second pass, built to the mocks one for one (Adi's review, 2026-10-29)

- ✅ Every page rebuilt against its board: sizes, spacing, radii, colours and copy taken from the mock's markup (laptop: home, rankings, fund, compare; phone: home, rankings, fund, compare, finder; dark tokens from PhoneFundDark)
- ✅ Root cause of "doesn't match": element styles sat outside Tailwind's layers and overrode utilities (e.g. every link turned peacock). Now in `@layer base`
- ✅ Search: real inputs in the header and home hero (as mocked) with a calm dropdown; no focus ring on text fields; full-screen search on phone; picker for Add a fund / Swap / Compare with another
- ✅ Rankings: sortable column headers (rows glide to new order), custom compare checkboxes, selectable preview rail with sliding bead and 5-year mini chart, "Too new to rate" footer, Show all; phone cards + sort sheet
- ✅ Fund page: score card with 4 part columns (laptop) / rows (phone), plain words, worst fall, details, SIP card with custom "Since" listbox (monthly or once), returns, closest rivals; phone top bar and Save / Compare bottom bar
- ✅ Compare: table with Add a fund column, "Who leads on what" in sentences, SIP spread; phone sticky cards with Swap and an add bar
- ✅ Motion: page transitions (React View Transitions: forward/back slides, fades, logo and name morph from list to fund page, active category pill glides); Motion library for listbox/dropdown/sheet/overlay enter-exit, sliding segmented pill and nav pill, gliding numbers, chart period glide, sort reordering, finder question slides, tray and badge springs, theme crossfade; reduced-motion fallbacks
- ✅ Slimmer crescent moon icon
- ⬜ Animations verified in code and DOM only: the in-app browser runs the tab as a background page, which pauses animations, so smoothness needs a look in a normal browser

### 6c. Third pass (Adi's review, 2026-10-29)

- [x] Score strip with peer dots only on the home hero and the fund page; removed from the rankings list, closest rivals and compare.
- [x] Rankings show every rated fund; "Too new to rate" is an animated fold-out list below.
- [x] Category icons (skyline for company size, mix for hybrids) on home, Explore and Learn tiles and rows.
- [x] One search per page: header field hidden on home (the hero is the search); laptop compare picker drops down from its button. Fixed the search list sticking on its loading placeholder.
- [x] Category pill morph carries its label (no flash); active pill scrolled into view on phone. Removed the category loading skeleton so the morph has a page to land on.
- [x] Category average line drawn solid (dashes crawled while the chart re-scaled).
- [x] SIP card: You put in / Return a year / Category as three figures.
- [x] Compare: "3 years, annualised"; worst fall ever with dates and recovery time; dropped the "link keeps the funds" note.
- [x] Moon tips rounded; "prices as of"; fairness rules removed from the method page; reading pages hide the compare tray.
- [x] New /learn page, linked from the bottom of home.
- [ ] Star ratings: Kuvera's `fund_rating` (1 to 5) has no named provider and some dates go back to 2017; `crisil_rating` is really the SEBI risk label (shown as Risk). Awaiting Adi's call.

## 7. System quality

- ✅ Caching: pages ISR 1 h (rankings prerendered, fund pages on first visit); data cached 1 h with tag `funds`; `/api/funds/lookup` (~30 KB) for search, tray and saved; fund series sent weekly + monthly (not daily)
- ✅ Images: AMC logos lazy with initials fallback; charts are inline SVG
- ✅ Accessibility: landmarks, skip link, labelled listboxes with full keyboard model, radio groups, meters for part bars, chart summary in words + keyboard crosshair, 44 px targets on phone, focus rings
- ✅ Tests: 86 passing (scoring, metrics, NAV sync, transforms, and new `tests/ui-libs.test.ts` for formatting, SIP/XIRR and plain-language lines). ⬜ e2e smoke still to add
- ✅ Error and empty states: no saved funds, nothing to compare, too new to rate, no price history yet, search no-match and failed load, page error with retry, not found
- ✅ Old JSON API routes (`/api/funds`, `/api/funds/[code]`, `by-codes`, `search`) removed: nothing used them; only `lookup` and `[code]/growth` remain

## 9. Backend cleanup (Adi, 2026-10-29)

- ✅ Old return-based score retired: `src/lib/scoring`, its tests, Kuvera category averages and the synthetic benchmark steps in the daily and weekly jobs, and `publishScores` (the copy into `funds.total_score` for the old UI)
- ✅ Kuvera fields nothing reads no longer fetched or stored; the jobs keep 3Y/5Y/since-launch returns only for verifying merger joins
- ✅ `fund_metrics` stops storing three in-between values (`windows`, shrunk `excess_return` and `consistency`); the site reads the raw ones
- ✅ Obsolete research scripts removed (design mock data, old-column inspector, backtest against the retired method); `lucide-react` dropped
- ✅ New AMC logos (Abakkus, AlphaGrep, Old Bridge, ASK, Monarch, Carnelian) and refreshed Aditya Birla Sun Life, Bajaj Finserv, Invesco, Union
- ⏳ Migration `0002_retire_old_score_and_unused_fields.sql`: run right after the merge deploys (the old site on main reads these columns), no backup (Adi's call). Frees about 0.5 MB.

## 8. Ship

- 🟨 Visual check on laptop and phone done in dev (home, rankings, fund, compare, finder, dark mode, phone overflow fixed); `/audit` next
- ⬜ PR from `rebuild` to `main`
