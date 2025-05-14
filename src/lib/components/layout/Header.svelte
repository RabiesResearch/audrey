<script lang="ts">
  import {
    sidebarOpen,
    allRegionsAndDistricts,
    selectedRegion,
    selectedDistrict,
  } from "$lib/stores/uiStore";
  import { getAllRegionsAndDistricts } from "$lib/data/api";
  import { onMount } from "svelte";

  // Toggle sidebar
  const toggleSidebar = (): boolean => ($sidebarOpen = !$sidebarOpen);

  let searchTerm = "";
  let showDropdown = false;
  let filteredResults: { region: string; district: string }[] = [];

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
    searchTerm = (e.target as HTMLInputElement).value;
    if (searchTerm.length > 0) {
      const term = searchTerm.toLowerCase();
      filteredResults = $allRegionsAndDistricts.filter(
        (item) =>
          item.region.toLowerCase().includes(term) ||
          item.district.toLowerCase().includes(term),
      );
      showDropdown = filteredResults.length > 0;
    } else {
      showDropdown = false;
      filteredResults = [];
    }
  }

  const selectLocation = (
    region: string | null,
    district: string | null,
  ): void => {
    $selectedRegion = region;
    $selectedDistrict = district;
    showDropdown = false;
    searchTerm = `${region} > ${district}`;
  };

  const clearLocation = (): void => {
    $selectedRegion = null;
    $selectedDistrict = null;
    showDropdown = false;
    searchTerm = "";
  };
</script>

<header class="sticky top-0 z-10 bg-white shadow-sm">
  <div class="container-dashboard flex items-center justify-between py-4">
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

      <div class="text-primary-700 text-lg font-semibold">
        Tanzania Rabies Dashboard
      </div>
    </div>

    <div class="mx-8 max-w-lg flex-1">
      <div class="relative">
        <input
          type="text"
          placeholder="Search regions or districts..."
          class="focus:ring-primary-500 focus:border-primary-500 w-full rounded-md border border-gray-300 px-4 py-2 pr-10 focus:ring-2"
          bind:value={searchTerm}
          on:input={handleSearch}
          on:focus={() => (showDropdown = filteredResults.length > 0)}
          on:blur={() => setTimeout(() => (showDropdown = false), 150)}
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
            class="absolute left-0 right-0 z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white shadow-lg"
          >
            {#each filteredResults as item}
              <li
                class="cursor-pointer px-4 py-2 hover:bg-blue-100"
                on:mousedown={() => selectLocation(item.region, item.district)}
              >
                <span>{@html highlightMatch(item.region, searchTerm)}</span>
                <span class="text-gray-400"> &gt; </span>
                <span>{@html highlightMatch(item.district, searchTerm)}</span>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </div>

    <div>
      <button class="btn btn-primary">Sign In</button>
    </div>
  </div>
</header>
