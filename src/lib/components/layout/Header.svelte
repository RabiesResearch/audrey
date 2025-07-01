<script lang="ts">
  import { sidebarOpen } from "$lib/stores/uiStore";
  import { selectedRegion, selectedDistrict } from "$lib/stores/uiStore";
  import { page } from "$app/stores";

  // Toggle sidebar
  const toggleSidebar = (): boolean => ($sidebarOpen = !$sidebarOpen);

  // Clear selection
  const clearSelection = (): void => {
    $selectedRegion = null;
    $selectedDistrict = null;
  };

  // Search functionality would be implemented here
  let searchTerm = "";
  let searchResults: string[] = [];

  const handleSearch = (): void => {
    // This would be connected to an actual search API
    searchResults.push(searchTerm);
  };

  // Get session data
  $: session = $page.data.session;
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
          class="focus:ring-primary-500 focus:border-primary-500 w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2"
          bind:value={searchTerm}
          on:input={handleSearch}
        />
        {#if $selectedRegion}
          <div class="absolute right-2 top-2 flex items-center">
            <span class="mr-2 text-sm text-gray-600"
              >{$selectedRegion}{$selectedDistrict
                ? ` > ${$selectedDistrict}`
                : ""}</span
            >
            <button
              class="text-gray-400 hover:text-gray-600"
              on:click={clearSelection}
              aria-label="Clear selection"
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
        {/if}
      </div>
    </div>

    <div>
      {#if session?.user}
        <div class="flex items-center gap-3">
          <span class="text-sm text-gray-600">
            Welcome, {session.user.name || session.user.email}
          </span>
          {#if session.user.image}
            <img
              src={session.user.image}
              alt="Profile"
              class="h-8 w-8 rounded-full"
            />
          {/if}
        </div>
      {:else}
        <button class="btn btn-primary">Sign In</button>
      {/if}
    </div>
  </div>
</header>
