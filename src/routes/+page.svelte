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

  // Page navigation state
  let currentPageIndex = 0;
  let pageIds: string[] = [];

  // Function to navigate between pages
  function navigateToPage(direction: "up" | "down") {
    if (direction === "up" && currentPageIndex > 0) {
      currentPageIndex--;
    } else if (direction === "down" && currentPageIndex < pageIds.length - 1) {
      currentPageIndex++;
    }

    const targetPage = document.getElementById(pageIds[currentPageIndex]);
    if (targetPage) {
      // Account for sticky header height
      const headerHeight = document.querySelector('header')?.offsetHeight || 0;
      const targetPosition = targetPage.offsetTop - headerHeight;
      
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  }

  // Handle region selection from either visualization
  function handleRegionSelect(region: string) {
    selectedRegion = region;
  }

  // Show notifications example
  onMount(() => {
    // Automatically discover all page elements
    const pageElements = document.querySelectorAll('.page[id]');
    pageIds = Array.from(pageElements).map(el => el.id).filter(id => id.length > 0);
    
    // Example notification
    setTimeout(() => {
      toast.warning("Vaccine stocks are running low in Arusha region", {
        duration: 10000,
        position: "bottom-center",
      });
    }, 3000);

    // Set up intersection observer to track current page
    const headerHeight = document.querySelector('header')?.offsetHeight || 0;
    const observerOptions = {
      root: null,
      rootMargin: `-${headerHeight}px 0px -50% 0px`,
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const pageId = entry.target.id;
          const index = pageIds.indexOf(pageId);
          if (index !== -1) {
            currentPageIndex = index;
          }
        }
      });
    }, observerOptions);

    // Observe all page elements
    pageIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    // Cleanup observer
    return () => {
      observer.disconnect();
    };
  });
</script>

<svelte:head>
  <title>Tanzania Rabies Dashboard</title>
</svelte:head>

<div class="container-dashboard">
  <div id="map" class="page mx-5 flex flex-col lg:mx-10" style="height: 85vh;">
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

  <div
    id="completeness"
    class="page mx-5 flex flex-col lg:mx-10"
    style="height: 85vh;"
  >
    <div
      class="mb-8 grid min-h-0 flex-1 grid-cols-1 gap-6"
      style="height: 100%;"
    >
      <!-- Map visualization -->
      <div class="flex h-full flex-col rounded-lg bg-white p-4 shadow-md">
        <h2 class="mb-2 text-lg font-semibold">Geographic Distribution</h2>
        <HealthFacilitiesTable />
      </div>
    </div>
  </div>

  <div
    id="deleteme"
    class="page mx-5 flex flex-col lg:mx-10"
    style="height: 85vh;"
  >
    <div
      class="mb-8 grid min-h-0 flex-1 grid-cols-1 gap-6"
      style="height: 100%;"
    >
      <!-- Map visualization -->
      <div class="flex h-full flex-col rounded-lg bg-white p-4 shadow-md">
        <h2 class="mb-2 text-lg font-semibold">Geographic Distribution</h2>
        <HealthFacilitiesTable />
      </div>
    </div>
  </div>

  <!-- Floating Navigation Button -->
  <div class="fixed bottom-6 right-6 z-40 flex flex-col gap-2">
    <!-- Up Button -->
    <button
      class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:bg-gray-400"
      on:click={() => navigateToPage("up")}
      disabled={currentPageIndex === 0}
      aria-label="Go to previous section"
      title="Previous section"
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
          d="M5 15l7-7 7 7"
        />
      </svg>
    </button>

    <!-- Down Button -->
    <button
      class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:bg-gray-400"
      on:click={() => navigateToPage("down")}
      disabled={currentPageIndex === pageIds.length - 1}
      aria-label="Go to next section"
      title="Next section"
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
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>

    <!-- Page indicator -->
    <div class="mt-2 flex flex-col items-center gap-1">
      {#each pageIds as _, index}
        <div
          class="h-2 w-2 rounded-full transition-colors {index ===
          currentPageIndex
            ? 'bg-blue-600'
            : 'bg-gray-300'}"
        ></div>
      {/each}
    </div>
  </div>
</div>
