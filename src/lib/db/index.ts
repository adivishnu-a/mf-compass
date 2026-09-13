import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "@drizzle/schema";

type Db = NeonHttpDatabase<typeof schema>;

let client: Db | undefined;

function getDb(): Db {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    client = drizzle(neon(url), { schema });
  }
  return client;
}

// Connects on first query rather than at import, so `next build` can collect
// page data without credentials (CI) and callers keep their own fallbacks.
export const db = new Proxy({} as Db, {
  get(_target, prop) {
    const value = Reflect.get(getDb(), prop);
    return typeof value === "function" ? value.bind(getDb()) : value;
  },
});
