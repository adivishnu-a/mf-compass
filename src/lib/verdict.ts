/** Plain-language sentences from a fund's measured record. Every number in them comes from the data. */
import type { CategoryInfo } from "@/lib/categories";
import { fall, month, pct, span } from "@/lib/format";

interface Record {
  excess: number | null;
  consistency: number | null;
  downCapture: number | null;
  fall: number | null;
  categoryFall: number | null;
  fallFrom: string | null;
  expense: number | null;
  r1y: number | null;
}

const share = (x: number) => `${Math.round(x * 100)}%`;
/** "4%" for a clear lead, "1.2%" for a small one, where the decimal matters. */
const about = (x: number) => {
  const a = Math.abs(x);
  return a >= 2 ? `${Math.round(a)}%` : `${a.toFixed(1)}%`;
};
const year = (iso: string) => iso.slice(0, 4);

/** One line for lists: "Ahead by 4.0% a year · beat it 97% of the time". */
export function summaryLine(f: Pick<Record, "excess" | "consistency">) {
  if (f.excess === null || f.consistency === null) return null;
  const often =
    f.consistency >= 0.995
      ? "beat it every time"
      : f.consistency < 0.005
        ? "never ahead"
        : `beat it ${share(f.consistency)} of the time`;
  if (Math.abs(f.excess) < 0.05) return `Level with its category · ${often}`;
  return `${f.excess > 0 ? "Ahead by" : "Behind by"} ${Math.abs(f.excess).toFixed(1)}% a year · ${often}`;
}

/** Short notes under each part bar. */
export function partNotes(f: Record) {
  return {
    returns:
      f.excess === null
        ? null
        : Math.abs(f.excess) < 0.05
          ? "Level with peers"
          : `About ${about(f.excess)} a year ${f.excess > 0 ? "ahead" : "behind"}`,
    consistency:
      f.consistency === null
        ? null
        : `Ahead in ${share(f.consistency)} of periods`,
    downside:
      f.downCapture === null
        ? null
        : Math.abs(f.downCapture - 100) < 0.5
          ? "Fell as much as peers"
          : `Fell ${Math.round(Math.abs(100 - f.downCapture))}% ${f.downCapture < 100 ? "less" : "more"} than peers`,
    cost: f.expense === null ? null : `${f.expense.toFixed(2)}% a year`,
  };
}

/** The "In plain words" sentences. `medianExpense` is the category's middle cost. */
export function plainWords(
  f: Record,
  cat: CategoryInfo,
  categoryR1y: number | null,
  medianExpense: number | null,
) {
  const lines: string[] = [];
  if (f.excess !== null && f.consistency !== null) {
    if (f.excess > 0.05)
      lines.push(
        `Beat ${cat.peer} in ${share(f.consistency)} of 3-year periods, by about ${about(f.excess)} a year.`,
      );
    else if (f.excess < -0.05)
      lines.push(
        `Trailed ${cat.peer} by about ${about(f.excess)} a year, and was ahead in only ${share(f.consistency)} of 3-year periods.`,
      );
    else
      lines.push(
        `Kept level with ${cat.peer}, ahead in ${share(f.consistency)} of 3-year periods.`,
      );
  }
  if (f.fall !== null && f.categoryFall !== null) {
    const since = f.fallFrom ? ` since ${year(f.fallFrom)}` : "";
    const diff = f.fall - f.categoryFall;
    const lead =
      Math.abs(diff) < 0.5
        ? "Fell about as much as its category"
        : diff > 0
          ? "Fell less when markets fell"
          : "Fell more when markets fell";
    lines.push(
      `${lead}: ${fall(f.fall, 0)} at worst${since}, against ${fall(f.categoryFall, 0)} for its category.`,
    );
  }
  if (f.expense !== null && medianExpense !== null) {
    const diff = f.expense - medianExpense;
    lines.push(
      `Costs ${f.expense.toFixed(2)}% a year, ${
        Math.abs(diff) < 0.005
          ? `about the middle for ${cat.short}`
          : diff < 0
            ? `less than most ${cat.short}`
            : `more than most ${cat.short}`
      }.`,
    );
  }
  if (f.r1y !== null && categoryR1y !== null) {
    const diff = f.r1y - categoryR1y;
    const how =
      Math.abs(diff) < 0.3
        ? "about the same as"
        : `${Math.abs(diff) < 2 ? "a little " : ""}${diff > 0 ? "better than" : "worse than"}`;
    const move =
      Math.abs(f.r1y) < 0.05
        ? "flat"
        : `${f.r1y > 0 ? "up" : "down"} ${Math.abs(f.r1y).toFixed(1)}%`;
    lines.push(
      `Over the past year it's ${move}, ${how} ${cat.peer} (${pct(categoryR1y)}).`,
    );
  }
  return lines;
}

/** "From its peak in Jan 2018 to its low in Mar 2020. It was back at its old high by Nov 2020, 8 months after the bottom." */
export function worstFallWords(w: {
  peak: string;
  trough: string;
  recovered: string | null;
}) {
  return `From its peak in ${month(w.peak)} to its low in ${month(w.trough)}. ${
    w.recovered
      ? `It was back at its old high by ${month(w.recovered)}, ${span(w.trough, w.recovered)} after the bottom.`
      : "It hasn't yet climbed back to that high."
  }`;
}

export function median(xs: (number | null)[]) {
  const v = xs.filter((x): x is number => x !== null).sort((a, b) => a - b);
  if (!v.length) return null;
  const mid = v.length >> 1;
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}
