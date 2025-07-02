import type { LayoutServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";

export const load: LayoutServerLoad = async ({ fetch, url, locals }) => {
  // Check if user is authenticated
  const session = await locals.auth();
  
  // If not authenticated and not on login page, redirect to login
  if (!session?.user && url.pathname !== "/login") {
    throw redirect(302, "/login");
  }
  
  // If authenticated and on login page, redirect to dashboard
  if (session?.user && url.pathname === "/login") {
    throw redirect(302, "/");
  }

  // If on login page, just return session data without loading dashboard data
  if (url.pathname === "/login") {
    return {
      session,
      allRegionsAndDistricts: [],
      availableMonths: [],
      initialSelectedMonth: new Date().toISOString().slice(0, 7),
    };
  }

  try {
    // Call the API endpoint directly with absolute URL
    const response = await fetch(`${url.origin}/api/monthly-tz`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch data");
    }

    const rows = result.data;

    // Process data to get regions and districts
    const seen = new Set<string>();
    const allRegionsAndDistricts = [];
    for (const row of rows) {
      const regionName = row.region_name?.trim();
      const regionID = row.tangis_region_id?.trim();
      const districtName = row.district_council_name?.trim();
      const districtID = row.tangis_district_council_id?.trim();
      if (regionName && districtName) {
        const key = regionName + "|" + districtName;
        if (!seen.has(key)) {
          seen.add(key);
          allRegionsAndDistricts.push({
            regionID,
            regionName,
            districtID,
            districtName,
          });
        }
      }
    }

    // Process data to get available months
    const parseReportMonth = (reportMonth: string): string | null => {
      if (!reportMonth) return null;
      const match = reportMonth.match(/\((\d+)\/(\d+)\)/);
      if (!match) return null;
      const month = match[1].padStart(2, "0");
      const year = match[2];
      return `${year}-${month}`;
    };

    const months = rows
      .map((row: { tally_report_month: string }) => row.tally_report_month)
      .filter(Boolean);
    const availableMonths = Array.from(new Set(months.map(parseReportMonth)))
      .filter((month): month is string => month !== null)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    return {
      session,
      allRegionsAndDistricts,
      availableMonths,
      initialSelectedMonth:
        availableMonths[0] || new Date().toISOString().slice(0, 7),
    };
  } catch (error) {
    console.error("Error loading server-side data:", error);
    // Return empty data as fallback - components can handle loading client-side
    return {
      session: null,
      allRegionsAndDistricts: [],
      availableMonths: [],
      initialSelectedMonth: new Date().toISOString().slice(0, 7),
    };
  }
};
