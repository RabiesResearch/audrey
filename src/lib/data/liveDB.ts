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
