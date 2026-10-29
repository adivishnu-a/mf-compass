/**
 * NAV history and Compass Score jobs. Every write is an idempotent upsert keyed on (fund, date), so any
 * job can be re-run or resumed after a failure without duplicating or losing data.
 *
 *   backfillNavs     funds without history: map ISIN -> AMFI code, join verified pre-merger history,
 *                    insert everything (one-time per fund; resumable)
 *   appendDailyNavs  one AMFI download, one multi-row upsert of each fund's latest NAV (~324 rows),
 *                    validated against the newest stored NAV; unchanged rows are not rewritten
 *   reconcileNavs    weekly: full history from mfapi.in, writes only days that are missing or differ in
 *                    the last N days (heals missed runs and NAVs that AMFI corrected later)
 *   computeScores    weekly: category indexes, metrics and Compass Scores from stored history
 */
import { and, eq, sql } from "drizzle-orm";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "@drizzle/schema";
import {
  funds,
  fundSources,
  navHistory,
  fundMetrics,
  categoryIndexPoints,
} from "@drizzle/schema";
import {
  type Point,
  DAY_MS,
  cleanSeries,
  categoryIndex,
  maxDrawdown,
  settledDate,
} from "@/lib/metrics/series";
import {
  fundMetrics as metricsFor,
  compassScores,
} from "@/lib/metrics/compass";
import { FUND_CATEGORIES } from "@/lib/kuvera/categories";
import { logger } from "@scripts/sync/shared/logger";
import { fetchNavAll, parseNavAll, type AmfiNav } from "./amfi";
import { checkDailyNav } from "./validate";
import { isTruncated, predecessorCandidates, verifyJoin } from "./lineage";

type Db = NeonHttpDatabase<typeof schema>;

const MFAPI = "https://api.mfapi.in/mf";
const INSERT_CHUNK = 4000; // 3 params a row stays well under Postgres' 65,535-parameter limit
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
const day = (s: string) => Date.parse(s + "T00:00:00Z");

async function fetchJson<T>(url: string, tries = 4): Promise<T | null> {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (res.ok) return (await res.json()) as T;
      if (res.status === 404) return null;
    } catch {}
    await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
  }
  return null;
}

/** A scheme's full history from mfapi.in, cleaned (src/lib/metrics/series.ts). null when unavailable. */
async function mfapiSeries(code: string): Promise<Point[] | null> {
  const j = await fetchJson<{ data?: { date: string; nav: string }[] }>(
    `${MFAPI}/${code}`,
  );
  if (!j?.data) return null;
  const { series, report } = cleanSeries(j.data);
  if (report.dropped || report.spikes)
    logger.info("Cleaned NAV series", { code, ...report });
  return series;
}

/** Run tasks with a fixed number in flight, so we stay polite to the free APIs. */
async function pool<T>(
  items: T[],
  size: number,
  fn: (item: T) => Promise<void>,
) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: size }, async () => {
      for (let item = queue.shift(); item !== undefined; item = queue.shift())
        await fn(item);
    }),
  );
}

async function upsertNavs(
  db: Db,
  rows: { fundId: number; navDate: string; nav: string }[],
  overwrite: boolean,
) {
  for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
    const chunk = rows.slice(i, i + INSERT_CHUNK);
    const q = db.insert(navHistory).values(chunk);
    await (overwrite
      ? q.onConflictDoUpdate({
          target: [navHistory.fundId, navHistory.navDate],
          set: { nav: sql`excluded.nav` },
          setWhere: sql`${navHistory.nav} <> excluded.nav`,
        })
      : q.onConflictDoNothing());
  }
}

const toRows = (fundId: number, s: readonly Point[]) =>
  s.map((p) => ({ fundId, navDate: iso(p.t), nav: p.v.toFixed(6) }));

