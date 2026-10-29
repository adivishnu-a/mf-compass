/**
 * Server-side reads for the pages. Scores come from fund_metrics; returns for funds and categories are
 * computed from nav_history and category_index on the same dates, so "fund vs category" is like for like
 * (direct plans on both sides, unlike Kuvera's category averages which mix in regular plans).
 */
import { unstable_cache } from "next/cache";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  CATEGORIES,
  categoryByName,
  type CategoryInfo,
} from "@/lib/categories";
import type { Series } from "@/lib/growth";

const CACHE = { revalidate: 3600, tags: ["funds"] };
const DAY_MS = 86_400_000;
const YEAR_DAYS = 365.25;
/** A price counts for a date if it is at most this many days older (weekends, holidays). */
const MAX_LAG_DAYS = 7;

type Row = Record<string, unknown>;
const num = (v: unknown) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const str = (v: unknown) => (typeof v === "string" && v ? v : null);
const toDay = (iso: string) =>
  Math.round(Date.parse(iso + "T00:00:00Z") / DAY_MS);

let warned = false;

async function rows(query: ReturnType<typeof sql>): Promise<Row[]> {
  // CI builds without credentials: pages prerender empty there. Vercel has the URL and builds them with data.
  if (!process.env.DATABASE_URL) {
    if (!warned)
      console.warn("DATABASE_URL is not set: rendering without fund data");
    warned = true;
    return [];
  }
  const result = (await db.execute(query)) as unknown as { rows: Row[] };
  return result.rows;
}

export interface Returns {
  r1y: number | null;
  r3y: number | null;
  r5y: number | null;
  /** What ₹100 invested five years before the end date is worth on it. */
  growth5y: number | null;
}

/**
 * Returns to `end` from the values at-or-before end, end − 1/3/5 years (with their dates). A period only
 * counts when both prices are fresh, so a fund younger than the period, or with a gap, gets null.
 */
function returnsFrom(r: Row, prefix: string, end: string | null): Returns {
  const empty = { r1y: null, r3y: null, r5y: null, growth5y: null };
  if (!end) return empty;
  const endDay = toDay(end);
  const at = (key: string, targetDay: number) => {
    const v = num(r[`${prefix}${key}_v`]);
    const d = str(r[`${prefix}${key}_d`]);
    return v && v > 0 && d && targetDay - toDay(d) <= MAX_LAG_DAYS ? v : null;
  };
  const v1 = at("e", endDay);
  if (!v1) return empty;
  const back = (years: number, key: string) => {
    const target = new Date(end + "T00:00:00Z");
    target.setUTCFullYear(target.getUTCFullYear() - years);
    // Postgres clamps 29 Feb minus a year to 28 Feb; JS rolls to 1 Mar. Clamp the same way.
    if (target.getUTCDate() !== Number(end.slice(8, 10))) target.setUTCDate(0);
    const tDay = Math.round(target.getTime() / DAY_MS);
    const v0 = at(key, tDay);
    return v0 ? { v0, days: endDay - tDay } : null;
  };
  const cagr = (p: { v0: number; days: number } | null) =>
    p ? (Math.pow(v1 / p.v0, YEAR_DAYS / p.days) - 1) * 100 : null;
  const p5 = back(5, "y5");
  return {
    r1y: cagr(back(1, "y1")),
    r3y: cagr(back(3, "y3")),
    r5y: cagr(p5),
    growth5y: p5 ? (100 * v1) / p5.v0 : null,
  };
}

export interface FundRow extends Returns {
  code: string;
  /** Short name without plan words: "HDFC Mid Cap". */
  name: string;
  /** Full scheme name: "HDFC Mid Cap Growth Direct Plan". */
  fullName: string;
  house: string | null;
  /** AMC logo file name under /logos/amc. */
  houseCode: string | null;
  category: string;
  nav: number | null;
  navDate: string | null;
  startDate: string | null;
  /** Crores. */
  aum: number | null;
  expense: number | null;
  managers: string[];
  rated: boolean;
  unratedReason: string | null;
  score: number | null;
  /** 1 = best rated fund in its category. */
  rank: number | null;
  /** Typical 3-year-period lead over the category, percent a year (unshrunk, as measured). */
  excess: number | null;
  /** Share of 3-year periods ahead of the category, 0..1 (as measured). */
  consistency: number | null;
  /** Fund's move in the category's falling months as % of the category's (100 = fell as much). */
  downCapture: number | null;
  /** Worst fall over the scoring span, and the category's over the same dates (negative %). */
  fall: number | null;
  categoryFall: number | null;
  /** First day of the scoring span (the later of 6 years back and the fund's start). */
  fallFrom: string | null;
  parts: {
    returns: number;
    consistency: number;
    downside: number;
    cost: number;
  } | null;
}

