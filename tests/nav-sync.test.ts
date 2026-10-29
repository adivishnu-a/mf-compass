import { describe, test, expect } from "vitest";
import { parseAmfiDate, parseNavAll } from "../scripts/sync/nav/amfi";
import { checkDailyNav } from "../scripts/sync/nav/validate";
import {
  verifyJoin,
  isTruncated,
  nameWords,
} from "../scripts/sync/nav/lineage";
import { DAY_MS, type Point } from "../src/lib/metrics/series";

describe("parseAmfiDate", () => {
  test("AMFI format to ISO, impossible dates refused", () => {
    expect(parseAmfiDate("28-Oct-2026")).toBe("2026-10-28");
    expect(parseAmfiDate("1-Mar-2024")).toBe("2024-03-01");
    expect(parseAmfiDate("29-Feb-2025")).toBeNull();
    expect(parseAmfiDate("31-Apr-2026")).toBeNull();
    expect(parseAmfiDate("28-Okt-2026")).toBeNull();
    expect(parseAmfiDate("2026-10-28")).toBeNull();
    expect(parseAmfiDate("")).toBeNull();
  });
});

describe("parseNavAll", () => {
  const file = [
    "Scheme Code;ISIN Div Payout/ ISIN Growth;ISIN Div Reinvestment;Scheme Name;Plan;Option;Net Asset Value;Date",
    "",
    "Open Ended Schemes(Equity Scheme - Mid Cap Fund)",
    " ",
    "HDFC Mutual Fund",
    "118989;INF179K01XQ0;-;HDFC Mid Cap Fund;Direct Plan;Growth;216.123;27-Oct-2026",
    "118990;INF179K01XR8;INF179K01XS6;HDFC Mid Cap Fund;Direct Plan;IDCW;55.5;27-Oct-2026",
    "100001;INF000A00001;-;Old Fund;Direct;Growth;N.A.;27-Oct-2026",
    "100002;INF000A00002;-;Zero Fund;Direct;Growth;0;27-Oct-2026",
    "100003;INF000A00003;-;Bad Date Fund;Direct;Growth;10.5;31-Feb-2026",
    "100004;-;-;No ISIN Fund;Direct;Growth;10.5;27-Oct-2026",
    "118989;INF179K01XQ0;-;HDFC Mid Cap Fund;Direct Plan;Growth;215.0;24-Oct-2026",
  ].join("\r\n");
  const map = parseNavAll(file);
  test("reads growth and reinvestment ISINs, skips headers and unreadable rows", () => {
    expect(map.get("INF179K01XQ0")).toEqual({
      code: "118989",
      date: "2026-10-27",
      nav: 216.123,
    });
    expect(map.get("INF179K01XS6")?.code).toBe("118990");
    expect(map.has("INF000A00001")).toBe(false); // N.A.
    expect(map.has("INF000A00002")).toBe(false); // zero NAV
    expect(map.has("INF000A00003")).toBe(false); // 31 Feb
    expect(map.size).toBe(3);
  });
  test("an ISIN listed twice keeps the newer date", () => {
    expect(map.get("INF179K01XQ0")?.nav).toBe(216.123);
  });
});

