import { writable } from "svelte/store";

// The user's PMP-allowed region IDs.
//   - `null`            → no restriction (admin / unrestricted user)
//   - empty array `[]`  → user can see no regions (also the fail-closed default)
//   - non-empty array   → user can see only these region IDs
export const allowedRegionIDs = writable<string[] | null>([]);

type UserRegionsResponse = {
  regions: { regionID: string; regionName: string }[];
  isAllRegions: boolean;
};

// Cache the in-flight (or completed) load promise rather than a boolean, so
// concurrent callers all await the SAME fetch. A boolean guard would let a
// second caller return before the first fetch resolved, reading the default
// empty store and showing nothing.
let loadPromise: Promise<void> | null = null;

// Fetches the current user's allowed regions from /api/user-regions and writes
// the result into the shared `allowedRegionIDs` store. Safe to call from
// multiple components — only the first call hits the network; every caller
// awaits the same fetch and therefore sees the resolved value.
export function loadAllowedRegions(): Promise<void> {
  if (!loadPromise) {
    // Clear the cached promise once it settles. Concurrent callers still share
    // the single in-flight fetch, but a later mount (or a retry after a
    // transient PMP failure) can fetch again instead of being stuck forever at
    // the fail-closed default.
    loadPromise = doLoadAllowedRegions().finally(() => {
      loadPromise = null;
    });
  }
  return loadPromise;
}

async function doLoadAllowedRegions(): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/user-regions");
  } catch (err) {
    console.error("[userRegions] network error:", err);
    allowedRegionIDs.set([]);
    return;
  }

  if (!response.ok) {
    console.error("[userRegions] HTTP error:", response.status);
    allowedRegionIDs.set([]);
    return;
  }

  let json: UserRegionsResponse;
  try {
    json = (await response.json()) as UserRegionsResponse;
  } catch (err) {
    console.error("[userRegions] parse error:", err);
    allowedRegionIDs.set([]);
    return;
  }

  if (json.isAllRegions) {
    allowedRegionIDs.set(null);
    return;
  }

  if (!Array.isArray(json.regions)) {
    console.error("[userRegions] response missing regions[]");
    allowedRegionIDs.set([]);
    return;
  }

  allowedRegionIDs.set(json.regions.map((r) => r.regionID));
}
