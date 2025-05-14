<script lang="ts">
  //   import TanzaniaMap from "$lib/components/charts/stock-cases-chloropleth-map.svelte";
  import CasesBarChart from "$lib/components/charts/cases-stock-bar-chart.svelte";
  import HealthFacilitiesTable from "$components/tables/health-facilities-table.svelte";
  import { onMount } from "svelte";
  import toast from "svelte-hot-french-toast";

  // State for selected region/district
  let selectedRegion: string;

  // Modal state
  let showDataTableModal = false;

  // Handle region selection from either visualization
  function handleRegionSelect(region: string) {
    selectedRegion = region;
  }

  // Show notifications example
  onMount(() => {
    // Example notification
    setTimeout(() => {
      toast.warning("Vaccine stocks are running low in Arusha region", {
        duration: 10000,
      });
    }, 3000);
  });
</script>

<svelte:head>
  <title>Tanzania Rabies Dashboard</title>
</svelte:head>

<div class="container-dashboard">
  <div class="page flex flex-col" style="height: 90vh;">
    <h1 class="mb-6 text-2xl font-bold">Tanzania Rabies Situation Dashboard</h1>

    <div class="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2 flex-1 min-h-0" style="height: 100%;">
      <!-- Map visualization -->
      <div class="h-full rounded-lg bg-white p-4 shadow-md flex flex-col">
        <h2 class="mb-2 text-lg font-semibold">Geographic Distribution</h2>
        <p>Here goes the Tanzania map visualization</p>
        <!-- <TanzaniaMap
        {selectedRegion}
        on:regionSelect={(e) => handleRegionSelect(e.detail)}
      /> -->
      </div>

      <!-- Bar chart visualization -->
      <div class="h-full rounded-lg bg-white p-4 shadow-md flex flex-col">
        <h2 class="mb-2 text-lg font-semibold">Cases and Vaccine Stock</h2>
        <CasesBarChart />
        <!-- Button to open modal -->
        <button
          class="mb-4 rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
          on:click={() => (showDataTableModal = true)}
        >
          View Detailed Data
        </button>
      </div>
    </div>

    <!-- Data Table Modal -->
    {#if showDataTableModal}
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      >
        <div
          class="md:mac-w-[80vw] relative max-h-[100vh] w-full max-w-[95vw] overflow-y-auto rounded-lg bg-white p-6 shadow-lg md:max-h-[80vh]"
        >
          <button
            class="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
            on:click={() => (showDataTableModal = false)}
            aria-label="Close"
          >
            &times;
          </button>
          <h2 class="mb-4 text-lg font-semibold">Detailed Data</h2>
          <HealthFacilitiesTable {selectedRegion} />
        </div>
      </div>
    {/if}
  </div>
</div>