/** Funds with no fund_sources row yet, or a source but no stored history (an earlier run failed midway). */
export async function backfillNavs(db: Db, concurrency = 4) {
  const pending = (
    await db.execute(sql`
    select f.id, f.isin, f.scheme_name, f.short_name, f.start_date::text as start_date,
           f.returns_date::text as returns_date, f.returns_inception, f.returns_3y, f.returns_5y,
           s.amfi_code, s.predecessor_amfi_code, s.predecessor_scale
    from funds f
    left join fund_sources s on s.fund_id = f.id
    where s.fund_id is null or not exists (select 1 from nav_history n where n.fund_id = f.id)
  `)
  ).rows as Record<string, string | null>[];
  if (pending.length === 0)
    return { backfilled: 0, unmapped: 0, joined: 0, failed: 0 };

  const isinMap = parseNavAll(await fetchNavAll());
  let mfList: { schemeCode: number; schemeName: string }[] | null = null;
  const summary = { backfilled: 0, unmapped: 0, joined: 0, failed: 0 };

  await pool(pending, concurrency, async (f) => {
    const fundId = Number(f.id);
    const code =
      f.amfi_code ?? (f.isin ? isinMap.get(f.isin)?.code : undefined);
    if (!code) {
      summary.unmapped++;
      logger.warn("No AMFI scheme for ISIN", {
        fund: f.short_name,
        isin: f.isin,
      });
      return;
    }
    const own = await mfapiSeries(code);
    if (!own || own.length === 0) {
      summary.failed++;
      logger.warn("No NAV history", { fund: f.short_name, code });
      return;
    }
    let series = own;
    let predecessor: { code: string; scale: number } | null = null;

    if (f.predecessor_amfi_code && f.predecessor_scale) {
      // known lineage (a re-run after a failed insert): join exactly as verified before
      const pred = await mfapiSeries(f.predecessor_amfi_code);
      if (pred) {
        const scale = Number(f.predecessor_scale);
        series = [
          ...pred
            .filter((p) => p.t < own[0].t)
            .map((p) => ({ t: p.t, v: p.v * scale })),
          ...own,
        ];
        predecessor = { code: f.predecessor_amfi_code, scale };
      }
    } else if (
      !f.amfi_code &&
      f.start_date &&
      isTruncated(own, f.start_date) &&
      f.returns_date
    ) {
      // first time we see this fund and its history starts late: look for a verifiable predecessor once
      mfList ??=
        (await fetchJson<{ schemeCode: number; schemeName: string }[]>(
          MFAPI,
        )) ?? [];
      const facts = {
        launch: f.start_date,
        asOf: f.returns_date,
        inception:
          f.returns_inception === null ? null : Number(f.returns_inception),
        r3y:
          f.returns_3y === null || Number(f.returns_3y) === 0
            ? null
            : Number(f.returns_3y),
        r5y:
          f.returns_5y === null || Number(f.returns_5y) === 0
            ? null
            : Number(f.returns_5y),
      };
      for (const candidate of predecessorCandidates(
        f.scheme_name ?? "",
        f.short_name ?? "",
        code,
        mfList,
      )) {
        const pred = await mfapiSeries(candidate);
        if (!pred) continue;
        const r = verifyJoin(own, pred, facts);
        if (r.ok) {
          series = r.joined!;
          predecessor = { code: candidate, scale: r.scale! };
          summary.joined++;
          logger.info("Joined pre-merger history", {
            fund: f.short_name,
            predecessor: candidate,
          });
          break;
        }
      }
    }

    // nav rows first, then the source row: a failure in between leaves the fund "pending" for the next run
    await upsertNavs(db, toRows(fundId, series), false);
    await db
      .insert(fundSources)
      .values({
        fundId,
        amfiCode: code,
        predecessorAmfiCode: predecessor?.code ?? null,
        predecessorScale: predecessor ? predecessor.scale.toFixed(12) : null,
        joinedOn: predecessor ? iso(own[0].t) : null,
      })
      .onConflictDoUpdate({
        target: fundSources.fundId,
        set: { amfiCode: code, verifiedAt: sql`now()` },
      });
    summary.backfilled++;
  });
  logger.info("NAV backfill complete", summary);
  return summary;
}

