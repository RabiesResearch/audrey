import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Minimal Vitest setup. Server-side unit tests run in the node environment.
// Aliases mirror svelte.config.js (+ the SvelteKit `$env/static/private`
// virtual module) so source modules can be imported under test without the
// full SvelteKit/Vite plugin machinery:
//   - $lib / $data / $components / $utils → real source under src/lib
//   - $env/static/private                 → a test stub (real secrets unneeded)
const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      $lib: r("./src/lib"),
      $data: r("./src/lib/data"),
      $components: r("./src/lib/components"),
      $utils: r("./src/lib/utils"),
      "$env/static/private": r("./src/test/env-static-private.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.ts"],
  },
});
