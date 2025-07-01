import { type MonthlyDataRow } from "$lib/stores/uiStore";
import { fetchMonthlyData } from "$data/liveDB";
// import { fetchMonthlyData as fetchMockData } from "$data/mockDB";

// types
export type FacilityInfo = {
  regionID: string;
  regionName: string;
  districtID: string;
  districtName: string; // TODO all of these are technically district council names
  facilityID: string;
  facilityName: string;
  uniquePatients: number;
  vaccineVialStock: number;
};

export type RegionCasesStockData = {
  regionID: string;
  regionName: string;
  districtID?: string;
  districtName?: string;
  facilityID?: string;
  facilityName?: string;
  uniquePatients: number;
  vaccineStock: number;
};

export type RegionAndDistrict = {
  regionID: string;
  regionName: string;
  districtID: string;
  districtName: string;
};

export type CompletenessData = {
  id: string | null;
  regionID: string | null;
  regionName: string | null;
  districtID: string | null;
  districtName: string | null;
  facilityID: string | null;
  facilityName: string | null;
  monthlyCompleteness: { [month: string]: number | boolean };
  children?: CompletenessData[];
};

// Utility to load and parse the CSV file (mock API)

// Example: get all regions (unique by region_name)
export async function getRegionsFromMonthlyData() {
  const rows = await fetchMonthlyData();
  const regions = Array.from(new Set(rows.map((r) => r.region_name))).map(
    (regionName) => {
      return {
        name: regionName,
        // Add more aggregation as needed
      };
    },
  );
  return regions;
}

/**
 * Get summary info for a facility by tangis_facility_id from the monthly CSV.
 * Returns the most recent record for the facility (by SubmissionDate).
 */
export async function getFacilityInfoById(
  tangis_facility_id: string,
): Promise<FacilityInfo | null> {
  const rows = await fetchMonthlyData();
  // Filter for the facility
  const facilityRows = rows.filter(
    (row: MonthlyDataRow) => row.tangis_facility_id === tangis_facility_id,
  );
  if (!facilityRows.length) return null;
  const firstValidRow = facilityRows[0];
  return {
    facilityID: firstValidRow.tangis_facility_id,
    facilityName: firstValidRow.facility_name,
    uniquePatients: Number(firstValidRow.tally_total_patients ?? 0),
    vaccineVialStock: Number(firstValidRow.tally_total_vials ?? 0),
    regionID: firstValidRow.tangis_region_id,
    regionName: firstValidRow.region_name,
    districtID: firstValidRow.tangis_district_council_id,
    districtName: firstValidRow.district_council_name,
  };
}

/**
 * Get a list of health facilities for the selected region and district.
 * @param regionID - The selected region ID
 * @param districtID - The selected district ID
 * Returns an array of tangis_facility_id
 */
export async function getFacilitiesByRegionDistrict(
  regionID: string | null,
  districtID: string | null,
) {
  const rows = await fetchMonthlyData();
  // Filter for region and (optionally) district using IDs
  const facilities = rows.filter(
    (row: MonthlyDataRow) =>
      (regionID == null || row.tangis_region_id === regionID) &&
      (districtID == null || row.tangis_district_council_id === districtID),
  );
  // Get unique tangis_facility_id only
  const uniqueIds = Array.from(
    new Set(facilities.map((row: MonthlyDataRow) => row.tangis_facility_id)),
  );
  return uniqueIds.filter(Boolean); // Remove empty/null ids
}

async function getUniqueTanGisRegionIds() {
  const rows = await fetchMonthlyData();
  const regions = rows.map((row) => ({
    tangis_region_id: row.tangis_region_id,
    region_name: row.region_name,
  }));
  // Get unique tangis_region_id only
  const uniqueIds = regions.filter(
    (e, i) =>
      regions.findIndex((a) => a.tangis_region_id === e.tangis_region_id) === i,
  );
  return uniqueIds;
}

