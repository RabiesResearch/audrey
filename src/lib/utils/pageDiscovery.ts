import type { PageSection } from "$lib/stores/uiStore";

// Default icon mapping for common page types
const DEFAULT_ICONS: { [key: string]: string } = {
  map: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />',
  completeness:
    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />',
  cases:
    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />',
  vaccines:
    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />',
  tables:
    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />',
  // Default fallback icon
  default:
    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />',
};

// Mapping of page IDs to human-readable labels
const PAGE_LABELS: { [key: string]: string } = {
  map: "Map View",
  completeness: "Reporting Completeness",
  cases: "Case Statistics",
  vaccines: "Vaccine Stocks",
  tables: "Data Tables",
};

/**
 * Discover all page elements on the current document and return section information
 * @returns Array of PageSection objects for discovered pages
 */
export function discoverPageSections(): PageSection[] {
  if (typeof document === "undefined") {
    return []; // Return empty array during SSR
  }

  // Find all elements with class "page" and an id
  const pageElements = document.querySelectorAll(".page[id]");

  return Array.from(pageElements)
    .map((el) => el.id)
    .filter((id) => id.length > 0)
    .map((id) => ({
      id,
      label: PAGE_LABELS[id] || formatIdToLabel(id),
      icon: DEFAULT_ICONS[id] || DEFAULT_ICONS.default,
    }));
}

/**
 * Convert a page ID to a human-readable label
 * @param id The page ID
 * @returns Formatted label
 */
function formatIdToLabel(id: string): string {
  return id
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Get the icon SVG path for a given page ID
 * @param id The page ID
 * @returns SVG path string
 */
export function getIconForPageId(id: string): string {
  return DEFAULT_ICONS[id] || DEFAULT_ICONS.default;
}
