// Research: map every fund's ISIN to its AMFI scheme code and cache its full NAV history from mfapi.in.
// Read-only against the database. Writes .cache/navs/<kuvera_code>.json. Run: npx tsx scripts/research/fetch-navs.ts
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import * as fs from "fs";
import { neon } from "@neondatabase/serverless";

const CACHE = ".cache/navs";
const CONCURRENCY = 4;

/** ISIN -> AMFI scheme code, from AMFI's NAVAll.txt (columns: code;isin growth/payout;isin reinvest;name;...). */
function amfiIsinMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of fs
    .readFileSync(".cache/NAVAll.txt", "utf8")
    .split(/\r?\n/)) {
    const cols = line.split(";");
    if (cols.length < 6 || !/^\d+$/.test(cols[0])) continue;
    for (const isin of [cols[1], cols[2]])
      if (/^INF\w{9}$/.test(isin?.trim())) map.set(isin.trim(), cols[0]);
  }
  return map;
}

async function fetchJson(url: string, tries = 4): Promise<unknown> {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (res.ok) return await res.json();
    } catch {}
    await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
  }
  throw new Error("failed " + url);
}

async function main() {
  fs.mkdirSync(CACHE, { recursive: true });
  const sql = neon(process.env.DATABASE_URL!);
  const funds =
    (await sql`select kuvera_code, isin, short_name from funds order by kuvera_code`) as {
      kuvera_code: string;
      isin: string;
      short_name: string;
    }[];
  const isinMap = amfiIsinMap();
  const unmapped = funds.filter((f) => !isinMap.has(f.isin));
  console.log(
    `funds ${funds.length}, mapped ${funds.length - unmapped.length}, unmapped:`,
    unmapped.map((f) => `${f.short_name} ${f.isin}`),
  );

  const todo = funds.filter(
    (f) =>
      isinMap.has(f.isin) && !fs.existsSync(`${CACHE}/${f.kuvera_code}.json`),
  );
  let done = 0,
    failed = 0;
  async function worker() {
    for (let f = todo.shift(); f; f = todo.shift()) {
      const code = isinMap.get(f.isin)!;
      try {
        const data = (await fetchJson(`https://api.mfapi.in/mf/${code}`)) as {
          meta: { isin_growth?: string };
          data: { date: string; nav: string }[];
        };
        fs.writeFileSync(
          `${CACHE}/${f.kuvera_code}.json`,
          JSON.stringify({
            kuveraCode: f.kuvera_code,
            schemeCode: code,
            isin: f.isin,
            metaIsin: data.meta?.isin_growth ?? null,
            data: data.data,
          }),
        );
        done++;
      } catch {
        failed++;
        console.log("FAILED", f.short_name, code);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`fetched ${done}, failed ${failed}`);
}
main();
