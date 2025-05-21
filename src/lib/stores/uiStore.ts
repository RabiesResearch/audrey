import type { RegionAndDistrict } from "$data/api";
import { writable } from "svelte/store";

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
