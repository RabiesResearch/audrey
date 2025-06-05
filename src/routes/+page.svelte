<script lang="ts">
  import StockMap from "$lib/components/charts/stock-cases-map.svelte";
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
        position: "bottom-center",
      });
    }, 3000);
  });
</script>

<svelte:head>
  <title>Tanzania Rabies Dashboard</title>
</svelte:head>

<div class="container-dashboard">
  <div class="page mx-5 lg:mx-10 flex flex-col" style="height: 85vh;">
    <div
      class="mb-8 grid min-h-0 flex-1 grid-cols-1 gap-6 2xl:grid-cols-2"
      style="height: 100%;"
    >
      <!-- Map visualization -->
      <div class="flex h-full flex-col rounded-lg bg-white p-4 shadow-md">
        <h2 class="mb-2 text-lg font-semibold">Geographic Distribution</h2>
        <StockMap />
      </div>

      <!-- Bar chart visualization -->
      <div class="flex h-full flex-col rounded-lg bg-white p-4 shadow-md">
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
            class="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            on:click={() => (showDataTableModal = false)}
            aria-label="Close table"
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
          <h2 class="mb-4 text-lg font-semibold">Detailed Data</h2>
          <HealthFacilitiesTable />
        </div>
      </div>
    {/if}
  </div>
</div>
