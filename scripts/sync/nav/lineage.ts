/**
 * Pre-merger history. When an AMC is taken over, AMFI issues the surviving schemes new codes, so their
 * history starts at the merger (HSBC after L&T, LIC after IDBI, Sundaram after Principal ...). A
 * predecessor scheme's history is joined on only when two independent checks agree (docs/SCORE.md):
 *   1. continuity: its last NAV continues into the fund's first (within 10 days and 2%), and
 *   2. Kuvera: the joined series reproduces Kuvera's since-launch return within 0.75 percentage points,
 *      starting within 60 days of the fund's real launch. Kuvera's 3Y/5Y returns, where present, must not
 *      disagree by more than 1 point either.
 */
import {
  type Point,
  DAY_MS,
  cagr,
  minusYears,
  valueAt,
} from "@/lib/metrics/series";

export interface KuveraFacts {
  launch: string; // ISO start date
  asOf: string; // ISO returns date
  inception: number | null;
  r3y: number | null;
  r5y: number | null;
}

export interface JoinResult {
  ok: boolean;
  reason: string;
  scale?: number;
  joined?: Point[];
}

/** A fund's own history counts as truncated when it starts more than 45 days after its launch. */
export const isTruncated = (own: readonly Point[], launch: string) =>
  own.length > 0 && own[0].t - Date.parse(launch) > 45 * DAY_MS;

export function verifyJoin(
  own: readonly Point[],
  pred: readonly Point[],
  facts: KuveraFacts,
): JoinResult {
  if (own.length < 2 || pred.length < 30)
    return { ok: false, reason: "Too little history" };
  const last = pred[pred.length - 1];
  const gap = own[0].t - last.t;
  if (gap < 0 || gap > 10 * DAY_MS)
    return {
      ok: false,
      reason: "Predecessor doesn't end where the fund begins",
    };
  const scale = own[0].v / last.v;
  if (Math.abs(scale - 1) > 0.02)
    return {
      ok: false,
      reason: `NAV jumps ${((scale - 1) * 100).toFixed(1)}% at the join`,
    };
  const joined = [
    ...pred
      .filter((p) => p.t < own[0].t)
      .map((p) => ({ t: p.t, v: p.v * scale })),
    ...own,
  ];
  const launch = Date.parse(facts.launch);
  const asOf = Date.parse(facts.asOf);
  if (!Number.isFinite(launch) || !Number.isFinite(asOf))
    return { ok: false, reason: "Missing launch or returns date" };
  if (Math.abs(joined[0].t - launch) > 60 * DAY_MS)
    return { ok: false, reason: "Joined history doesn't start at the launch" };
  if (facts.inception === null)
    return { ok: false, reason: "No since-launch return to check against" };
  const end = valueAt(joined, asOf);
  if (end === null)
    return { ok: false, reason: "No price on the returns date" };
  const sinceLaunch = cagr(joined[0].v, end, (asOf - joined[0].t) / DAY_MS);
  if (sinceLaunch === null || Math.abs(sinceLaunch - facts.inception) > 0.75)
    return {
      ok: false,
      reason: `Since-launch return ${sinceLaunch?.toFixed(2)} vs Kuvera ${facts.inception.toFixed(2)}`,
    };
  for (const [years, kuvera] of [
    [3, facts.r3y],
    [5, facts.r5y],
  ] as const) {
    if (kuvera === null) continue;
    const from = minusYears(asOf, years);
    const a = valueAt(joined, from);
    if (a === null) continue;
    const mine = cagr(a, end, (asOf - from) / DAY_MS);
    if (mine === null || Math.abs(mine - kuvera) > 1)
      return {
        ok: false,
        reason: `${years}Y return ${mine?.toFixed(2)} vs Kuvera ${kuvera.toFixed(2)}`,
      };
  }
  return { ok: true, reason: "Verified", scale, joined };
}

const STOP = new Set([
  "fund",
  "direct",
  "plan",
  "growth",
  "option",
  "the",
  "india",
  "-",
  "&",
  "and",
  "of",
  "mf",
  "mutual",
  "regular",
]);
/** "mid cap", "mid-cap" and "midcap" match each other. */
export const nameWords = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9& ]/g, " ")
    .replace(/\b(mid|small|large|multi|flexi|blue)\s+(cap|chip)\b/g, "$1$2")
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w));

/** Fund houses that took over other AMCs' schemes; predecessors carry the old brand in their name. */
export const FAMILY: Record<string, string[]> = {
  hsbc: ["l&t", "hsbc"],
  lic: ["idbi", "lic"],
  sundaram: ["principal", "sundaram"],
  baroda: ["bnp", "baroda"],
  edelweiss: ["jpmorgan", "jp morgan", "edelweiss"],
  pgim: ["pramerica", "dhfl", "pgim"],
  hdfc: ["hdfc"],
  sbi: ["sbi"],
  absl: ["birla", "aditya"],
};

/** Candidate predecessor scheme codes, most likely first: same family of brands, or most name overlap. */
export function predecessorCandidates(
  schemeName: string,
  shortName: string,
  ownCode: string,
  list: readonly { schemeCode: number | string; schemeName: string }[],
  limit = 80,
): string[] {
  const target = nameWords(schemeName).slice(1);
  const brands = FAMILY[shortName.split(" ")[0].toLowerCase()] ?? [];
  return list
    .filter(
      (c) =>
        String(c.schemeCode) !== ownCode &&
        /direct/i.test(c.schemeName) &&
        /growth/i.test(c.schemeName) &&
        !/idcw|dividend|bonus|nifty|index|etf|sensex/i.test(c.schemeName),
    )
    .map((c) => {
      const name = c.schemeName.toLowerCase();
      const words = nameWords(c.schemeName);
      const overlap =
        target.filter((w) => words.includes(w)).length /
        Math.max(target.length, 1);
      const family = brands.some(
        (b) => name.startsWith(b) || name.includes(" " + b),
      );
      return { code: String(c.schemeCode), overlap, family };
    })
    .filter((x) => x.overlap >= 0.5 || x.family)
    .sort(
      (a, b) => Number(b.family) - Number(a.family) || b.overlap - a.overlap,
    )
    .slice(0, limit)
    .map((x) => x.code);
}
