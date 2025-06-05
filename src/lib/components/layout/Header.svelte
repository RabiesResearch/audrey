<script lang="ts">
  import {
    sidebarOpen,
    allRegionsAndDistricts,
    selectedRegionID,
    selectedDistrictID,
    selectedRegionName,
    selectedDistrictName,
  } from "$lib/stores/uiStore";
  import {
    getAllRegionsAndDistricts,
    type RegionAndDistrict,
  } from "$lib/data/api";
  import { onMount } from "svelte";
  import { derived } from "svelte/store";

  const toggleSidebar = (): boolean => ($sidebarOpen = !$sidebarOpen);

  let showDropdown = false;
  let filteredResults: {
    regionID: string;
    regionName: string;
    districtID: string | null;
    districtName: string | null;
  }[] = [];

  let searchTerm = "";
  $: searchTerm =
    $selectedRegionName && $selectedDistrictName
      ? `${$selectedRegionName} > ${$selectedDistrictName}`
      : $selectedRegionName
        ? $selectedRegionName
        : "";

  // Fetch regions/districts if not already loaded
  onMount(() => {
    const unsub = allRegionsAndDistricts.subscribe((v) => {
      if (!v.length) {
        getAllRegionsAndDistricts().then((all) =>
          allRegionsAndDistricts.set(all),
        );
      }
    });
    return () => unsub();
  });

  // Compute unique regions for region-only search
  const uniqueRegions = derived(
    allRegionsAndDistricts,
    ($all: RegionAndDistrict[]) => {
      const uniqueRegionMap = new Map<string, string>();
      $all.forEach((item) => {
        if (!uniqueRegionMap.has(item.regionID)) {
          uniqueRegionMap.set(item.regionID, item.regionName);
        }
      });
      return Array.from(uniqueRegionMap.entries()).map(([id, name]) => ({
        regionID: id,
        regionName: name,
      }));
    },
  );

  function highlightMatch(text: string, term: string) {
    if (!term) return text;
    const idx = text.toLowerCase().indexOf(term.toLowerCase());
    if (idx === -1) return text;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + term.length);
    const after = text.slice(idx + term.length);
    return `${before}<b>${match}</b>${after}`;
  }

  function handleSearch(e: Event) {
    let input = (e.target as HTMLInputElement).value;
    if (input.length > 0) {
      const term = input.toLowerCase();
      // Region/district pairs
      let pairs = $allRegionsAndDistricts
        .filter(
          (item: RegionAndDistrict) =>
            item.regionName.toLowerCase().includes(term) ||
            item.districtName.toLowerCase().includes(term),
        )
        .map((item) => ({
          regionID: item.regionID,
          regionName: item.regionName,
          districtID: item.districtID,
          districtName: item.districtName,
        }));

      // Add region-only matches for all regions that match the term
      let regionOnly = $uniqueRegions
        .filter((region) => region.regionName.toLowerCase().includes(term))
        .map((region) => ({
          regionID: region.regionID,
          regionName: region.regionName,
          districtID: null as string | null,
          districtName: null as string | null,
        }));

      // Remove any region-only result that is already present as a pair with a matching region
      regionOnly = regionOnly.filter(
        (r) =>
          !pairs.some(
            (item) =>
              item.regionID === r.regionID &&
              item.districtName?.toLowerCase().includes(term),
          ),
      );

      filteredResults = [...regionOnly, ...pairs];
      showDropdown = filteredResults.length > 0;
      searchTerm = input;
    } else {
      showDropdown = false;
      filteredResults = [];
      searchTerm = "";
    }
  }

  const selectLocation = (
    regionID: string | null,
    districtID: string | null,
    regionName: string | null,
    districtName: string | null,
  ): void => {
    $selectedRegionID = regionID;
    $selectedDistrictID = districtID;
    $selectedRegionName = regionName;
    $selectedDistrictName = districtName;
    showDropdown = false;
    // If only region is selected, update searchTerm accordingly
    if (regionName && !districtName) {
      searchTerm = regionName;
    }
  };

  function selectLocationByIndex(index: number) {
    const item = filteredResults[index];
    selectLocation(
      item.regionID,
      item.districtID,
      item.regionName,
      item.districtName,
    );
    activeIndex = -1;
  }

  const clearLocation = (): void => {
    $selectedRegionID = null;
    $selectedDistrictID = null;
    $selectedRegionName = null;
    $selectedDistrictName = null;
    showDropdown = false;
  };

  let activeIndex = -1;
  let listboxId = "location-listbox";
</script>

<header class="sticky top-0 z-10 bg-white shadow-sm">
  <div class="mx-20 flex items-center justify-between py-4">
    <div class="flex items-center space-x-4">
      <img
        src="/audrey.svg"
        alt="Tanzania Rabies Dashboard - Project Audrey Logo"
        class="h-16 w-auto"
      />
      <h1 class="text-primary-700 text-xl font-semibold">
        Rabies Situation in Tanzania
      </h1>
    </div>

    <div class="mx-8 max-w-xl w-full text-lg">
      <div class="relative">
        <input
          type="text"
          placeholder="Search regions or districts..."
          class="focus:ring-primary-500 focus:border-primary-500 w-full rounded-md border border-gray-300 px-4 py-2 pr-10 focus:ring-2"
          bind:value={searchTerm}
          on:input={handleSearch}
          on:focus={() => (showDropdown = filteredResults.length > 0)}
          on:blur={() => setTimeout(() => (showDropdown = false), 150)}
          role="combobox"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0
            ? `option-${activeIndex}`
            : ""}
          aria-autocomplete="list"
          aria-label="Search for regions or districts"
        />
        {#if searchTerm}
          <button
            class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            on:click={clearLocation}
            aria-label="Clear selection"
            tabindex="-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        {/if}
        {#if showDropdown}
          <ul
            id={listboxId}
            class="absolute left-0 right-0 z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white shadow-lg"
            role="listbox"
            aria-label="Location search results"
          >
            {#each filteredResults as item, index}
              <li
                id="option-{index}"
                role="option"
                class="cursor-pointer px-4 py-2 hover:bg-blue-100 {activeIndex ===
                index
                  ? 'bg-blue-100'
                  : ''}"
                aria-selected={activeIndex === index}
                on:mousedown={() => selectLocationByIndex(index)}
                on:mouseenter={() => (activeIndex = index)}
              >
                <span>{@html highlightMatch(item.regionName, searchTerm)}</span>
                {#if item.districtName}
                  <span class="text-gray-400"> &gt; </span>
                  <span
                    >{@html highlightMatch(item.districtName, searchTerm)}</span
                  >
                {/if}
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </div>
    <div class="flex items-center">
      <button
        class="mr-4 text-gray-500 hover:text-gray-700 focus:outline-none"
        on:click={toggleSidebar}
        aria-label="Toggle sidebar"
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
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
    </div>
  </div>
</header>
