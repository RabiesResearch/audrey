import { type RegionAndDistrict } from "$data/api";
import { writable } from "svelte/store";

// Monthly data cache type
export type MonthlyDataRow = {
  tangis_facility_id: string;
  region_name: string;
  tangis_region_id: string;
  district_council_name: string;
  tangis_district_council_id: string;
  facility_name: string;
  tally_total_patients: string;
  tally_total_vials: string;
  submission_date: string;
  report_full_date: string;
  tally_report_month: string;
  [key: string]: string;
};

type CachedMonthlyData = {
  data: MonthlyDataRow[];
  timestamp: number; // Unix timestamp when data was cached
};

// UI state stores
export const sidebarOpen = writable(false);
// Using IDs instead of names for selection to ensure uniqueness
export const selectedRegionID = writable<string | null>(null);
export const selectedDistrictID = writable<string | null>(null);
// Keep name stores for display purposes
export const selectedRegionName = writable<string | null>(null);
export const selectedDistrictName = writable<string | null>(null);
export const mapZoomLevel = writable(1);
export const allRegionsAndDistricts = writable<RegionAndDistrict[]>([]);

// Monthly data cache store
export const monthlyDataCache = writable<CachedMonthlyData | null>(null);

// Month selector states
const currentMonth = new Date();
const currentMonthValue = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`;
export const selectedMonth = writable<string>(currentMonthValue);

// Page sections type and store for dynamic sidebar generation
export type PageSection = {
  id: string;
  label: string;
  icon: string;
};

export const pageSections = writable<PageSection[]>([]);
