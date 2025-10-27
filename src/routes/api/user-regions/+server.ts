import { json, type RequestHandler } from "@sveltejs/kit";
import { getUserAllowedRegions } from "$lib/server/pmp";
import { getAllRegionsAndDistricts } from "$lib/data/api";

export const GET: RequestHandler = async ({ locals, fetch }) => {
  // Endpoint called
  try {
    // Check if user is authenticated
    const session = await locals.auth();
    if (!session?.user?.email) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's allowed regions from PMP
    let allowedRegionNames = await getUserAllowedRegions(
      session.user.email,
      fetch,
    );
    // If the result is an array of objects, map to names

    // Get all regions and districts to match names with IDs
    const allRegionsAndDistricts = await getAllRegionsAndDistricts(fetch);

    // In development mode or if PMP returns empty, return all regions
    if (allowedRegionNames.length === 0) {
      // Group by region to avoid duplicates
      const regionsMap = new Map();
      allRegionsAndDistricts.forEach((item) => {
        if (!regionsMap.has(item.regionID)) {
          regionsMap.set(item.regionID, {
            regionID: item.regionID,
            regionName: item.regionName,
            districts: [],
          });
        }
        regionsMap.get(item.regionID).districts.push({
          districtID: item.districtID,
          districtName: item.districtName,
        });
      });

      const result = {
        regions: Array.from(regionsMap.values()),
        isAllRegions: true,
      };
      return json(result);
    }

    // Log all region names for debugging
    // Normalize names for comparison
    const normalizedAllowed = allowedRegionNames.map((n) =>
      n.toLowerCase().trim(),
    );
    const allowedRegions = new Map();
    allRegionsAndDistricts.forEach((item) => {
      const normalizedRegion = item.regionName.toLowerCase().trim();
      if (normalizedAllowed.includes(normalizedRegion)) {
        if (!allowedRegions.has(item.regionID)) {
          allowedRegions.set(item.regionID, {
            regionID: item.regionID,
            regionName: item.regionName,
            districts: [],
          });
        }
        allowedRegions.get(item.regionID).districts.push({
          districtID: item.districtID,
          districtName: item.districtName,
        });
      }
    });

    const result = {
      regions: Array.from(allowedRegions.values()),
      isAllRegions: false,
    };
    return json(result);
  } catch (error) {
    console.error("[API] Error fetching user regions:", error);
    return json({ error: "Failed to fetch user regions" }, { status: 500 });
  }
};
