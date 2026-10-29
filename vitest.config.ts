import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Same path aliases as tsconfig.json, so sync and lib code can be tested as they are written.
const dir = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@/": dir("./src/"),
      "@drizzle/": dir("./drizzle/"),
      "@scripts/": dir("./scripts/"),
    },
  },
});