/** Each fund's newest stored NAV. */
async function latestNavs(db: Db) {
  const rows = (
    await db.execute(sql`
    select distinct on (fund_id) fund_id, nav_date::text as nav_date, nav
    from nav_history order by fund_id, nav_date desc
  `)
  ).rows as { fund_id: number; nav_date: string; nav: string }[];
  return new Map(
    rows.map((r) => [
      Number(r.fund_id),
      { date: r.nav_date, nav: Number(r.nav) },
    ]),
  );
}

/** Daily: one AMFI download, one upsert. Returns counts; refusals are logged, never thrown. */
export async function appendDailyNavs(db: Db, today = iso(Date.now())) {
  const sources = await db
    .select({
      fundId: fundSources.fundId,
      amfiCode: fundSources.amfiCode,
      isin: funds.isin,
      name: funds.shortName,
    })
    .from(fundSources)
    .innerJoin(funds, eq(funds.id, fundSources.fundId));
  const byIsin = parseNavAll(await fetchNavAll());
  const byCode = new Map<string, AmfiNav>();
  for (const v of byIsin.values()) byCode.set(v.code, v);
  const latest = await latestNavs(db);

  const rows: { fundId: number; navDate: string; nav: string }[] = [];
  const held: string[] = [];
  let missing = 0;
  for (const s of sources) {
    const next =
      byCode.get(s.amfiCode) ?? (s.isin ? byIsin.get(s.isin) : undefined);
    if (!next) {
      missing++;
      continue;
    }
    const check = checkDailyNav(latest.get(s.fundId) ?? null, next, today);
    if (check.ok)
      rows.push({
        fundId: s.fundId,
        navDate: next.date,
        nav: next.nav.toFixed(6),
      });
    else if (
      check.reason !== "Unchanged" &&
      check.reason !== "Older than what we have"
    )
      held.push(`${s.name}: ${check.reason}`);
  }
  await upsertNavs(db, rows, true);
  const summary = {
    written: rows.length,
    held: held.length,
    missingFromAmfi: missing,
  };
  logger.info("Daily NAVs appended", {
    ...summary,
    heldFor: held.slice(0, 20),
  });
  return summary;
}

/** Weekly: compare the last `days` of each fund's stored history with mfapi.in; write only differences. */
export async function reconcileNavs(db: Db, days = 120, concurrency = 4) {
  const sources = await db.select().from(fundSources);
  const since = iso(Date.now() - days * DAY_MS);
  let written = 0;
  let failed = 0;
  await pool(sources, concurrency, async (s) => {
    const remote = await mfapiSeries(s.amfiCode);
    if (!remote) {
      failed++;
      return;
    }
    const stored = await db
      .select({ navDate: navHistory.navDate, nav: navHistory.nav })
      .from(navHistory)
      .where(
        and(
          eq(navHistory.fundId, s.fundId),
          sql`${navHistory.navDate} >= ${since}`,
        ),
      );
    const have = new Map(stored.map((r) => [r.navDate, Number(r.nav)]));
    const diff = remote
      .filter((p) => iso(p.t) >= since)
      .filter((p) => {
        const h = have.get(iso(p.t));
        return h === undefined || Math.abs(h / p.v - 1) > 1e-9;
      });
    if (diff.length) {
      await upsertNavs(db, toRows(s.fundId, diff), true);
      written += diff.length;
    }
  });
  logger.info("NAV reconcile complete", {
    funds: sources.length,
    rowsWritten: written,
    failed,
    days,
  });
  return { rowsWritten: written, failed };
}