describe("checkDailyNav", () => {
  const latest = { date: "2026-10-27", nav: 100 };
  test("a normal next day passes; a first-ever NAV passes", () => {
    expect(
      checkDailyNav(latest, { date: "2026-10-28", nav: 101.2 }, "2026-10-28")
        .ok,
    ).toBe(true);
    expect(
      checkDailyNav(null, { date: "2026-10-28", nav: 10 }, "2026-10-28").ok,
    ).toBe(true);
  });
  test("a same-day correction passes; the same value is skipped (no write)", () => {
    expect(
      checkDailyNav(latest, { date: "2026-10-27", nav: 100.4 }, "2026-10-28")
        .ok,
    ).toBe(true);
    expect(
      checkDailyNav(latest, { date: "2026-10-27", nav: 100 }, "2026-10-28")
        .reason,
    ).toBe("Unchanged");
  });
  test("refuses zero, negative, NaN, future, older and wild moves", () => {
    const today = "2026-10-28";
    expect(
      checkDailyNav(latest, { date: "2026-10-28", nav: 0 }, today).ok,
    ).toBe(false);
    expect(
      checkDailyNav(latest, { date: "2026-10-28", nav: -5 }, today).ok,
    ).toBe(false);
    expect(
      checkDailyNav(latest, { date: "2026-10-28", nav: NaN }, today).ok,
    ).toBe(false);
    expect(
      checkDailyNav(latest, { date: "2026-10-29", nav: 101 }, today).reason,
    ).toBe("Dated in the future");
    expect(
      checkDailyNav(latest, { date: "2026-10-20", nav: 99 }, today).reason,
    ).toBe("Older than what we have");
    expect(
      checkDailyNav(latest, { date: "2026-10-28", nav: 130 }, today).reason,
    ).toMatch(/held for the weekly check/);
    expect(
      checkDailyNav(latest, { date: "2026-10-28", nav: 70 }, today).ok,
    ).toBe(false);
    expect(
      checkDailyNav(latest, { date: "28-10-2026", nav: 101 }, today).reason,
    ).toBe("Bad date");
  });
});

describe("verifyJoin", () => {
  const d = (iso: string) => Date.parse(iso + "T00:00:00Z");
  /** daily series at a constant annual growth from start to end */
  const series = (
    startIso: string,
    endIso: string,
    v0: number,
    rate: number,
  ): Point[] => {
    const out: Point[] = [];
    for (let t = d(startIso); t <= d(endIso); t += DAY_MS)
      out.push({
        t,
        v: v0 * Math.pow(1 + rate / 100, (t - d(startIso)) / (365.25 * DAY_MS)),
      });
    return out;
  };
  // a fund launched 2013, renamed in a 2022 merger: same growth rate before and after
  const pred = series("2013-01-01", "2022-11-25", 10, 15);
  const own = series(
    "2022-11-28",
    "2026-10-27",
    pred[pred.length - 1].v * Math.pow(1.15, 3 / 365.25),
    15,
  );
  const facts = {
    launch: "2013-01-01",
    asOf: "2026-10-27",
    inception: 15,
    r3y: 15,
    r5y: 15,
  };

  test("accepts a continuous predecessor that reproduces the since-launch return", () => {
    const r = verifyJoin(own, pred, facts);
    expect(r.ok).toBe(true);
    expect(r.joined![0].t).toBe(d("2013-01-01"));
    expect(isTruncated(own, "2013-01-01")).toBe(true);
    expect(isTruncated(r.joined!, "2013-01-01")).toBe(false);
  });
  test("refuses a jump at the join, a gap, a wrong start, and a since-launch mismatch", () => {
    expect(
      verifyJoin(
        own,
        pred.map((p) => ({ ...p, v: p.v * 1.3 })),
        facts,
      ).reason,
    ).toMatch(/jumps/);
    expect(
      verifyJoin(
        own,
        pred.filter((p) => p.t < d("2022-10-01")),
        facts,
      ).ok,
    ).toBe(false);
    expect(
      verifyJoin(
        own,
        pred.filter((p) => p.t >= d("2016-01-01")),
        facts,
      ).reason,
    ).toMatch(/launch/);
    expect(verifyJoin(own, pred, { ...facts, inception: 12 }).reason).toMatch(
      /Since-launch/,
    );
    expect(verifyJoin(own, pred, { ...facts, inception: null }).ok).toBe(false);
  });
  test("refuses when 3Y or 5Y disagree even if since-launch matches", () => {
    expect(verifyJoin(own, pred, { ...facts, r5y: 9 }).reason).toMatch(/5Y/);
  });
});

describe("nameWords", () => {
  test("treats mid cap, mid-cap and midcap alike", () => {
    expect(nameWords("HSBC Mid Cap Fund")).toEqual(
      nameWords("HSBC Midcap Fund"),
    );
    expect(nameWords("L&T Mid-Cap Fund - Direct Plan - Growth")).toContain(
      "midcap",
    );
  });
});