export interface CategoryBoard {
  info: CategoryInfo;
  /** Date of the latest category index point; every return in the board ends here. */
  asOf: string | null;
  /** Rated funds best first, then unrated by size. */
  funds: FundRow[];
  rated: number;
  returns: Returns;
  /** Category's worst fall over the full scoring span. */
  fall: number | null;
  fallFrom: string | null;
}

const lookups = (table: "n" | "c") => {
  const at = (alias: string, interval: string) =>
    table === "n"
      ? sql.raw(
          `left join lateral (select nav v, nav_date::text d from nav_history n where n.fund_id = f.id and n.nav_date <= (a.d - interval '${interval}')::date order by n.nav_date desc limit 1) ${alias} on true`,
        )
      : sql.raw(
          `left join lateral (select value v, point_date::text d from category_index c where c.category = a.category and c.point_date <= (a.d - interval '${interval}')::date order by c.point_date desc limit 1) ${alias} on true`,
        );
  return sql.join(
    [
      at("e", "0 days"),
      at("y1", "1 year"),
      at("y3", "3 years"),
      at("y5", "5 years"),
    ],
    sql` `,
  );
};

const lookupColumns = sql.raw(
  "e.v e_v, e.d e_d, y1.v y1_v, y1.d y1_d, y3.v y3_v, y3.d y3_d, y5.v y5_v, y5.d y5_d",
);

function sixYearsBefore(iso: string) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCFullYear(d.getUTCFullYear() - 6);
  return d.toISOString().slice(0, 10);
}

async function queryBoard(categoryName: string): Promise<CategoryBoard | null> {
  const info = categoryByName(categoryName);
  if (!info) return null;
  const [cat] = await rows(sql`
    with a as (select ${categoryName}::text category, max(point_date) d from category_index where category = ${categoryName})
    select a.d::text as_of, ${lookupColumns} from a ${lookups("c")}`);
  const asOf = str(cat?.as_of);
  const fundRows = await rows(sql`
    with a as (select coalesce(max(point_date), current_date) d from category_index where category = ${categoryName})
    select f.kuvera_code, f.short_name, f.scheme_name, f.fund_house, f.fund_house_name, f.fund_category,
      f.aum, f.expense_ratio, f.current_nav, f.current_nav_date::text nav_date, f.start_date::text start_date,
      f.fund_managers, m.rated, m.unrated_reason, m.score, m.excess_return_raw, m.consistency_raw,
      m.downside_capture, m.max_drawdown, m.category_max_drawdown, m.history_years,
      m.part_returns, m.part_consistency, m.part_downside, m.part_cost,
      ${lookupColumns}
    from funds f cross join a
    left join fund_metrics m on m.fund_id = f.id
    ${lookups("n")}
    where f.fund_category = ${categoryName}`);

  const funds = fundRows.map((r) => toFundRow(r, asOf));
  funds.sort((x, y) =>
    x.score !== null && y.score !== null
      ? y.score - x.score
      : x.score !== null
        ? -1
        : y.score !== null
          ? 1
          : (y.aum ?? 0) - (x.aum ?? 0),
  );
  let rank = 0;
  for (const f of funds) if (f.score !== null) f.rank = ++rank;

  // The category's own fall over the full span: from any fund whose span is the full six years.
  const fullSpan = asOf ? sixYearsBefore(asOf) : null;
  const full = funds.find(
    (f) => f.categoryFall !== null && f.fallFrom === fullSpan,
  );
  return {
    info,
    asOf,
    funds,
    rated: rank,
    returns: returnsFrom(cat ?? {}, "", asOf),
    fall: full?.categoryFall ?? null,
    fallFrom: fullSpan,
  };
}

