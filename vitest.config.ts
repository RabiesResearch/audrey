import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Minimal Vitest setup. Server-side unit tests run in the node environment.
// Aliases let tests import modules that use SvelteKit's `$lib` and the
// server-only `$env/static/private` virtual module:
//   - `$lib`                  → real source under src/lib
//   - `$env/static/private`   → a test stub (real secrets never needed in tests)
const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      $lib: r("./src/lib"),
      "$env/static/private": r("./src/test/env-static-private.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.ts"],
  },
});
