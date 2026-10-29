import { describe, test, expect } from "vitest";
import {
  cleanReturns,
  maskUnearnedReturns,
} from "../scripts/sync/pipeline/transform";

const kuvera = (r: Record<string, number | null>) =>
  cleanReturns({ year_3: null, year_5: null, inception: null, ...r });

describe("maskUnearnedReturns", () => {
  test("drops periods longer than the fund has existed, even when Kuvera sends 0", () => {
    // launched ~1.5 years before the returns date: 3Y and 5Y are Kuvera's 0 placeholder
    const out = maskUnearnedReturns(
      kuvera({ year_3: 0, year_5: 0, inception: 14 }),
      "2025-04-01",
      "2026-10-27",
    );
    expect(out.returns3y).toBeNull();
    expect(out.returns5y).toBeNull();
    expect(out.returnsInception).toBe("14.0000");
  });

  test("keeps every period for an old fund, including a genuine negative", () => {
    const out = maskUnearnedReturns(
      kuvera({ year_3: -3.9, year_5: 9.4 }),
      "2013-01-01",
      "2026-10-27",
    );
    expect([out.returns3y, out.returns5y]).toEqual(["-3.9000", "9.4000"]);
  });

  test("allows a few days of slack around the anniversary", () => {
    const out = maskUnearnedReturns(
      kuvera({ year_3: 5 }),
      "2023-10-30",
      "2026-10-27",
    );
    expect(out.returns3y).toBe("5.0000");
  });

  test("with no start date, an exact zero is treated as missing", () => {
    const out = maskUnearnedReturns(
      kuvera({ year_3: 0, year_5: 8 }),
      null,
      "2026-10-27",
    );
    expect(out.returns3y).toBeNull();
    expect(out.returns5y).toBe("8.0000");
  });
});