async function getUniqueTanGisDistrictIds(regionName: string) {
  const rows = await fetchMonthlyData();
  const districts = rows
    .map((row) => {
      if (row.region_name === regionName) {
        return {
          tangis_region_id: row.tangis_region_id,
          region_name: row.region_name,
          tangis_district_council_id: row.tangis_district_council_id,
          district_council_name: row.district_council_name,
        };
      }
      return null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null); // Filter out null values with type guard
  // Get unique tangis_district_council_id only
  const uniqueIds = districts.filter(
    (e, i) =>
      districts.findIndex(
        (a) => a.tangis_district_council_id === e.tangis_district_council_id,
      ) === i,
  );
  return uniqueIds;
}

// Helper function to convert "MMM (M/YYYY)" format to "YYYY-MM" format
const parseReportMonth = (reportMonth: string): string | null => {
  if (!reportMonth) return null;

  // Extract month number and year from "Apr (4/2025)" format
  const match = reportMonth.match(/\((\d+)\/(\d+)\)/);
  if (!match) return null;

  const month = match[1].padStart(2, "0");
  const year = match[2];
  return `${year}-${month}`;
};

export async function getAvailableMonths() {
  const rows = await fetchMonthlyData();
  const months = rows.map((row) => row.tally_report_month).filter(Boolean);
  const availableMonths = Array.from(new Set(months.map(parseReportMonth)))
    .filter((month): month is string => month !== null) // Filter out null values
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); // Sort by date
  return availableMonths;
}

/**
 * Get the total number of patients seen and total vaccine vials in stock
 * Returns an array of RegionCasesStockData objects, always grouped by region, district, or facility as appropriate.
 * @param regionID - The selected region ID
 * @param districtID - The selected district ID
 * @param selectedMonth - The selected month in YYYY-MM format (e.g., "2025-04")
 */
