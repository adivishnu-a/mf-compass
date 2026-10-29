/**
 * What money put into a fund (or the category average) in the past is worth today, from real prices.
 * Series are [day, value] pairs, day = days since 1 Jan 1970, ascending. Safe to run in the browser.
 */

export type Series = [day: number, value: number][];

const YEAR_DAYS = 365.25;

/** Index of the first point on or after the day, or -1. */
export function firstOnOrAfter(series: Series, day: number) {
  let lo = 0;
  let hi = series.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (series[mid][0] >= day) {
      found = mid;
      hi = mid - 1;
    } else lo = mid + 1;
  }
  return found;
}

/** The series from a day onwards, scaled so its first point is `base`. Empty if it has no prices then. */
export function rebase(series: Series, fromDay: number, base = 100): Series {
  const i = firstOnOrAfter(series, fromDay);
  if (i < 0) return [];
  const v0 = series[i][1];
  return series.slice(i).map(([d, v]) => [d, (v / v0) * base]);
}

/** Annualised return of dated cash flows (negative = money in, positive = money out), as a percent. */
export function xirr(flows: { day: number; amount: number }[]): number | null {
  if (flows.length < 2) return null;
  const d0 = flows[0].day;
  const npv = (r: number) =>
    flows.reduce(
      (s, f) => s + f.amount / Math.pow(1 + r, (f.day - d0) / YEAR_DAYS),
      0,
    );
  // Bisection: NPV falls as the rate rises for an invest-then-redeem pattern.
  let lo = -0.99;
  let hi = 10;
  if (npv(lo) * npv(hi) > 0) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (npv(mid) > 0) lo = mid;
    else hi = mid;
  }
  return ((lo + hi) / 2) * 100;
}

export interface Outcome {
  invested: number;
  value: number;
  /** Annualised return, percent; null over less than a year, where it would mislead. */
  perYear: number | null;
  /** First and last day used. */
  from: number;
  to: number;
}

/**
 * A monthly SIP of `amount` on each point of `monthly` (one price per month, its first trading day)
 * from `fromDay`, valued at the last point of `daily`.
 */
export function sip(
  monthly: Series,
  daily: Series,
  fromDay: number,
  amount: number,
): Outcome | null {
  const i = firstOnOrAfter(monthly, fromDay);
  const last = daily[daily.length - 1];
  if (i < 0 || !last || amount <= 0) return null;
  let units = 0;
  const flows: { day: number; amount: number }[] = [];
  for (const [d, v] of monthly.slice(i)) {
    if (d > last[0]) break;
    units += amount / v;
    flows.push({ day: d, amount: -amount });
  }
  if (!flows.length) return null;
  const value = units * last[1];
  flows.push({ day: last[0], amount: value });
  const years = (last[0] - flows[0].day) / YEAR_DAYS;
  return {
    invested: amount * (flows.length - 1),
    value,
    perYear: years >= 1 ? xirr(flows) : null,
    from: flows[0].day,
    to: last[0],
  };
}

/**
 * A one-time investment of `amount` at the first price in `start` on or after `fromDay` (pass the
 * monthly series to start on a month's first trading day), valued at the last point of `daily`.
 */
export function lumpSum(
  start: Series,
  daily: Series,
  fromDay: number,
  amount: number,
): Outcome | null {
  const i = firstOnOrAfter(start, fromDay);
  const last = daily[daily.length - 1];
  if (i < 0 || !last || amount <= 0 || start[i][0] > last[0]) return null;
  const [d0, v0] = start[i];
  const years = (last[0] - d0) / YEAR_DAYS;
  return {
    invested: amount,
    value: (amount * last[1]) / v0,
    perYear: years >= 1 ? (Math.pow(last[1] / v0, 1 / years) - 1) * 100 : null,
    from: d0,
    to: last[0],
  };
}
