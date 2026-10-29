/**
 * AMFI's daily NAV file (every open scheme in India, about 2 MB): scheme code, ISINs, NAV, date.
 * One download covers every fund's latest NAV, so the daily sync makes one request, not one per fund.
 */

export const AMFI_NAV_URL = "https://portal.amfiindia.com/spages/NAVAll.txt";

export interface AmfiNav {
  code: string;
  /** ISO date, e.g. 2026-10-28 */
  date: string;
  nav: number;
}

const MONTHS: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

/** "28-Oct-2026" to "2026-10-28"; null when it isn't a real calendar date. */
export function parseAmfiDate(raw: string): string | null {
  const m = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/.exec(raw.trim());
  if (!m) return null;
  const day = Number(m[1]);
  const month = MONTHS[m[2].toLowerCase()];
  const year = Number(m[3]);
  if (!month) return null;
  const t = Date.UTC(year, month - 1, day);
  const d = new Date(t);
  if (d.getUTCDate() !== day || d.getUTCMonth() !== month - 1) return null;
  return d.toISOString().slice(0, 10);
}

/**
 * Parse NAVAll.txt into ISIN -> latest NAV. Rows look like
 *   120357;INF205K01MA0;-;Invesco India Large & Mid Cap Fund;Direct Plan;Growth;123.72;28-Oct-2026
 * Column 2 holds the growth / payout ISIN and column 3 the reinvestment ISIN; both map to the scheme.
 * Section headers, blank lines and rows with an unreadable NAV or date ("N.A.", "-") are skipped, never
 * guessed. An ISIN listed twice keeps the newer date.
 */
export function parseNavAll(text: string): Map<string, AmfiNav> {
  const out = new Map<string, AmfiNav>();
  for (const line of text.split(/\r?\n/)) {
    const cols = line.split(";");
    if (cols.length < 6 || !/^\d+$/.test(cols[0].trim())) continue;
    const nav = Number(cols[cols.length - 2].trim());
    const date = parseAmfiDate(cols[cols.length - 1]);
    if (!Number.isFinite(nav) || nav <= 0 || !date) continue;
    const row = { code: cols[0].trim(), date, nav };
    for (const raw of [cols[1], cols[2]]) {
      const isin = raw?.trim();
      if (!isin || !/^INF[A-Z0-9]{9}$/.test(isin)) continue;
      const prev = out.get(isin);
      if (!prev || prev.date < date) out.set(isin, row);
    }
  }
  return out;
}

export async function fetchNavAll(tries = 4): Promise<string> {
  let lastError: unknown = null;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(AMFI_NAV_URL, {
        signal: AbortSignal.timeout(60_000),
        redirect: "follow",
      });
      if (res.ok) {
        const text = await res.text();
        // a real file has thousands of rows; a short body is an error page, not data
        if (text.length > 100_000) return text;
        lastError = new Error(`AMFI file too short (${text.length} bytes)`);
      } else lastError = new Error(`AMFI HTTP ${res.status}`);
    } catch (err) {
      lastError = err;
    }
    await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
  }
  throw lastError instanceof Error ? lastError : new Error("AMFI fetch failed");
}
