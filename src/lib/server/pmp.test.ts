import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isEmailWhitelisted } from "./pmp";

// Regression test for the 2-minute whitelist cache. This is what bounds how
// quickly a PMP revocation takes effect: the whitelist must be fetched once,
// served from cache within the TTL, and re-fetched after it expires. If the
// TTL logic regressed (e.g. never refetching), revocation would silently never
// take effect — the inverse of the bug this PR fixes.
const TTL_MS = 2 * 60 * 1000;

describe("isEmailWhitelisted — 2-minute cache", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    // Mock both PMP calls: the login (token) and the whitelist fetch.
    fetchMock = vi.fn(async (url: string) => {
      if (String(url).includes("/security/login")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ access_token: "t", refresh_token: "r" }),
        } as unknown as Response;
      }
      return {
        ok: true,
        status: 200,
        json: async () => [{ email: "a@b.com", active: true }],
      } as unknown as Response;
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  // Count only the whitelist fetches (ignore the login call).
  const whitelistFetches = () =>
    fetchMock.mock.calls.filter((c) => String(c[0]).includes("user_whitelist"))
      .length;

  it("fetches once, serves from cache within the TTL, and refetches after it expires", async () => {
    // First call → cache miss → one whitelist fetch.
    expect(await isEmailWhitelisted("a@b.com")).toBe(true);
    expect(whitelistFetches()).toBe(1);

    // Second call within the TTL → served from cache, no new fetch.
    await isEmailWhitelisted("a@b.com");
    expect(whitelistFetches()).toBe(1);

    // Past the TTL → cache expired → refetch.
    vi.setSystemTime(TTL_MS + 1);
    await isEmailWhitelisted("a@b.com");
    expect(whitelistFetches()).toBe(2);
  });
});
