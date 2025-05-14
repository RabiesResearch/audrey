import { writable } from "svelte/store";

// UI state stores
export const sidebarOpen = writable(false);
export const selectedRegion = writable<string | null>(null);
export const selectedDistrict = writable<string | null>(null);
export const mapZoomLevel = writable(1);
export const allRegionsAndDistricts = writable<
  { region: string; district: string }[]
>([]);
