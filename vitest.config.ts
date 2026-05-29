import { defineConfig } from "vitest/config";

// Minimal Vitest setup. Server-side unit tests run in the node environment.
// We deliberately avoid the SvelteKit Vite plugin here so tests don't need the
// full $env / app machinery — units under test use relative imports and mock
// their dependencies.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.ts"],
  },
});
