// Test-only stub for SvelteKit's `$env/static/private` virtual module.
// Aliased in vitest.config.ts so server modules can be imported under test
// without the real SvelteKit env machinery. Values are dummies — tests that
// care about behaviour mock the modules that consume these.
export const AUTH_SECRET = "test-secret";
export const AUTH_GOOGLE_ID = "test-google-id";
export const AUTH_GOOGLE_SECRET = "test-google-secret";
export const PMP_BASE_URL = "http://pmp.test";
export const PMP_USERNAME = "test-user";
export const PMP_PASSWORD = "test-pass";