export async function getPatientAndStockNumbers(
  regionID: string | null,
  districtID: string | null,
  selectedMonth: string | null = null,
): Promise<Array<RegionCasesStockData>> {
  const rows = await fetchMonthlyData();
  const regionIds = await getUniqueTanGisRegionIds();

  // Filter rows by selected month if provided
  let filteredRows = rows;
  if (selectedMonth) {
    filteredRows = rows.filter((row) => {
      const rowMonth = parseReportMonth(row.tally_report_month);
      return rowMonth === selectedMonth;
    });
  }

  let districtIds: Array<{
    tangis_region_id: string;
    region_name: string;
    tangis_district_council_id: string;
    district_council_name: string;
  }> = [];

  if (regionID) {
    // Find region name from ID to use with getUniqueTanGisDistrictIds
    const regionObj = regionIds.find((r) => r.tangis_region_id === regionID);
    if (regionObj) {
      districtIds = await getUniqueTanGisDistrictIds(regionObj.region_name);
    }
  }

  if (!regionID && !districtID) {
    // Group by region
    const regions = Array.from(new Set(filteredRows.map((r) => r.region_name)));
    return regions.map((region) => {
      const regionRows = filteredRows.filter(
        (row) => row.region_name === region,
      );
      let uniquePatients = 0;
      let vaccineStock = 0;
      for (const row of regionRows) {
        uniquePatients += Number(row.tally_total_patients ?? 0);
        vaccineStock += Number(row.tally_total_vials ?? 0);
      }
      return {
        regionID: regionIds.find((r) => r.region_name === region)
          ?.tangis_region_id as string,
        regionName: region as string,
        uniquePatients,
        vaccineStock,
      };
    });
  } else if (regionID && !districtID) {
    // Group by district within the region - but now we filter by region ID
    const regionObj = regionIds.find((r) => r.tangis_region_id === regionID);
    if (!regionObj) return [];

    const regionName = regionObj.region_name;
    const districts = Array.from(
      new Set(
        filteredRows
          .filter((r) => r.tangis_region_id === regionID)
          .map((r) => r.district_council_name),
      ),
    );

    return districts.map((district) => {
      const districtRows = filteredRows.filter(
        (row) =>
          row.tangis_region_id === regionID &&
          row.district_council_name === district,
      );
      let uniquePatients = 0;
      let vaccineStock = 0;
      for (const row of districtRows) {
        uniquePatients += Number(row.tally_total_patients ?? 0);
        vaccineStock += Number(row.tally_total_vials ?? 0);
      }
      return {
        regionID: regionID,
        regionName: regionName as string,
        districtID: districtIds.find(
          (r) => r.district_council_name === district,
        )?.tangis_district_council_id as string,
        districtName: district as string,
        uniquePatients,
        vaccineStock,
      };
    });
  } else if (regionID && districtID) {
    // Group by facility within the district - filter by region ID and district ID
    const regionObj = regionIds.find((r) => r.tangis_region_id === regionID);
    if (!regionObj) return [];

    const regionName = regionObj.region_name;
    const districtObj = districtIds.find(
      (d) => d.tangis_district_council_id === districtID,
    );
    if (!districtObj) return [];

    const districtName = districtObj.district_council_name;

    // Get ALL facilities in this district (without month filtering)
    // This ensures we include facilities with zero values that didn't report
    const allFacilities = Array.from(
      new Set(
        rows
          .filter(
            (r) =>
              r.tangis_region_id === regionID &&
              r.tangis_district_council_id === districtID,
          )
          .map((r) => r.facility_name),
      ),
    );

    return allFacilities.map((facility) => {
      // Now filter by month AND facility for aggregation
      const facilityRows = filteredRows.filter(
        (row) =>
          row.tangis_region_id === regionID &&
          row.tangis_district_council_id === districtID &&
          row.facility_name === facility,
      );
      let uniquePatients = 0;
      let vaccineStock = 0;
      for (const row of facilityRows) {
        uniquePatients += Number(row.tally_total_patients ?? 0);
        vaccineStock += Number(row.tally_total_vials ?? 0);
      }
      return {
        regionID: regionID,
        regionName: regionName as string,
        districtID: districtID,
        districtName: districtName as string,
        facilityName: facility as string,
        uniquePatients,
        vaccineStock,
      };
    });
  }
  return [];
}

let allRegionsAndDistrictsCache: RegionAndDistrict[] | null = null;

export async function getAllRegionsAndDistricts(): Promise<
  RegionAndDistrict[]
> {
  if (allRegionsAndDistrictsCache) return allRegionsAndDistrictsCache;
  const rows = await fetchMonthlyData();
  const seen = new Set<string>();
  const result: RegionAndDistrict[] = [];
  for (const row of rows) {
    const regionName = row.region_name?.trim();
    const regionID = row.tangis_region_id?.trim();
    const districtName = row.district_council_name?.trim();
    const districtID = row.tangis_district_council_id?.trim();
    if (regionName && districtName) {
      const key = regionName + "|" + districtName;
      if (!seen.has(key)) {
        seen.add(key);
        result.push({ regionID, regionName, districtID, districtName });
      }
    }
  }
  allRegionsAndDistrictsCache = result;
  return result;
}

/**
 * Get completeness data for facilities, districts, and regions for the past 12 months
 * Returns hierarchical data with monthly completeness values
 */
