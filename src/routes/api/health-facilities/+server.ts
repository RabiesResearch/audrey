import { json, type RequestHandler } from "@sveltejs/kit";
import {
  getUserAllowedRegions,
  getVaccineStockByFacility,
} from "$lib/server/pmp";

// { tangis_facility_id: has_vaccine_stock } from PMP, region-scoped, server-side
// (PMP creds and out-of-region data never reach the browser).
export const GET: RequestHandler = async ({ locals, fetch }) => {
  try {
    const session = await locals.auth();
    if (!session?.user?.email) {
      return json(
        { success: false, error: "Unauthorized", data: {} },
        { status: 401 },
      );
    }

    // Resolve the caller's regions directly (session-derived, not spoofable).
    // DEV-empty = unrestricted (mirrors /api/user-regions); prod-empty stays
    // fail-closed (no regions → no facilities).
    const allowedRegions = await getUserAllowedRegions(
      session.user.email,
      fetch,
    );
    const allowedRegionIDs = allowedRegions.map((r) => r.id);
    const regionFilter =
      import.meta.env.DEV && allowedRegionIDs.length === 0
        ? null
        : allowedRegionIDs;

    const stockByFacility = await getVaccineStockByFacility(
      fetch,
      regionFilter,
    );
    if (stockByFacility === null) {
      // PMP unavailable → signal failure so the client fails open.
      return json(
        { success: false, error: "Vaccine stock unavailable", data: {} },
        { status: 502 },
      );
    }

    return json({
      success: true,
      data: stockByFacility,
      count: Object.keys(stockByFacility).length,
    });
  } catch (error) {
    console.error("Failed to fetch vaccine stock from PMP:", error);

    return json(
      {
        success: false,
        error: `Failed to fetch vaccine stock: ${error instanceof Error ? error.message : "Unknown error"}`,
        data: {},
      },
      { status: 500 },
    );
  }
};
