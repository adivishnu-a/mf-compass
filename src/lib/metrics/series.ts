/**
 * NAV series primitives. Pure: no DB, no fetch, no Date.now().
 * Times are UTC midnight milliseconds; a series is sorted ascending with one point per day.
 */

export interface Point {
  t: number;
  v: number;
}

export const DAY_MS = 86_400_000;
export const YEAR_DAYS = 365.25;

/** "27-10-2026" (mfapi) or "2026-10-27" (ISO) to UTC ms; NaN when it isn't a real calendar date. */
export function parseNavDate(raw: string): number {
  const s = String(raw).trim();
  let y: number, m: number, d: number;
  const dmy = /^(\d{2})-(\d{2})-(\d{4})$/.exec(s);
  const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (dmy) [d, m, y] = [Number(dmy[1]), Number(dmy[2]), Number(dmy[3])];
  else if (ymd) [y, m, d] = [Number(ymd[1]), Number(ymd[2]), Number(ymd[3])];
  else return NaN;
  const t = Date.UTC(y, m - 1, d);
  const back = new Date(t);
  // Date.UTC rolls 31-02 into March; a real date must survive the round trip.
  return back.getUTCFullYear() === y &&
    back.getUTCMonth() === m - 1 &&
    back.getUTCDate() === d
    ? t
    : NaN;
}

export interface CleanReport {
  dropped: number;
  duplicates: number;
  spikes: number;
}

/** A one-day move this large that reverses the next day is a data error, not a market move. */
const SPIKE_MOVE = 0.15;
const SPIKE_REVERSAL = 0.1;

/**
 * Raw NAV rows to a clean series:
 * - drops rows with an unparseable date or a NAV that is missing, non-numeric, zero, negative or infinite
 *   (mfapi has 0.00000 NAVs in 2013 for some schemes);
 * - one point per day: when a date repeats, the later row wins;
 * - removes isolated spikes: a point more than 15% away from both neighbours in opposite directions
 *   (e.g. Quant funds +81% then -45% the next day in 2014–15);
 * - returns ascending by date.
 */
export function cleanSeries(
  rows: readonly { date: string; nav: string | number | null | undefined }[],
): { series: Point[]; report: CleanReport } {
  const byDay = new Map<number, number>();
  let dropped = 0;
  let duplicates = 0;
  for (const row of rows) {
    const t = parseNavDate(row?.date ?? "");
    const v =
      row?.nav === null || row?.nav === undefined || row?.nav === ""
        ? NaN
        : Number(row.nav);
    if (!Number.isFinite(t) || !Number.isFinite(v) || v <= 0) {
      dropped++;
      continue;
    }
    if (byDay.has(t)) duplicates++;
    byDay.set(t, v);
  }
  let series = [...byDay.entries()]
    .map(([t, v]) => ({ t, v }))
    .sort((a, b) => a.t - b.t);

  let spikes = 0;
  // Repeat until stable: removing one spike can expose another that was hidden next to it.
  for (let changed = true; changed;) {
    changed = false;
    const kept: Point[] = [];
    for (let i = 0; i < series.length; i++) {
      const prev = kept[kept.length - 1];
      const next = series[i + 1];
      if (prev && next) {
        const up = series[i].v / prev.v - 1;
        const back = next.v / series[i].v - 1;
        if (
          Math.abs(up) > SPIKE_MOVE &&
          Math.abs(back) > SPIKE_REVERSAL &&
          Math.sign(up) !== Math.sign(back)
        ) {
          spikes++;
          changed = true;
          continue;
        }
      }
      kept.push(series[i]);
    }
    series = kept;
  }
  return { series, report: { dropped, duplicates, spikes } };
}

