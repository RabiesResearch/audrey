import Papa from "papaparse";

// types
export type FacilityInfo = {
  id: string;
  regionName: string;
  districtName: string;
  facilityName: string;
  uniquePatients: number;
  vaccineVialStock: number;
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
  return data;
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
  const response = await fetch("/monthly_tz_202505121436.csv");
  const csvText = await response.text();
  const { data, errors } = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });
  if (errors.length)
    throw new Error("CSV parse error: " + JSON.stringify(errors));
  // Filter for the facility
  const facilityRows = data.filter(
    (row: any) => row.tangis_facility_id === tangis_facility_id,
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
  const response = await fetch("/monthly_tz_202505121436.csv");
  const csvText = await response.text();
  const { data, errors } = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });
  if (errors.length)
    throw new Error("CSV parse error: " + JSON.stringify(errors));
  // Filter for region and (optionally) district
  const facilities = data.filter(
    (row: any) =>
      (regionName == null || row.region_name === regionName) &&
      (districtName == null || row.district_council_name === districtName),
  );
  // Get unique tangis_facility_id only
  const uniqueIds = Array.from(
    new Set(facilities.map((row: any) => row.tangis_facility_id)),
  );
  return uniqueIds.filter(Boolean); // Remove empty/null ids
}
