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
  id: string;
  regionName: string;
  districtName: string;
  facilityName: string;
  uniquePatients: number;
  vaccineVialStock: number;
};

export type RegionCasesStockData = {
  regionName: string;
  districtName?: string;
  facilityName?: string;
  uniquePatients: number;
  vaccineStock: number;
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
    id: firstValidRow.tangis_facility_id,
    facilityName: firstValidRow.facility_name,
    uniquePatients: Number(firstValidRow["tally-total_patients"] ?? 0),
    vaccineVialStock: Number(firstValidRow["tally-total_vials"] ?? 0),
    regionName: firstValidRow.region_name,
    districtName: firstValidRow.district_council_name,
  };
}

/**
 * Get a list of health facilities for the selected region and district.
 * @param regionName - The selected region name (string, e.g. "Mtwara")
 * @param districtName - The selected district name (string, e.g. "Nanyumbu District Council")
 * Returns an array of tangis_facility_id
 */
export async function getFacilitiesByRegionDistrict(
  regionName: string | null,
  districtName: string | null,
) {
  const rows = await fetchMonthlyData();
  // Filter for region and (optionally) district
  const facilities = rows.filter(
    (row: MonthlyDataRow) =>
      (regionName == null || row.region_name === regionName) &&
      (districtName == null || row.district_council_name === districtName),
  );
  // Get unique tangis_facility_id only
  const uniqueIds = Array.from(
    new Set(facilities.map((row: MonthlyDataRow) => row.tangis_facility_id)),
  );
  return uniqueIds.filter(Boolean); // Remove empty/null ids
}

/**
 * Get the total number of patients seen and total vaccine vials in stock
 * Returns an array of RegionCasesStockData objects, always grouped by region, district, or facility as appropriate.
 */
export async function getPatientAndStockNumbers(
  regionName: string | null,
  districtName: string | null,
): Promise<Array<RegionCasesStockData>> {
  const rows = await fetchMonthlyData();

  if (!regionName && !districtName) {
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
        regionName: region as string,
        uniquePatients,
        vaccineStock,
      };
    });
  } else if (regionName && !districtName) {
    // Group by district within the region
    const districts = Array.from(
      new Set(
        rows
          .filter((r) => r.region_name === regionName)
          .map((r) => r.district_council_name),
      ),
    );
    return districts.map((district) => {
      const districtRows = rows.filter(
        (row) =>
          row.region_name === regionName &&
          row.district_council_name === district,
      );
      let uniquePatients = 0;
      let vaccineStock = 0;
      for (const row of districtRows) {
        uniquePatients += Number(row["tally-total_patients"] ?? 0);
        vaccineStock += Number(row["tally-total_vials"] ?? 0);
      }
      return {
        regionName: regionName as string,
        districtName: district as string,
        uniquePatients,
        vaccineStock,
      };
    });
  } else if (regionName && districtName) {
    // Group by facility within the district
    const facilities = Array.from(
      new Set(
        rows
          .filter(
            (r) =>
              r.region_name === regionName &&
              r.district_council_name === districtName,
          )
          .map((r) => r.facility_name),
      ),
    );
    return facilities.map((facility) => {
      const facilityRows = rows.filter(
        (row) =>
          row.region_name === regionName &&
          row.district_council_name === districtName &&
          row.facility_name === facility,
      );
      let uniquePatients = 0;
      let vaccineStock = 0;
      for (const row of facilityRows) {
        uniquePatients += Number(row["tally-total_patients"] ?? 0);
        vaccineStock += Number(row["tally-total_vials"] ?? 0);
      }
      return {
        regionName: regionName as string,
        districtName: districtName as string,
        facilityName: facility as string,
        uniquePatients,
        vaccineStock,
      };
    });
  }
  return [];
}
