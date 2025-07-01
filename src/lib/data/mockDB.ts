import { monthlyDataCache, type MonthlyDataRow } from "$lib/stores/uiStore";
import Papa from "papaparse";
import { get } from "svelte/store";

export async function fetchMonthlyData() {
  // Check if we have cached data that's less than 60 minutes old
  const cachedData = get(monthlyDataCache);
  const now = Date.now();
  const CACHE_DURATION = 60 * 60 * 1000; // 60 minutes in milliseconds

  if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
    // Return cached data if it's fresh
    return cachedData.data;
  }

  // Use a public path so Vite can serve the file from the static directory
  const response = await fetch("/monthly_tz_random.csv");
  const csvText = await response.text();
  const { data, errors } = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });
  if (errors.length) {
    throw new Error("CSV parse error: " + JSON.stringify(errors));
  }

  const parsedData = data as MonthlyDataRow[];

  // Cache the data with current timestamp
  monthlyDataCache.set({
    data: parsedData,
    timestamp: now,
  });

  return parsedData;
}