/** Index of the last point at or before t, or -1. */
export function indexAtOrBefore(series: readonly Point[], t: number): number {
  let lo = 0;
  let hi = series.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (series[mid].t <= t) {
      found = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return found;
}

/**
 * NAV on day t, or the last one before it if it is no more than maxLagDays old (weekends, holidays).
 * null when there is no point that recent, so a window never silently uses a stale or out-of-range price.
 */
export function valueAt(
  series: readonly Point[],
  t: number,
  maxLagDays = 7,
): number | null {
  const i = indexAtOrBefore(series, t);
  if (i < 0) return null;
  return t - series[i].t <= maxLagDays * DAY_MS ? series[i].v : null;
}

/** Annualised return in percent between two values over a span in days; null for a span under a day. */
export function cagr(v0: number, v1: number, days: number): number | null {
  if (!(v0 > 0) || !(v1 > 0) || !(days >= 1)) return null;
  return (Math.pow(v1 / v0, YEAR_DAYS / days) - 1) * 100;
}

/** Calendar year, months back from t (same day of month, clamped: 31 Mar minus 1 month is 28/29 Feb). */
export function minusMonths(t: number, months: number): number {
  const d = new Date(t);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() - months;
  const target = new Date(Date.UTC(y, m, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  return Date.UTC(
    target.getUTCFullYear(),
    target.getUTCMonth(),
    Math.min(d.getUTCDate(), lastDay),
  );
}

export const minusYears = (t: number, years: number) =>
  minusMonths(t, years * 12);

/** Month-on-month returns (fraction) from the last NAV of each calendar month within [from, to]. */
export function monthlyReturns(
  series: readonly Point[],
  from: number,
  to: number,
): Map<string, number> {
  const monthEnd = new Map<string, number>();
  for (const p of series) {
    if (p.t < from || p.t > to) continue;
    const d = new Date(p.t);
    monthEnd.set(`${d.getUTCFullYear()}-${d.getUTCMonth()}`, p.v);
  }
  const keys = [...monthEnd.keys()];
  const out = new Map<string, number>();
  for (let i = 1; i < keys.length; i++) {
    const [y0, m0] = keys[i - 1].split("-").map(Number);
    const [y1, m1] = keys[i].split("-").map(Number);
    // only consecutive months: a gap would turn a multi-month move into one "monthly" return
    if (y1 * 12 + m1 - (y0 * 12 + m0) !== 1) continue;
    out.set(keys[i], monthEnd.get(keys[i])! / monthEnd.get(keys[i - 1])! - 1);
  }
  return out;
}

/** Deepest peak-to-trough fall within [from, to], as a negative percent (0 when it never fell), with dates. */
export function maxDrawdown(
  series: readonly Point[],
  from: number,
  to: number,
): {
  depth: number;
  peakT: number;
  troughT: number;
  recoveredT: number | null;
} | null {
  let peak: Point | null = null;
  let worst = {
    depth: 0,
    peakT: NaN,
    troughT: NaN,
    recoveredT: null as number | null,
  };
  let seen = 0;
  for (const p of series) {
    if (p.t < from || p.t > to) continue;
    seen++;
    if (!peak || p.v > peak.v) peak = p;
    const dd = (p.v / peak.v - 1) * 100;
    if (dd < worst.depth)
      worst = { depth: dd, peakT: peak.t, troughT: p.t, recoveredT: null };
  }
  if (seen < 2) return null;
  if (worst.depth < 0) {
    const peakValue = series[indexAtOrBefore(series, worst.peakT)].v;
    for (const p of series) {
      if (p.t > worst.troughT && p.t <= to && p.v >= peakValue) {
        worst.recoveredT = p.t;
        break;
      }
    }
  }
  return worst;
}

/**
 * Equal-weighted category index (the "average fund" of the category).
 * Index days are the days on which at least minMembers funds have a price, so it never rests on one or two
 * funds. Each step is the average, over members priced on both index days, of their move from the previous
 * index day: a day skipped for being sparse loses no market move, it just lands in the next step. A member
 * whose previous price is more than 7 days old sits that step out rather than contributing a multi-week move.
 * Starts at 100 on its first index day.
 */
export function categoryIndex(
  members: readonly (readonly Point[])[],
  minMembers = 5,
): Point[] {
  const counts = new Map<number, number>();
  for (const s of members)
    for (const p of s) counts.set(p.t, (counts.get(p.t) ?? 0) + 1);
  const days = [...counts.entries()]
    .filter(([, n]) => n >= minMembers)
    .map(([t]) => t)
    .sort((a, b) => a - b);
  if (days.length === 0) return [];

  const exact = members.map((s) => new Map(s.map((p) => [p.t, p.v])));
  const out: Point[] = [{ t: days[0], v: 100 }];
  let level = 100;
  for (let i = 1; i < days.length; i++) {
    let sum = 0;
    let n = 0;
    for (let k = 0; k < members.length; k++) {
      const v1 = exact[k].get(days[i]);
      if (v1 === undefined) continue;
      const v0 = valueAt(members[k], days[i - 1], 7);
      if (v0 === null) continue;
      sum += v1 / v0 - 1;
      n++;
    }
    if (n > 0) level *= 1 + sum / n;
    out.push({ t: days[i], v: level });
  }
  return out;
}

/**
 * The latest day on which at least `minShare` of the members have a price: the date to score "as of".
 * AMFI NAVs arrive through the evening, so a run mid-update would otherwise compare funds that have today's
 * price with ones that don't. null when no day qualifies.
 */
export function settledDate(
  members: readonly (readonly Point[])[],
  minShare = 0.9,
): number | null {
  const live = members.filter((s) => s.length > 0);
  if (live.length === 0) return null;
  const counts = new Map<number, number>();
  for (const s of live)
    for (const p of s) counts.set(p.t, (counts.get(p.t) ?? 0) + 1);
  const need = Math.ceil(live.length * minShare);
  let best: number | null = null;
  for (const [t, n] of counts)
    if (n >= need && (best === null || t > best)) best = t;
  return best;
}