/** Weekly: category index, metrics and Compass Score for every fund, from stored history. */
export async function computeScores(db: Db, asOfIso?: string) {
  const summary = { categories: 0, rated: 0, unrated: 0 };
  for (const category of FUND_CATEGORIES) {
    const members = await db
      .select({ id: funds.id, expenseRatio: funds.expenseRatio })
      .from(funds)
      .where(eq(funds.fundCategory, category));
    if (members.length === 0) continue;
    const rows = (
      await db.execute(sql`
      select n.fund_id, n.nav_date::text as d, n.nav
      from nav_history n join funds f on f.id = n.fund_id
      where f.fund_category = ${category}
      order by n.fund_id, n.nav_date
    `)
    ).rows as { fund_id: number; d: string; nav: string }[];
    const byFund = new Map<number, Point[]>();
    for (const r of rows) {
      const list = byFund.get(Number(r.fund_id)) ?? [];
      list.push({ t: day(r.d), v: Number(r.nav) });
      byFund.set(Number(r.fund_id), list);
    }
    const series = members.map((m) => byFund.get(m.id) ?? []);
    const index = categoryIndex(series.filter((s) => s.length > 1));
    if (index.length === 0) {
      logger.warn("No category index", { category });
      continue;
    }
    // members still trading in the last month decide when the day is settled (a closed fund's old
    // history must not hold the date back)
    const recent = series.filter(
      (s) =>
        s.length > 0 &&
        index[index.length - 1].t - s[s.length - 1].t < 30 * DAY_MS,
    );
    const asOf = asOfIso
      ? day(asOfIso)
      : (settledDate(recent) ?? index[index.length - 1].t);
    const inputs = members.map((m, i) => ({
      code: String(m.id),
      series: series[i],
      expenseRatio: m.expenseRatio === null ? null : Number(m.expenseRatio),
    }));
    const metrics = inputs.map((f) => metricsFor(f, index, asOf));
    const scores = compassScores(metrics);

    const n = (x: number | null, digits: number) =>
      x === null || !Number.isFinite(x) ? null : x.toFixed(digits);
    const metricRows = members.map((m, i) => {
      const mt = metrics[i];
      const sc = scores[i];
      const s = series[i].filter((p) => p.t <= asOf);
      const worst = s.length > 1 ? maxDrawdown(s, s[0].t, asOf) : null;
      return {
        fundId: m.id,
        asOf: iso(asOf),
        rated: mt.rated && sc.score !== null,
        unratedReason:
          mt.rated && sc.score === null
            ? "Too few rated funds in this category"
            : mt.unratedReason,
        historyYears: n(mt.historyYears, 2),
        excessReturnRaw: n(mt.excessReturnRaw, 4),
        consistencyRaw: n(mt.consistencyRaw, 4),
        downsideCapture: n(mt.downsideCapture, 2),
        maxDrawdown: n(mt.maxDrawdown, 2),
        categoryMaxDrawdown: n(mt.categoryMaxDrawdown, 2),
        worstFall: worst ? n(worst.depth, 2) : null,
        worstFallPeak: worst && worst.depth < 0 ? iso(worst.peakT) : null,
        worstFallTrough: worst && worst.depth < 0 ? iso(worst.troughT) : null,
        worstFallRecovered: worst?.recoveredT ? iso(worst.recoveredT) : null,
        partReturns: n(sc.parts.returns, 1),
        partConsistency: n(sc.parts.consistency, 1),
        partDownside: n(sc.parts.downside, 1),
        partCost: n(sc.parts.cost, 1),
        score: n(sc.score, 1),
        updatedAt: new Date(),
      };
    });
    await db
      .insert(fundMetrics)
      .values(metricRows)
      .onConflictDoUpdate({
        target: fundMetrics.fundId,
        set: Object.fromEntries(
          Object.keys(metricRows[0])
            .filter((k) => k !== "fundId")
            .map((k) => [
              k,
              sql.raw(
                `excluded.${k.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase())}`,
              ),
            ]),
        ),
      });

    // the category index, every day (~3,400 points a category): numbers shown on a date must be exact, and
    // a weekly sample can be days off. Replaced as a whole in one transaction.
    const indexRows = index.map((p) => ({
      category,
      pointDate: iso(p.t),
      value: p.v.toFixed(6),
    }));
    const inserts = [];
    for (let k = 0; k < indexRows.length; k += INSERT_CHUNK)
      inserts.push(
        db
          .insert(categoryIndexPoints)
          .values(indexRows.slice(k, k + INSERT_CHUNK)),
      );
    await db.batch([
      db
        .delete(categoryIndexPoints)
        .where(eq(categoryIndexPoints.category, category)),
      ...inserts,
    ]);

    summary.categories++;
    summary.rated += metricRows.filter((r) => r.rated).length;
    summary.unrated += metricRows.filter((r) => !r.rated).length;
  }
  logger.info("Compass Scores computed", summary);
  return summary;
}
