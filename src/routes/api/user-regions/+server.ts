import { json, type RequestHandler } from "@sveltejs/kit";
import { getUserAllowedRegions } from "$lib/server/pmp";
import { getAllRegionsAndDistricts } from "$lib/data/api";

export const GET: RequestHandler = async ({ locals }) => {
  try {
    // Check if user is authenticated
    const session = await locals.auth();
    if (!session?.user?.email) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's allowed regions from PMP
    const allowedRegionNames = await getUserAllowedRegions(session.user.email);
    
    // Get all regions and districts to match names with IDs
    const allRegionsAndDistricts = await getAllRegionsAndDistricts();
    
    // In development mode or if PMP returns empty, return all regions
    if (allowedRegionNames.length === 0) {
      // Group by region to avoid duplicates
      const regionsMap = new Map();
      allRegionsAndDistricts.forEach((item) => {
        if (!regionsMap.has(item.regionID)) {
          regionsMap.set(item.regionID, {
            regionID: item.regionID,
            regionName: item.regionName,
            districts: []
          });
        }
        regionsMap.get(item.regionID).districts.push({
          districtID: item.districtID,
          districtName: item.districtName
        });
      });
      
      return json({ 
        regions: Array.from(regionsMap.values()),
        isAllRegions: true 
      });
    }

    // Filter regions based on user's whitelist
    const allowedRegions = new Map();
    allRegionsAndDistricts.forEach((item) => {
      if (allowedRegionNames.includes(item.regionName)) {
        if (!allowedRegions.has(item.regionID)) {
          allowedRegions.set(item.regionID, {
            regionID: item.regionID,
            regionName: item.regionName,
            districts: []
          });
        }
        allowedRegions.get(item.regionID).districts.push({
          districtID: item.districtID,
          districtName: item.districtName
        });
      }
    });

    return json({ 
      regions: Array.from(allowedRegions.values()),
      isAllRegions: false 
    });
  } catch (error) {
    console.error("Error fetching user regions:", error);
    return json(
      { error: "Failed to fetch user regions" },
      { status: 500 }
    );
  }
};