// Research: print Compass Score rankings for every category, with the parts and raw numbers behind them.
// Run: npx tsx scripts/research/rank.ts [category filter]
import { categoryIndex } from "@/lib/metrics/series";
import { fundMetrics, compassScores } from "@/lib/metrics/compass";
import { load } from "./load";

async function main() {
  const { rows, series, lineage } = await load();
  const today = Math.max(...[...series.values()].map((s) => s[s.length - 1].t));
  for (const cat of [...new Set(rows.map((r) => r.fund_category))]
    .sort()
    .filter((c) => !process.argv[2] || c.includes(process.argv[2]))) {
    const members = rows.filter((r) => r.fund_category === cat);
    const inputs = members.map((r) => ({
      code: r.kuvera_code,
      series: series.get(r.kuvera_code)!,
      expenseRatio: r.expense_ratio === null ? null : Number(r.expense_ratio),
    }));
    const index = categoryIndex(inputs.map((i) => i.series));
    const metrics = inputs.map((f) => fundMetrics(f, index, today));
    const scores = compassScores(metrics);
    const t = members
      .map((r, i) => ({ r, m: metrics[i], s: scores[i] }))
      .sort((a, b) => (b.s.score ?? -1) - (a.s.score ?? -1));
    console.log(
      `\n=== ${cat}: ${metrics.filter((m) => m.rated).length} rated of ${members.length}`,
    );
    console.log(
      " #  fund                            score  ret con dwn cst | vs cat  beat%  dncap  worst fall(cat)  yrs   AUM Cr",
    );
    for (const [i, { r, m, s }] of t.entries()) {
      if (!m.rated) {
        console.log(
          `--  ${r.short_name.slice(0, 30).padEnd(30)}  unrated: ${m.unratedReason} (${m.historyYears.toFixed(1)}y)`,
        );
        continue;
      }
      const p = (x: number | null) =>
        x === null ? "  -" : x.toFixed(0).padStart(3);
      console.log(
        `${String(i + 1).padStart(2)}  ${r.short_name.slice(0, 30).padEnd(30)} ${s.score === null ? "   - " : s.score.toFixed(1).padStart(5)}  ${p(s.parts.returns)} ${p(s.parts.consistency)} ${p(s.parts.downside)} ${p(s.parts.cost)} | ${(m.excessReturnRaw! >= 0 ? "+" : "") + m.excessReturnRaw!.toFixed(1)}  ${(m.consistencyRaw! * 100).toFixed(0).padStart(5)}  ${m.downsideCapture === null ? "    -" : m.downsideCapture.toFixed(0).padStart(5)}  ${m.maxDrawdown!.toFixed(0).padStart(5)}% (${m.categoryMaxDrawdown!.toFixed(0)}%)  ${m.historyYears.toFixed(1).padStart(4)}${lineage[r.kuvera_code] ? "*" : " "} ${Number(r.aum).toFixed(0).padStart(7)}`,
      );
    }
  }
}
main();
