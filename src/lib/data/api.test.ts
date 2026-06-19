import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the data layer so we control the rows without hitting /api/monthly-tz
// or /api/health-facilities.
vi.mock("$data/liveDB", () => ({
  fetchMonthlyData: vi.fn(),
  fetchVaccineStock: vi.fn(),
}));

import { getCompletenessData, getFacilitiesByRegionDistrict } from "./api";
import { fetchMonthlyData, fetchVaccineStock } from "$data/liveDB";

const rows = vi.mocked(fetchMonthlyData);
const stock = vi.mocked(fetchVaccineStock);

// Two regions, one facility each.
const ROWS = [
  {
    tangis_facility_id: "f-mt",
    region_name: "Mtwara",
    tangis_region_id: "R-MT",
    district_council_name: "Mtwara DC",
    tangis_district_council_id: "D-MT",
    facility_name: "Mtwara HC",
    tally_total_patients: "5",
    tally_total_vials: "3",
    submission_date: "",
    report_full_date: "",
    tally_report_month: "Apr (4/2025)",
  },
  {
    tangis_facility_id: "f-mr",
    region_name: "Morogoro",
    tangis_region_id: "R-MR",
    district_council_name: "Morogoro DC",
    tangis_district_council_id: "D-MR",
    facility_name: "Morogoro HC",
    tally_total_patients: "2",
    tally_total_vials: "1",
    submission_date: "",
    report_full_date: "",
    tally_report_month: "Apr (4/2025)",
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows.mockResolvedValue(ROWS as any);
  // Default: stock service unavailable (filter-off tests never read this).
  stock.mockResolvedValue(null);
});

// Regression: the detailed-data table previously showed every region. It must
// now be restricted to the user's allowed regions.
describe("getFacilitiesByRegionDistrict — region whitelist", () => {
  it("returns only facilities in the allowed regions", async () => {
    const ids = await getFacilitiesByRegionDistrict(null, null, ["R-MT"]);
    expect(ids).toEqual(["f-mt"]);
  });

  it("returns all facilities when allowedRegionIDs is null (admin)", async () => {
    const ids = await getFacilitiesByRegionDistrict(null, null, null);
    expect(ids.sort()).toEqual(["f-mr", "f-mt"]);
  });

  it("returns nothing when the allowed list is empty", async () => {
    const ids = await getFacilitiesByRegionDistrict(null, null, []);
    expect(ids).toEqual([]);
  });
});

// Regression: the completeness table previously showed every region. It must
// now be restricted to the user's allowed regions.
describe("getCompletenessData — region whitelist", () => {
  const regionNames = (data: { regionName: string | null }[]) =>
    data.map((d) => d.regionName).sort();

  it("includes only the allowed regions", async () => {
    const data = await getCompletenessData(null, null, ["R-MT"]);
    expect(regionNames(data)).toEqual(["Mtwara"]);
  });

  it("includes all regions when allowedRegionIDs is null (admin)", async () => {
    const data = await getCompletenessData(null, null, null);
    expect(regionNames(data)).toEqual(["Morogoro", "Mtwara"]);
  });

  it("includes nothing when the allowed list is empty", async () => {
    const data = await getCompletenessData(null, null, []);
    expect(data).toEqual([]);
  });
});

describe("getCompletenessData — vaccine-stock filter", () => {
  const regionNames = (data: { regionName: string | null }[]) =>
    data.map((d) => d.regionName).sort();

  it("keeps only facilities marked true; null/false/absent are excluded", async () => {
    // f-mt has stock (true); f-mr is unknown (null).
    stock.mockResolvedValue({ "f-mt": true, "f-mr": null });
    const data = await getCompletenessData(null, null, null, true);
    expect(regionNames(data)).toEqual(["Mtwara"]);
  });

  it("does not fetch the stock map when the filter is off", async () => {
    const data = await getCompletenessData(null, null, null, false);
    expect(stock).not.toHaveBeenCalled();
    expect(regionNames(data)).toEqual(["Morogoro", "Mtwara"]);
  });

  it("fails open (shows all) when the stock service is unavailable (null)", async () => {
    stock.mockResolvedValue(null);
    const data = await getCompletenessData(null, null, null, true);
    expect(regionNames(data)).toEqual(["Morogoro", "Mtwara"]);
  });

  it("shows nothing when the loaded map is empty (not a fail-open)", async () => {
    stock.mockResolvedValue({});
    const data = await getCompletenessData(null, null, null, true);
    expect(regionNames(data)).toEqual([]);
  });
});

// Accuracy: the completeness % must recompute over the FILTERED set, so the
// same region can read differently with the toggle on vs off.
describe("getCompletenessData — completeness recalculates with the filter", () => {
  // One district, two facilities:
  //  - f-stock:   has stock, REPORTED this month
  //  - f-nostock: no stock,  did NOT report this month (only an old report)
  const now = new Date();
  const curMonth = `(${now.getMonth() + 1}/${now.getFullYear()})`;
  const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const TWO_FAC = [
    {
      tangis_facility_id: "f-stock",
      region_name: "Reg",
      tangis_region_id: "R",
      district_council_name: "Dist",
      tangis_district_council_id: "D",
      facility_name: "Stocked HC",
      tally_total_patients: "1",
      tally_total_vials: "1",
      submission_date: "",
      report_full_date: "",
      tally_report_month: `Now ${curMonth}`,
    },
    {
      tangis_facility_id: "f-nostock",
      region_name: "Reg",
      tangis_region_id: "R",
      district_council_name: "Dist",
      tangis_district_council_id: "D",
      facility_name: "Unstocked HC",
      tally_total_patients: "1",
      tally_total_vials: "1",
      submission_date: "",
      report_full_date: "",
      tally_report_month: "Old (1/2000)",
    },
  ];

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rows.mockResolvedValue(TWO_FAC as any);
  });

  it("off → 50% (1 of 2 facilities reported this month)", async () => {
    const data = await getCompletenessData(null, null, null, false);
    expect(data).toHaveLength(1);
    expect(data[0].monthlyCompleteness[curKey]).toBe(50);
  });

  it("on → 100% (only the stocked facility counts, and it reported)", async () => {
    stock.mockResolvedValue({ "f-stock": true, "f-nostock": null });
    const data = await getCompletenessData(null, null, null, true);
    expect(data).toHaveLength(1);
    // Rolled up over the stocked facility only: 1 of 1 reported.
    expect(data[0].monthlyCompleteness[curKey]).toBe(100);
  });
});
