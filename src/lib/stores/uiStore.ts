import { writable } from "svelte/store";

// UI state stores
export const sidebarOpen = writable(true);
export const selectedRegion = writable(null);
export const selectedDistrict = writable(null);
export const mapZoomLevel = writable(1);
