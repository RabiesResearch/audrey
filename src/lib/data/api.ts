import Papa from "papaparse";

// types
type MonthlyDataRow = {
  tangis_facility_id: string;
  region_name: string;
  district_council_name: string;
  facility_name: string;
  tally_total_patients: string;
  tally_total_vials: string;
  submission_date: string;
  [key: string]: string;
};

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

// Utility to load and parse the CSV file (mock API)
export async function fetchMonthlyData() {
  // Use a public path so Vite can serve the file from the static directory
  const response = await fetch("/monthly_tz_202505121436.csv");
  const csvText = await response.text();
  const { data, errors } = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });
  if (errors.length) {
    throw new Error("CSV parse error: " + JSON.stringify(errors));
  }
  return data as MonthlyDataRow[];
}

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
    uniquePatients: Number(firstValidRow["tally-total_patients"] ?? 0),
    vaccineVialStock: Number(firstValidRow["tally-total_vials"] ?? 0),
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
    .filter(Boolean); // Filter out null values
  // Get unique tangis_district_council_id only
  const uniqueIds = districts
    .filter(Boolean) // Remove empty/null ids
    .filter(
      (e, i) =>
        districts.findIndex(
          (a) => a.tangis_district_council_id === e.tangis_district_council_id,
        ) === i,
    );
  return uniqueIds;
}

/**
 * Get the total number of patients seen and total vaccine vials in stock
 * Returns an array of RegionCasesStockData objects, always grouped by region, district, or facility as appropriate.
 * @param regionID - The selected region ID 
 * @param districtID - The selected district ID
 */
export async function getPatientAndStockNumbers(
  regionID: string | null,
  districtID: string | null,
): Promise<Array<RegionCasesStockData>> {
  const rows = await fetchMonthlyData();
  const regionIds = await getUniqueTanGisRegionIds();
  let districtIds = [];
  
  if (regionID) {
    // Find region name from ID to use with getUniqueTanGisDistrictIds
    const regionObj = regionIds.find(r => r.tangis_region_id === regionID);
    if (regionObj) {
      districtIds = await getUniqueTanGisDistrictIds(regionObj.region_name);
    }
  }

  if (!regionID && !districtID) {
    // Group by region
    const regions = Array.from(new Set(rows.map((r) => r.region_name)));
    return regions.map((region) => {
      const regionRows = rows.filter((row) => row.region_name === region);
      let uniquePatients = 0;
      let vaccineStock = 0;
      for (const row of regionRows) {
        uniquePatients += Number(row["tally-total_patients"] ?? 0);
        vaccineStock += Number(row["tally-total_vials"] ?? 0);
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
    const regionObj = regionIds.find(r => r.tangis_region_id === regionID);
    if (!regionObj) return [];
    
    const regionName = regionObj.region_name;
    const districts = Array.from(
      new Set(
        rows
          .filter((r) => r.tangis_region_id === regionID)
          .map((r) => r.district_council_name),
      ),
    );
    
    return districts.map((district) => {
      const districtRows = rows.filter(
        (row) =>
          row.tangis_region_id === regionID &&
          row.district_council_name === district,
      );
      let uniquePatients = 0;
      let vaccineStock = 0;
      for (const row of districtRows) {
        uniquePatients += Number(row["tally-total_patients"] ?? 0);
        vaccineStock += Number(row["tally-total_vials"] ?? 0);
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
    const regionObj = regionIds.find(r => r.tangis_region_id === regionID);
    if (!regionObj) return [];
    
    const regionName = regionObj.region_name;
    const districtObj = districtIds.find(d => d.tangis_district_council_id === districtID);
    if (!districtObj) return [];
    
    const districtName = districtObj.district_council_name;
    
    const facilities = Array.from(
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
    
    return facilities.map((facility) => {
      const facilityRows = rows.filter(
        (row) =>
          row.tangis_region_id === regionID &&
          row.tangis_district_council_id === districtID &&
          row.facility_name === facility,
      );
      let uniquePatients = 0;
      let vaccineStock = 0;
      for (const row of facilityRows) {
        uniquePatients += Number(row["tally-total_patients"] ?? 0);
        vaccineStock += Number(row["tally-total_vials"] ?? 0);
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
