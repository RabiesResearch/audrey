<script lang="ts">
  import {
    monthlyDataCache,
    selectedMonth,
    sidebarOpen,
    pageSections,
  } from "$lib/stores/uiStore";
  import { onMount } from "svelte";
  import { version } from "$app/environment";
  import { signOut } from "@auth/sveltekit/client";

  export let availableMonths: string[] = [];

  const toggleSidebar = (): boolean => ($sidebarOpen = !$sidebarOpen);

  // Dynamic sections are managed by the pageSections store

  // Icon for logout button
  const logoutIcon =
    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />';

  function scrollToSection(id: string) {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }

  // Month selector
  let monthDropdownOpen = false;
  let dataRetrievedAt: string = "";

  // Make monthOptions reactive to the prop
  $: monthOptions = availableMonths;

  onMount(() => {
    // Set initial month if not already set and we have options
    if (!$selectedMonth && monthOptions.length > 0) {
      $selectedMonth = monthOptions[0];
    }
    dataRetrievedAt = $monthlyDataCache?.timestamp
      ? new Date($monthlyDataCache?.timestamp).toISOString()
      : "";
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
          {#each $pageSections as section}
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
                  {@html section.icon}
                </svg>
                <span>{section.label}</span>
              </button>
            </li>
          {/each}
        </ul>
      </nav>

      <!-- Logout Button -->
      <div class="mt-6">
        <button
          on:click={() => signOut({ callbackUrl: "/login" })}
          class="flex w-full items-center rounded-md px-3 py-2 text-gray-700 transition-colors hover:bg-red-50 hover:text-red-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="mr-3 h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {@html logoutIcon}
          </svg>
          <span>Sign Out</span>
        </button>
      </div>

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
          Data pulled: {dataRetrievedAt}
        </div>
      </div>
    </div>
  </div>
</aside>
