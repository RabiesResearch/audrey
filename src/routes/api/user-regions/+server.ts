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
    const allowedRegionsRaw = await getUserAllowedRegions(
      session.user.email,
      fetch,
    );
    const allowedRegionIDs = allowedRegionsRaw.map((item) => item.id);
    console.log("[API] Allowed region IDs from PMP:", allowedRegionIDs);

    // Get all regions and districts to match names with IDs
    const allRegionsAndDistricts = await getAllRegionsAndDistricts(fetch);

    // In development mode or if PMP returns empty, return all regions
    if (allowedRegionIDs.length === 0) {
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

    const allowedRegions = new Map();
    allRegionsAndDistricts.forEach((item) => {
      if (allowedRegionIDs.includes(item.regionID)) {
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
    console.log("[API] Final allowed regions to return:", result);
    return json(result);
  } catch (error) {
    console.error("[API] Error fetching user regions:", error);
    return json({ error: "Failed to fetch user regions" }, { status: 500 });
  }
};