function toFundRow(r: Row, asOf: string | null): FundRow {
  const score = num(r.score);
  const rated = r.rated === true && score !== null;
  const years = num(r.history_years);
  let fallFrom: string | null = null;
  if (asOf && rated) {
    const six = sixYearsBefore(asOf);
    const start =
      years !== null
        ? new Date(Date.parse(asOf + "T00:00:00Z") - years * YEAR_DAYS * DAY_MS)
            .toISOString()
            .slice(0, 10)
        : six;
    fallFrom = start > six ? start : six;
  }
  const parts =
    rated && num(r.part_returns) !== null
      ? {
          returns: num(r.part_returns) ?? 0,
          consistency: num(r.part_consistency) ?? 0,
          downside: num(r.part_downside) ?? 0,
          cost: num(r.part_cost) ?? 0,
        }
      : null;
  const managers = Array.isArray(r.fund_managers)
    ? (r.fund_managers as unknown[]).filter(
        (m): m is string => typeof m === "string" && m.trim() !== "",
      )
    : [];
  return {
    code: String(r.kuvera_code),
    name: cleanName(str(r.short_name) ?? String(r.scheme_name)),
    fullName: String(r.scheme_name),
    house: houseName(str(r.fund_house_name)),
    houseCode: str(r.fund_house),
    category: String(r.fund_category),
    nav: num(r.current_nav),
    navDate: str(r.nav_date),
    startDate: str(r.start_date),
    aum: num(r.aum),
    expense: num(r.expense_ratio),
    managers,
    rated,
    unratedReason: rated ? null : (str(r.unrated_reason) ?? "Not scored yet"),
    score: rated ? score : null,
    rank: null,
    excess: rated ? num(r.excess_return_raw) : null,
    consistency: rated ? num(r.consistency_raw) : null,
    downCapture: rated ? num(r.downside_capture) : null,
    fall: rated ? num(r.max_drawdown) : null,
    categoryFall: rated ? num(r.category_max_drawdown) : null,
    fallFrom,
    parts,
    ...returnsFrom(r, "", asOf),
  };
}

const ACRONYMS = new Set([
  "HDFC",
  "ICICI",
  "SBI",
  "UTI",
  "DSP",
  "ITI",
  "PGIM",
  "HSBC",
  "LIC",
  "JM",
  "NJ",
  "IDFC",
  "BNP",
  "AMC",
  "MF",
]);

/** Some fund houses arrive in capitals ("EDELWEISS Mutual Fund"); show those words in title case. */
function houseName(name: string | null) {
  return (
    name
      ?.split(" ")
      .map((w) =>
        w.length > 1 && w === w.toUpperCase() && !ACRONYMS.has(w)
          ? w.charAt(0) + w.slice(1).toLowerCase()
          : w,
      )
      .join(" ") ?? null
  );
}

/** "HDFC Mid Cap Fund" stays; trailing plan words some short names carry are dropped. */
function cleanName(name: string) {
  return name
    .replace(/\s*\((G|Growth)\)\s*$/i, "")
    .replace(
      /\s+(Direct|Growth|Plan|Option)(\s+(Direct|Growth|Plan|Option))*\s*$/i,
      "",
    )
    .trim();
}

/** Leaderboard and summary for one category, cached for an hour. */
export const getBoard = unstable_cache(queryBoard, ["board-v3"], CACHE);

export const getAllBoards = async () =>
  (await Promise.all(CATEGORIES.map((c) => getBoard(c.name)))).filter(
    (b): b is CategoryBoard => b !== null,
  );

export interface FundLookup {
  code: string;
  name: string;
  house: string | null;
  houseCode: string | null;
  category: string;
  score: number | null;
  rank: number | null;
  /** Rated funds in its category. */
  rated: number;
}

