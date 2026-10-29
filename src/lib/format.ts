/** Display formatting. Missing values render as an em dash; minus signs are the typographic "−". */

const DASH = "—";
const MINUS = "−";

const grouped = (n: number, digits = 0) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);

const ok = (n: number | null | undefined): n is number =>
  typeof n === "number" && Number.isFinite(n);

/** "+15.7%", "−2.5%", "0.0%". */
export function pct(n: number | null | undefined, digits = 1, sign = true) {
  if (!ok(n)) return DASH;
  const r = Number(n.toFixed(digits));
  const body = `${Math.abs(r).toFixed(digits)}%`;
  if (r < 0) return MINUS + body;
  return sign && r > 0 ? `+${body}` : body;
}

/** A number with a typographic minus, no sign for positives: "−39.5%". */
export const fall = (n: number | null | undefined, digits = 1) =>
  pct(n, digits, false);

/** Rupees in Indian style: "₹5,000", "₹6.01 lakh", "₹1.20 crore". */
export function inr(n: number | null | undefined) {
  if (!ok(n)) return DASH;
  const sign = n < 0 ? MINUS : "";
  const a = Math.abs(n);
  if (a >= 1e7) return `${sign}₹${grouped(a / 1e7, 2)} crore`;
  if (a >= 1e5) return `${sign}₹${grouped(a / 1e5, 2)} lakh`;
  return `${sign}₹${grouped(Math.round(a))}`;
}

/** Rupees, always in full: "₹1,01,856". */
export const inrFull = (n: number | null | undefined) =>
  ok(n) ? `₹${grouped(Math.round(n))}` : DASH;

/** NAV with paise: "₹216.12". */
export const nav = (n: number | null | undefined) =>
  ok(n) ? `₹${grouped(n, 2)}` : DASH;

/** Fund size, given in crores: "₹1.02 lakh Cr", "₹19,250 Cr". */
export function aum(crores: number | null | undefined) {
  if (!ok(crores) || crores <= 0) return DASH;
  if (crores >= 1e5) return `₹${grouped(crores / 1e5, 2)} lakh Cr`;
  return `₹${grouped(Math.round(crores))} Cr`;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const parts = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return { y, m, d };
};

/** "28 Oct 2026" from an ISO date. */
export function day(iso: string | null | undefined) {
  if (!iso) return DASH;
  const { y, m, d } = parts(iso);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** "Nov 2020" from an ISO date. */
export function month(iso: string | null | undefined) {
  if (!iso) return DASH;
  const { y, m } = parts(iso);
  return `${MONTHS[m - 1]} ${y}`;
}

/** Same as day(), from days since the Unix epoch: "29 Dec 2023". */
export const dayOfDay = (dayNumber: number) =>
  day(new Date(dayNumber * 86_400_000).toISOString());

/** Same as month(), from days since the Unix epoch. */
export const monthOfDay = (dayNumber: number) =>
  month(new Date(dayNumber * 86_400_000).toISOString());

export const year = (iso: string | null | undefined) =>
  iso ? String(parts(iso).y) : DASH;

function ordinal(n: number) {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${{ 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th"}`;
}

/** "Best of 29", "2nd of 29". */
export const rankOf = (rank: number, total: number) =>
  rank === 1 ? `Best of ${total}` : `${ordinal(rank)} of ${total}`;

/** "1 fund", "29 funds". */
export const count = (n: number, one: string, many: string) =>
  `${grouped(n)} ${n === 1 ? one : many}`;

/** Months between two ISO dates, said plainly: "8 months", "2 years 10 months". */
export function span(fromIso: string, toIso: string) {
  const a = parts(fromIso);
  const b = parts(toIso);
  let months = (b.y - a.y) * 12 + (b.m - a.m) - (b.d < a.d ? 1 : 0);
  if (months < 1) return "under a month";
  const years = Math.floor(months / 12);
  months %= 12;
  const y = years ? count(years, "year", "years") : "";
  const m = months ? count(months, "month", "months") : "";
  return [y, m].filter(Boolean).join(" ");
}

/** The fund house part of a fund's name, for tight spaces: "HDFC Mid Cap" → "HDFC", "Nippon India Large Cap" → "Nippon India". */
export const houseShort = (name: string) =>
  name.replace(
    /\s+(Large|Mid|Small|Flexi|Multi|Midcap|Smallcap|Flexicap|Multicap|Balanced|Aggressive|Focused|ELSS)\b.*$/i,
    "",
  ) || name;
