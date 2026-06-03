import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { get } from "svelte/store";
import { allowedRegionIDs, loadAllowedRegions } from "./userRegions";

// Regression: the shared region-whitelist loader must fail CLOSED. A broken
// /api/user-regions response (HTTP error, network error, malformed body) must
// leave the store at [] (show nothing), never null (which means "all regions").
// It must also dedupe concurrent callers into a single fetch.
function res(body: unknown, ok = true): Response {
  return {
    ok,
    status: ok ? 200 : 500,
    json: async () => body,
  } as unknown as Response;
}

describe("userRegions store — loadAllowedRegions", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    allowedRegionIDs.set([]); // reset shared store between cases
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps regions to their IDs", async () => {
    fetchMock.mockResolvedValue(
      res({ isAllRegions: false, regions: [{ regionID: "R-MT" }] }),
    );
    await loadAllowedRegions();
    expect(get(allowedRegionIDs)).toEqual(["R-MT"]);
  });

  it("sets null (no restriction) when isAllRegions is true", async () => {
    fetchMock.mockResolvedValue(res({ isAllRegions: true, regions: [] }));
    await loadAllowedRegions();
    expect(get(allowedRegionIDs)).toBeNull();
  });

  it("fails closed ([]) on an HTTP error", async () => {
    fetchMock.mockResolvedValue(res({}, false));
    await loadAllowedRegions();
    expect(get(allowedRegionIDs)).toEqual([]);
  });

  it("fails closed ([]) on a network error", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    await loadAllowedRegions();
    expect(get(allowedRegionIDs)).toEqual([]);
  });

  it("fails closed ([]) when the regions array is missing", async () => {
    fetchMock.mockResolvedValue(res({ isAllRegions: false }));
    await loadAllowedRegions();
    expect(get(allowedRegionIDs)).toEqual([]);
  });

  it("dedupes concurrent callers into a single fetch", async () => {
    fetchMock.mockResolvedValue(
      res({ isAllRegions: false, regions: [{ regionID: "R-MT" }] }),
    );
    await Promise.all([loadAllowedRegions(), loadAllowedRegions()]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
