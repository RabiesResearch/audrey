<script lang="ts">
  import { sidebarOpen } from "$lib/stores/uiStore";

  // Sections for navigation
  const sections = [
    { id: "map", label: "Map View", icon: "map" },
    { id: "cases", label: "Case Statistics", icon: "stats" },
    { id: "vaccines", label: "Vaccine Stocks", icon: "vaccine" },
    { id: "tables", label: "Data Tables", icon: "table" },
  ];

  // Simple icon components
  const icons = {
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
</script>

<aside
  class="fixed left-0 top-[65px] z-10 h-[calc(100vh-65px)] w-64 transform bg-white shadow-md transition-transform duration-300"
  class:translate-x-0={$sidebarOpen}
  class:-translate-x-full={!$sidebarOpen}
>
  <div class="p-4">
    <h2 class="mb-4 text-lg font-semibold text-gray-700">Dashboard</h2>

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
                {@html icons[section.icon]}
              </svg>
              <span>{section.label}</span>
            </button>
          </li>
        {/each}
      </ul>
    </nav>
  </div>
</aside>
