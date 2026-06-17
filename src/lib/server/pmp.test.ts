import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isEmailWhitelisted, getVaccineStockByFacility } from "./pmp";

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

// Region scoping happens server-side (null/empty/list convention).
describe("getVaccineStockByFacility — region scoping", () => {
  // Three facilities across two PMP regions.
  const FACILITIES = [
    { id: "f-mt-1", region_id: "R-MT", has_vaccine_stock: true },
    { id: "f-mt-2", region_id: "R-MT", has_vaccine_stock: null },
    { id: "f-mr-1", region_id: "R-MR", has_vaccine_stock: true },
  ];

  beforeEach(() => {
    const fetchMock = vi.fn(async (url: string) => {
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
        json: async () => FACILITIES,
      } as unknown as Response;
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns every facility when allowedRegionIDs is null (unrestricted)", async () => {
    const map = await getVaccineStockByFacility(undefined, null);
    expect(map).not.toBeNull();
    expect(Object.keys(map!).sort()).toEqual(["f-mr-1", "f-mt-1", "f-mt-2"]);
  });

  it("returns only facilities in the allowed regions", async () => {
    const map = await getVaccineStockByFacility(undefined, ["R-MT"]);
    expect(map).not.toBeNull();
    expect(Object.keys(map!).sort()).toEqual(["f-mt-1", "f-mt-2"]);
    // Tri-state preserved within the allowed region.
    expect(map!["f-mt-1"]).toBe(true);
    expect(map!["f-mt-2"]).toBe(null);
  });

  it("returns an empty map when the allowed list is empty (resolved, no regions)", async () => {
    const map = await getVaccineStockByFacility(undefined, []);
    expect(map).toEqual({});
  });

  it("returns null when PMP is unavailable (so callers fail open)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (String(url).includes("/security/login")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ access_token: "t", refresh_token: "r" }),
          } as unknown as Response;
        }
        return { ok: false, status: 500 } as unknown as Response; // PMP down
      }),
    );
    const map = await getVaccineStockByFacility(undefined, null);
    expect(map).toBeNull();
  });
});
