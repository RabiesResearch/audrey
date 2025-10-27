<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { ChevronDown, ChevronRight } from "@steeze-ui/heroicons";
  import { Icon } from "@steeze-ui/svelte-icon";
  import LoadingSpinner from "$lib/components/ui/LoadingSpinner.svelte";

  const dispatch = createEventDispatcher();

  export let isOpen = false;
  export let availableMonths: string[] = [];

  type Region = {
    regionID: string;
    regionName: string;
    districts: Array<{
      districtID: string;
      districtName: string;
    }>;
  };

  let regions: Region[] = [];
  let isLoading = true;
  let error: string | null = null;
  let expandedRegions = new Set<string>();
  let selectedRegions = new Set<string>();
  let selectedDistricts: { [regionId: string]: Set<string> } = {};
  let isExporting = false;
  let exportFormat = "csv";

  // Month filtering
  let startMonth: string | null = null;
  let endMonth: string | null = null;

  async function loadUserRegions() {
    try {
      isLoading = true;
      error = null;

      // Fetch user regions
      const response = await fetch("/api/user-regions");
      if (!response.ok) {
        throw new Error("Failed to fetch user regions");
      }
      const data = await response.json();
      regions = data.regions;

      // Set default months if available
      if (availableMonths.length > 0) {
        startMonth = availableMonths[availableMonths.length - 1]; // oldest
        endMonth = availableMonths[0]; // newest
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "Unknown error";
    } finally {
      isLoading = false;
    }
  }

  function toggleRegionExpanded(regionId: string) {
    if (expandedRegions.has(regionId)) {
      expandedRegions.delete(regionId);
    } else {
      expandedRegions.add(regionId);
    }
    expandedRegions = expandedRegions;
  }

  function toggleRegionSelected(regionId: string) {
    if (selectedRegions.has(regionId)) {
      selectedRegions.delete(regionId);
      // Also remove all districts for this region
      delete selectedDistricts[regionId];
    } else {
      selectedRegions.add(regionId);
      // Initialize districts set if it doesn't exist
      if (!selectedDistricts[regionId]) {
        selectedDistricts[regionId] = new Set();
      }
    }
    selectedRegions = selectedRegions;
    selectedDistricts = selectedDistricts;
  }

  function toggleDistrictSelected(regionId: string, districtId: string) {
    if (!selectedDistricts[regionId]) {
      selectedDistricts[regionId] = new Set();
    }

    if (selectedDistricts[regionId].has(districtId)) {
      selectedDistricts[regionId].delete(districtId);
    } else {
      selectedDistricts[regionId].add(districtId);
    }

    selectedDistricts = selectedDistricts;

    // If no districts selected for this region, uncheck the region
    if (selectedDistricts[regionId].size === 0) {
      selectedRegions.delete(regionId);
      selectedRegions = selectedRegions;
    } else {
      // If any district selected, make sure region is selected
      selectedRegions.add(regionId);
      selectedRegions = selectedRegions;
    }
  }

  function selectAllDistrictsForRegion(regionId: string) {
    const region = regions.find((r) => r.regionID === regionId);
    if (!region) return;

    selectedDistricts[regionId] = new Set(
      region.districts.map((d) => d.districtID),
    );
    selectedRegions.add(regionId);
    selectedRegions = selectedRegions;
    selectedDistricts = selectedDistricts;
  }

  async function handleExport() {
    if (selectedRegions.size === 0) {
      alert("Please select at least one region or district to export.");
      return;
    }

    try {
      isExporting = true;

      // Convert sets to arrays for API
      const regionsArray = Array.from(selectedRegions);
      const districtsObject: { [key: string]: string[] } = {};

      Object.keys(selectedDistricts).forEach((regionId) => {
        districtsObject[regionId] = Array.from(selectedDistricts[regionId]);
      });

      const response = await fetch("/api/export-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedRegions: regionsArray,
          selectedDistricts: districtsObject,
          format: exportFormat,
          startMonth,
          endMonth,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Export failed");
      }

      if (exportFormat === "csv") {
        // Download CSV file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download =
          response.headers
            .get("Content-Disposition")
            ?.match(/filename="(.+)"/)?.[1] || "export.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        // Handle JSON response
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `rabies-data-export-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }

      // Close modal after successful export
      handleClose();
    } catch (err) {
      console.error("[Modal] Error exporting data:", err);
      alert(err instanceof Error ? err.message : "Export failed");
    } finally {
      isExporting = false;
    }
  }

  function handleClose() {
    dispatch("close");
  }

  onMount(() => {
    if (isOpen) {
      loadUserRegions();
    }
  });

  $: if (isOpen) {
    if (isOpen) {
      regions = [];
      isLoading = false;
      loadUserRegions();
    }
  }
</script>

{#if isOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    on:click={handleClose}
    on:keydown={(e) => e.key === "Escape" && handleClose()}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <div
      class="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-lg"
      on:click|stopPropagation
      role="document"
    >
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-xl font-semibold text-gray-900">Export Data</h2>
        <button
          class="text-gray-400 hover:text-gray-600"
          on:click={handleClose}
          aria-label="Close modal"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {#if isLoading}
        <div class="flex justify-center p-8">
          <LoadingSpinner
            size="lg"
            message="Loading available regions and months..."
          />
        </div>
      {:else if error}
        <div class="p-4 text-center text-red-500">
          Error: {error}
        </div>
      {:else}
        {#if regions.length === 0}
          <div
            class="flex flex-col items-center justify-center p-8 text-gray-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="mb-2 h-10 w-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 17v-2a4 4 0 00-4-4H5a2 2 0 012-2h10a2 2 0 012 2h-.01a4 4 0 00-4 4v2m-6 0h6"
              />
            </svg>
            <div class="mb-2 text-lg font-medium">
              No regions available or no data matching filters
            </div>
            <div class="text-sm">
              You do not have access to any regions, or there was a problem
              loading them.
            </div>
          </div>
        {:else}
          <div class="mb-6">
            <h3 class="mb-2 text-lg font-medium text-gray-900">
              Select Regions and Districts
            </h3>
            <p class="mb-4 text-sm text-gray-600">
              Choose the regions and districts you want to export data for. You
              can select entire regions or specific districts within regions.
            </p>

            <div
              class="max-h-64 overflow-y-auto rounded border border-gray-200 bg-white"
            >
              {#each regions as region}
                {@const isExpanded = expandedRegions.has(region.regionID)}
                {@const isRegionSelected = selectedRegions.has(region.regionID)}
                {@const regionDistricts =
                  selectedDistricts[region.regionID] || new Set()}

                <div class="border-b border-gray-100 last:border-b-0">
                  <div class="flex items-center p-3">
                    <button
                      class="mr-2 flex-shrink-0"
                      on:click={() => toggleRegionExpanded(region.regionID)}
                      aria-label="Toggle region expansion"
                    >
                      <Icon
                        src={isExpanded ? ChevronDown : ChevronRight}
                        size="1.2em"
                        theme="solid"
                      />
                    </button>

                    <label
                      class="flex min-w-0 flex-1 cursor-pointer items-center"
                    >
                      <input
                        type="checkbox"
                        class="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={isRegionSelected}
                        on:change={() => toggleRegionSelected(region.regionID)}
                      />
                      <div class="min-w-0 flex-1">
                        <div class="font-medium text-gray-900">
                          {region.regionName}
                        </div>
                        <div class="text-sm text-gray-500">
                          {region.districts.length} districts
                        </div>
                      </div>
                    </label>

                    {#if isRegionSelected && region.districts.length > 0}
                      <button
                        class="ml-2 text-xs text-blue-600 hover:text-blue-800"
                        on:click={() =>
                          selectAllDistrictsForRegion(region.regionID)}
                      >
                        Select All
                      </button>
                    {/if}
                  </div>

                  {#if isExpanded && region.districts.length > 0}
                    <div class="ml-8 border-l-2 border-gray-100 pb-2">
                      {#each region.districts as district}
                        <label
                          class="flex cursor-pointer items-center p-2 hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            class="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={regionDistricts.has(district.districtID)}
                            on:change={() =>
                              toggleDistrictSelected(
                                region.regionID,
                                district.districtID,
                              )}
                          />
                          <span class="text-sm text-gray-700"
                            >{district.districtName}</span
                          >
                        </label>
                      {/each}
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <div class="mb-6">
          <h3 class="mb-2 text-lg font-medium text-gray-900">
            Filter by Month Range
          </h3>
          <div
            class="mb-4 flex flex-col space-y-2 md:flex-row md:space-x-4 md:space-y-0"
          >
            <div class="flex-1">
              <label
                for="start-month"
                class="mb-1 block text-sm font-medium text-gray-700"
                >Start Month</label
              >
              <select
                id="start-month"
                class="w-full rounded border-gray-300 p-2"
                bind:value={startMonth}
              >
                {#each [...availableMonths].reverse() as month}
                  <option value={month}>{month}</option>
                {/each}
              </select>
            </div>
            <div class="flex-1">
              <label
                for="end-month"
                class="mb-1 block text-sm font-medium text-gray-700"
                >End Month</label
              >
              <select
                id="end-month"
                class="w-full rounded border-gray-300 p-2"
                bind:value={endMonth}
              >
                {#each availableMonths as month}
                  <option value={month}>{month}</option>
                {/each}
              </select>
            </div>
          </div>
          <h3 class="mb-2 text-lg font-medium text-gray-900">Export Format</h3>
          <div class="flex space-x-4">
            <label class="flex cursor-pointer items-center">
              <input
                type="radio"
                name="exportFormat"
                value="csv"
                class="mr-2 text-blue-600 focus:ring-blue-500"
                bind:group={exportFormat}
              />
              <span class="text-sm text-gray-700">CSV</span>
            </label>
            <label class="flex cursor-pointer items-center">
              <input
                type="radio"
                name="exportFormat"
                value="json"
                class="mr-2 text-blue-600 focus:ring-blue-500"
                bind:group={exportFormat}
              />
              <span class="text-sm text-gray-700">JSON</span>
            </label>
          </div>
        </div>

        <div class="flex justify-end space-x-3">
          <button
            class="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            on:click={handleClose}
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            class="flex items-center rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            on:click={handleExport}
            disabled={isExporting || selectedRegions.size === 0}
          >
            {#if isExporting}
              <LoadingSpinner size="sm" />
              <span class="ml-2">Exporting...</span>
            {:else}
              Export Data
            {/if}
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}
