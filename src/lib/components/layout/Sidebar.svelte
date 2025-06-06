<script lang="ts">
  import { getAvailableMonths } from "$data/api";
  import { selectedMonth, sidebarOpen } from "$lib/stores/uiStore";
  import { onMount } from "svelte";
  import { version } from "$app/environment";

  const toggleSidebar = (): boolean => ($sidebarOpen = !$sidebarOpen);

  // Sections for navigation
  const sections = [
    { id: "map", label: "Map View", icon: "map" },
    { id: "cases", label: "Case Statistics", icon: "stats" },
    { id: "vaccines", label: "Vaccine Stocks", icon: "vaccine" },
    { id: "tables", label: "Data Tables", icon: "table" },
  ];

  // Simple icon components
  const icons: { [index: string]: string } = {
    map: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />',
    stats:
      '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />',
    vaccine:
      '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />',
    table:
      '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />',
  };

  function scrollToSection(id: string) {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }

  // Month selector
  let monthDropdownOpen = false;

  let monthOptions: string[] = [];
  let latestDataMonth: string = "";
  onMount(async () => {
    monthOptions = await getAvailableMonths();
    $selectedMonth = monthOptions[0];
    latestDataMonth = monthOptions[0] || "";
  });

  const selectMonth = (month: string) => {
    $selectedMonth = month;
    monthDropdownOpen = false;
  };

  const getMonthLabel = (monthValue: string) => {
    const option = new Date(monthValue);
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return option
      ? `${months[option.getMonth()]} ${option.getFullYear()}`
      : "Select Month";
  };
</script>

<aside
  class="fixed -right-64 top-0 z-50 h-[100vh] w-64 transform bg-white shadow-md transition-transform duration-300"
  class:translate-x-0={!$sidebarOpen}
  class:-translate-x-full={$sidebarOpen}
>
  <div class="flex h-full flex-col">
    <div class="flex-1 p-4 pb-20">
      <!-- Add bottom padding to prevent overlap with footer -->
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-700">Dashboards</h2>
        <button
          class="text-gray-400 hover:text-gray-600"
          on:click={toggleSidebar}
          aria-label="Close Menu"
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
      </div>

      <nav>
        <ul class="space-y-2">
          {#each sections as section}
            <li>
              <button
                on:click={() => scrollToSection(section.id)}
                class="hover:bg-primary-50 hover:text-primary-700 flex w-full items-center rounded-md px-3 py-2 text-gray-700 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="mr-3 h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {@html icons[`${section.icon}`]}
                </svg>
                <span>{section.label}</span>
              </button>
            </li>
          {/each}
        </ul>
      </nav>

      <!-- Month Selector -->
      <div class="mt-6">
        <div class="mb-2 block text-sm font-medium text-gray-700">
          Filter by Month
        </div>
        <div class="relative">
          <button
            on:click={() => (monthDropdownOpen = !monthDropdownOpen)}
            class="focus:border-primary-500 focus:ring-primary-500 flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-1"
          >
            <span class="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="mr-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {getMonthLabel($selectedMonth)}
            </span>
            <svg
              class="h-4 w-4 transform transition-transform"
              class:rotate-180={monthDropdownOpen}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {#if monthDropdownOpen}
            <div
              class="absolute bottom-full left-0 right-0 mb-1 max-h-48 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg"
            >
              {#each monthOptions as month}
                <button
                  on:click={() => selectMonth(month)}
                  class="hover:bg-primary-50 hover:text-primary-700 block w-full px-3 py-2 text-left text-sm text-gray-700"
                  class:bg-primary-50={$selectedMonth === month}
                  class:text-primary-700={$selectedMonth === month}
                >
                  {getMonthLabel(month)}
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div
      class="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-gray-50 px-4 py-3"
    >
      <div class="text-center">
        <div class="mb-1 text-xs text-gray-500">
          Project Audrey v{version}
        </div>
        <div class="text-xs text-gray-400">
          Latest data: {getMonthLabel(latestDataMonth)}
        </div>
      </div>
    </div>
  </div>
</aside>