/** Every fund, small enough for in-browser search (about 30 KB). */
export const getLookup = unstable_cache(
  async (): Promise<FundLookup[]> => {
    const boards = await getAllBoards();
    return boards.flatMap((b) =>
      b.funds.map((f) => ({
        code: f.code,
        name: f.name,
        house: f.house,
        houseCode: f.houseCode,
        category: f.category,
        score: f.score,
        rank: f.rank,
        rated: b.rated,
      })),
    );
  },
  ["lookup-v2"],
  CACHE,
);

export interface FundDetail {
  fund: FundRow;
  board: CategoryBoard;
  objective: string | null;
  sipMin: number | null;
  lockInDays: number | null;
  risk: string | null;
  worst: {
    fall: number;
    peak: string;
    trough: string;
    recovered: string | null;
  } | null;
  /** Weekly closes (last trading day of each week) for charts. */
  weekly: { fund: Series; category: Series };
  /** First trading day of each month, for SIPs. */
  monthly: { fund: Series; category: Series };
  /** Last daily point of each, for valuing to the latest price. */
  last: { fund: [number, number] | null; category: [number, number] | null };
}

function weeklyAndMonthly(points: Series) {
  const weekly: Series = [];
  const monthly: Series = [];
  let lastMonth = -1;
  for (let i = 0; i < points.length; i++) {
    const [d] = points[i];
    const next = points[i + 1];
    // 1 Jan 1970 was a Thursday, so (day + 3) / 7 starts weeks on Monday.
    if (!next || Math.floor((next[0] + 3) / 7) !== Math.floor((d + 3) / 7))
      weekly.push(points[i]);
    const m =
      new Date(d * DAY_MS).getUTCFullYear() * 12 +
      new Date(d * DAY_MS).getUTCMonth();
    if (m !== lastMonth) {
      monthly.push(points[i]);
      lastMonth = m;
    }
  }
  return { weekly, monthly };
}

async function queryDetail(code: string): Promise<FundDetail | null> {
  const [meta] = await rows(sql`
    select f.id, f.fund_category, f.investment_objective, f.sip_min, f.lock_in_period,
      f.crisil_rating, m.worst_fall, m.worst_fall_peak::text peak, m.worst_fall_trough::text trough,
      m.worst_fall_recovered::text recovered
    from funds f left join fund_metrics m on m.fund_id = f.id where f.kuvera_code = ${code}`);
  if (!meta) return null;
  const board = await getBoard(String(meta.fund_category));
  const fund = board?.funds.find((f) => f.code === code);
  if (!board || !fund) return null;

  const [navs, index] = await Promise.all([
    rows(
      sql`select nav_date::text d, nav v from nav_history where fund_id = ${meta.id} order by nav_date`,
    ),
    rows(
      sql`select point_date::text d, value v from category_index where category = ${board.info.name} order by point_date`,
    ),
  ]);
  const toSeries = (rs: Row[]): Series =>
    rs
      .map((r) => [toDay(String(r.d)), Number(r.v)] as [number, number])
      .filter(([, v]) => v > 0);
  const fundSeries = toSeries(navs);
  // The category line starts where the fund's does, so both are drawn over the same dates.
  const start = fundSeries[0]?.[0] ?? Infinity;
  const catSeries = toSeries(index).filter(([d]) => d >= start);
  const f = weeklyAndMonthly(fundSeries);
  const c = weeklyAndMonthly(catSeries);
  const worstFall = num(meta.worst_fall);

  return {
    fund,
    board,
    objective: str(meta.investment_objective),
    sipMin: num(meta.sip_min),
    lockInDays: num(meta.lock_in_period),
    risk: str(meta.crisil_rating),
    worst:
      worstFall !== null && worstFall < 0 && str(meta.peak) && str(meta.trough)
        ? {
            fall: worstFall,
            peak: String(meta.peak),
            trough: String(meta.trough),
            recovered: str(meta.recovered),
          }
        : null,
    weekly: { fund: f.weekly, category: c.weekly },
    monthly: { fund: f.monthly, category: c.monthly },
    last: {
      fund: fundSeries.at(-1) ?? null,
      category: catSeries.at(-1) ?? null,
    },
  };
}

/** Everything the fund page needs, cached for an hour per fund. */
export const getFundDetail = unstable_cache(queryDetail, ["detail-v1"], CACHE);
