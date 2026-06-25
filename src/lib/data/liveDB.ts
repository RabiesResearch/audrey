import { monthlyDataCache, type MonthlyDataRow } from "$lib/stores/uiStore";
import { get } from "svelte/store";

export async function fetchMonthlyData(
  fetchFn?: typeof fetch,
): Promise<MonthlyDataRow[]> {
  // Check if we have cached data that's less than 60 minutes old
  const cachedData = get(monthlyDataCache);
  const now = Date.now();
  const CACHE_DURATION = 60 * 60 * 1000; // 60 minutes in milliseconds

  if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
    // Return cached data if it's fresh
    return cachedData.data;
  }

  try {
    // Make HTTP request to our API endpoint
    const _fetch = fetchFn || fetch;
    const response = await _fetch("/api/monthly-tz");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch data");
    }

    // Cache the data with current timestamp
    monthlyDataCache.set({
      data: result.data,
      timestamp: now,
    });

    return result.data;
  } catch (error) {
    console.error("[API] API request error:", error);
    throw new Error(
      `Failed to fetch data from API: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// tangis_facility_id → has_vaccine_stock, from PMP via /api/health-facilities.
type VaccineStockMap = Record<string, boolean | null>;

let vaccineStockCache: { data: VaccineStockMap; timestamp: number } | null =
  null;
const VACCINE_STOCK_CACHE_DURATION = 60 * 60 * 1000; // 60 minutes

// Loaded map (possibly empty) on success; null when unavailable (callers fail open).
export async function fetchVaccineStock(
  fetchFn?: typeof fetch,
): Promise<VaccineStockMap | null> {
  const now = Date.now();
  if (
    vaccineStockCache &&
    now - vaccineStockCache.timestamp < VACCINE_STOCK_CACHE_DURATION
  ) {
    return vaccineStockCache.data;
  }

  try {
    const _fetch = fetchFn || fetch;
    const response = await _fetch("/api/health-facilities");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch vaccine stock");
    }

    vaccineStockCache = { data: result.data, timestamp: now }; // cache successes only
    return result.data;
  } catch (error) {
    console.error("[API] Vaccine stock request error:", error);
    return null; // unavailable → callers fail open
  }
}

// lat/lng are jittered to district precision, not exact locations.
export type HighRiskBitesData = {
  wards: { lat: number; lng: number; regionId: string }[];
  districtPoints: {
    lat: number;
    lng: number;
    regionId: string;
    districtId: string;
  }[];
  regionTotals: Record<string, number>;
  districtTotals: Record<string, number>;
};

const EMPTY_HIGH_RISK_BITES: HighRiskBitesData = {
  wards: [],
  districtPoints: [],
  regionTotals: {},
  districtTotals: {},
};

let highRiskBitesCache: {
  data: HighRiskBitesData;
  timestamp: number;
} | null = null;
const HIGH_RISK_BITES_CACHE_DURATION = 60 * 60 * 1000;

export async function fetchHighRiskBites(
  fetchFn?: typeof fetch,
): Promise<HighRiskBitesData> {
  const now = Date.now();
  if (
    highRiskBitesCache &&
    now - highRiskBitesCache.timestamp < HIGH_RISK_BITES_CACHE_DURATION
  ) {
    return highRiskBitesCache.data;
  }

  try {
    const _fetch = fetchFn || fetch;
    const response = await _fetch("/api/high-risk-bites");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch high-risk bites");
    }

    highRiskBitesCache = { data: result.data, timestamp: now };
    return result.data;
  } catch (error) {
    console.error("[API] High-risk bites request error:", error);
    return EMPTY_HIGH_RISK_BITES;
  }
}
