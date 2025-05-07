<script lang="ts">
  import TanzaniaMap from "$lib/components/visualizations/TanzaniaMap.svelte";
  import CasesBarChart from "$lib/components/visualizations/CasesBarChart.svelte";
  import RegionDataTable from "$lib/components/tables/RegionDataTable.svelte";
  import { onMount } from "svelte";
  import toast from "svelte-hot-french-toast";

  // State for selected region/district
  let selectedRegion: string;

  // Handle region selection from either visualization
  function handleRegionSelect(region: string) {
    selectedRegion = region;
  }

  // Show notifications example
  onMount(() => {
    // Example notification
    setTimeout(() => {
      toast.warning("Vaccine stocks are running low in Arusha region", {
        duration: 5000,
      });
    }, 3000);
  });
</script>

<svelte:head>
  <title>Tanzania Rabies Dashboard</title>
</svelte:head>

<div class="container-dashboard">
  <h1 class="mb-6 text-2xl font-bold">Tanzania Rabies Situation Dashboard</h1>

  <div class="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
    <!-- Map visualization -->
    <div class="h-[500px] rounded-lg bg-white p-4 shadow-md">
      <h2 class="mb-2 text-lg font-semibold">Geographic Distribution</h2>
      <TanzaniaMap
        {selectedRegion}
        on:regionSelect={(e) => handleRegionSelect(e.detail)}
      />
    </div>

    <!-- Bar chart visualization -->
    <div class="h-[500px] rounded-lg bg-white p-4 shadow-md">
      <h2 class="mb-2 text-lg font-semibold">Cases and Vaccine Stock</h2>
      <CasesBarChart
        {selectedRegion}
        on:regionSelect={(e) => handleRegionSelect(e.detail)}
      />
    </div>
  </div>

  <!-- Data Table -->
  <div class="mb-8 rounded-lg bg-white p-4 shadow-md">
    <h2 class="mb-4 text-lg font-semibold">Detailed Data</h2>
    <RegionDataTable {selectedRegion} />
  </div>
</div>