export async function getCompletenessData(
  regionID: string | null = null,
  districtID: string | null = null,
): Promise<CompletenessData[]> {
  const rows = await fetchMonthlyData();

  // Generate last 12 months from current date (same logic as frontend)
  const now = new Date();
  const last12Months: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    last12Months.push(monthKey);
  }

  // Create a map to track which facilities reported in which months
  const facilityReports = new Map<string, Set<string>>();

  for (const row of rows) {
    const month = parseReportMonth(row.tally_report_month);
    if (month && last12Months.includes(month)) {
      const facilityId = row.tangis_facility_id;
      if (!facilityReports.has(facilityId)) {
        facilityReports.set(facilityId, new Set());
      }
      facilityReports.get(facilityId)!.add(month);
    }
  }

  // Get all unique facilities that match the filter criteria
  const filteredRows = rows.filter(
    (row: MonthlyDataRow) =>
      (regionID == null || row.tangis_region_id === regionID) &&
      (districtID == null || row.tangis_district_council_id === districtID),
  );

  const facilityMap = new Map<
    string,
    {
      facilityID: string;
      facilityName: string;
      regionID: string;
      regionName: string;
      districtID: string;
      districtName: string;
    }
  >();

  // Collect unique facilities
  for (const row of filteredRows) {
    if (!facilityMap.has(row.tangis_facility_id)) {
      facilityMap.set(row.tangis_facility_id, {
        facilityID: row.tangis_facility_id,
        facilityName: row.facility_name,
        regionID: row.tangis_region_id,
        regionName: row.region_name,
        districtID: row.tangis_district_council_id,
        districtName: row.district_council_name,
      });
    }
  }

  // Build hierarchical structure
  const result: CompletenessData[] = [];
  const regionMap = new Map<string, CompletenessData>();
  const districtMap = new Map<string, CompletenessData>();

  for (const facility of facilityMap.values()) {
    // Create facility completeness data
    const facilityCompleteness: { [month: string]: boolean } = {};
    const facilityReportSet =
      facilityReports.get(facility.facilityID) || new Set();

    for (const month of last12Months) {
      facilityCompleteness[month] = facilityReportSet.has(month);
    }

    const facilityData: CompletenessData = {
      id: facility.facilityID,
      regionID: null,
      regionName: null,
      districtID: null,
      districtName: null,
      facilityID: facility.facilityID,
      facilityName: facility.facilityName,
      monthlyCompleteness: facilityCompleteness,
    };

    // Get or create district
    const districtKey = `${facility.regionID}-${facility.districtID}`;
    let districtData = districtMap.get(districtKey);
    if (!districtData) {
      districtData = {
        id: null,
        regionID: null,
        regionName: null,
        districtID: facility.districtID,
        districtName: facility.districtName,
        facilityID: null,
        facilityName: null,
        monthlyCompleteness: {},
        children: [],
      };
      districtMap.set(districtKey, districtData);
    }
    districtData.children!.push(facilityData);

    // Get or create region
    let regionData = regionMap.get(facility.regionID);
    if (!regionData) {
      regionData = {
        id: null,
        regionID: facility.regionID,
        regionName: facility.regionName,
        districtID: null,
        districtName: null,
        facilityID: null,
        facilityName: null,
        monthlyCompleteness: {},
        children: [],
      };
      regionMap.set(facility.regionID, regionData);
      result.push(regionData);
    }

    // Add district to region if not already there
    if (
      !regionData.children!.find((d) => d.districtID === facility.districtID)
    ) {
      regionData.children!.push(districtData);
    }
  }

  // Calculate district and region completeness percentages
  for (const regionData of result) {
    for (const month of last12Months) {
      let totalFacilities = 0;
      let reportingFacilities = 0;

      for (const districtData of regionData.children!) {
        let districtTotal = 0;
        let districtReporting = 0;

        for (const facilityData of districtData.children!) {
          districtTotal++;
          if (facilityData.monthlyCompleteness[month]) {
            districtReporting++;
          }
        }

        totalFacilities += districtTotal;
        reportingFacilities += districtReporting;

        // Calculate district percentage
        districtData.monthlyCompleteness[month] =
          districtTotal > 0
            ? Math.round((districtReporting / districtTotal) * 100)
            : 0;
      }

      // Calculate region percentage
      regionData.monthlyCompleteness[month] =
        totalFacilities > 0
          ? Math.round((reportingFacilities / totalFacilities) * 100)
          : 0;
    }
  }

  return result;
}
