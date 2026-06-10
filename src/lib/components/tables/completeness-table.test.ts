// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, unmount, flushSync } from "svelte";
import CompletenessTable from "./completeness-table.svelte";
import {
  monthlyDataCache,
  selectedRegionID,
  selectedDistrictID,
  type MonthlyDataRow,
} from "$lib/stores/uiStore";
import { allowedRegionIDs } from "$lib/stores/userRegions";

// Regression tests for the auto-expand behaviour: selecting a district in
// the header search must expand its region row in the completeness table so
// the district is visible without a click, and clearing the search must
// collapse everything again (the expansion state must not leak across
// selection changes).

// tally_report_month uses the "Apr (4/2025)" format; only the parenthesised
// part is parsed. Use the current month so it falls inside the table's
// 12-month window.
const now = new Date();
const REPORT_MONTH = `M (${now.getMonth() + 1}/${now.getFullYear()})`;

const makeRow = (
  regionID: string,
  regionName: string,
  districtID: string,
  districtName: string,
  facilityID: string,
  facilityName: string,
): MonthlyDataRow => ({
  tangis_facility_id: facilityID,
  facility_name: facilityName,
  tangis_region_id: regionID,
  region_name: regionName,
  tangis_district_council_id: districtID,
  district_council_name: districtName,
  tally_report_month: REPORT_MONTH,
  tally_total_patients: "1",
  tally_total_vials: "1",
  submission_date: "",
  report_full_date: "",
});

const FIXTURE_ROWS = [
  makeRow("r-mtwara", "Mtwara", "d-newala", "Newala Town Council", "f1", "F1"),
  makeRow("r-dodoma", "Dodoma", "d-chamwino", "Chamwino", "f2", "F2"),
];

const tableText = () => document.body.textContent ?? "";

describe("completeness table — auto-expand for the searched district", () => {
  let component: ReturnType<typeof mount>;

  beforeEach(() => {
    // Fresh cache entry so fetchMonthlyData serves the fixture without HTTP.
    monthlyDataCache.set({ data: FIXTURE_ROWS, timestamp: Date.now() });
    // Unrestricted user: /api/user-regions answers isAllRegions.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ regions: [], isAllRegions: true }),
      })) as unknown as typeof fetch,
    );
  });

  afterEach(() => {
    unmount(component);
    document.body.innerHTML = "";
    vi.unstubAllGlobals();
    monthlyDataCache.set(null);
    selectedRegionID.set(null);
    selectedDistrictID.set(null);
    allowedRegionIDs.set([]);
  });

  const mountTable = async () => {
    component = mount(CompletenessTable, { target: document.body });
    flushSync();
    await vi.waitFor(() => {
      expect(tableText()).toContain("Mtwara");
    });
  };

  it("shows only collapsed regions when nothing is selected", async () => {
    await mountTable();

    expect(tableText()).toContain("Dodoma");
    expect(tableText()).not.toContain("Newala Town Council");
  });

  it("expands the region of the district selected in the header search", async () => {
    selectedRegionID.set("r-mtwara");
    selectedDistrictID.set("d-newala");

    await mountTable();

    await vi.waitFor(() => {
      expect(tableText()).toContain("Newala Town Council");
    });
  });

  it("collapses again when the search is cleared", async () => {
    selectedRegionID.set("r-mtwara");
    selectedDistrictID.set("d-newala");
    await mountTable();
    await vi.waitFor(() => {
      expect(tableText()).toContain("Newala Town Council");
    });

    // What clearLocation() in the header does.
    selectedRegionID.set(null);
    selectedDistrictID.set(null);

    await vi.waitFor(() => {
      // Full table again (both regions) with every row collapsed.
      expect(tableText()).toContain("Dodoma");
      expect(tableText()).not.toContain("Newala Town Council");
    });
  });
});
