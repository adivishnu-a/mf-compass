/**
 * Whether a new daily NAV may be written. Pure; the sync logs every refusal and the weekly reconcile
 * (full history from a second source) settles anything held back here.
 */

export interface DailyNavCheck {
  ok: boolean;
  reason: string | null;
}

/** A daily move beyond this is held for the weekly check (real Indian equity funds don't move 25% in a day). */
export const MAX_DAILY_MOVE = 0.25;

/**
 * @param latest the newest NAV already stored for the fund (null for none)
 * @param next   the candidate from AMFI
 * @param today  ISO date of the run (UTC)
 */
export function checkDailyNav(
  latest: { date: string; nav: number } | null,
  next: { date: string; nav: number },
  today: string,
): DailyNavCheck {
  if (!Number.isFinite(next.nav) || next.nav <= 0)
    return { ok: false, reason: "NAV is not a positive number" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(next.date))
    return { ok: false, reason: "Bad date" };
  if (next.date > today) return { ok: false, reason: "Dated in the future" };
  if (latest) {
    if (next.date < latest.date)
      return { ok: false, reason: "Older than what we have" };
    if (next.date === latest.date && next.nav === latest.nav)
      return { ok: false, reason: "Unchanged" };
    const move = Math.abs(next.nav / latest.nav - 1);
    if (move > MAX_DAILY_MOVE)
      return {
        ok: false,
        reason: `Moved ${(move * 100).toFixed(1)}% since ${latest.date}; held for the weekly check`,
      };
  }
  return { ok: true, reason: null };
}
