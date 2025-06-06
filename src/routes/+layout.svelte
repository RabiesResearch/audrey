<script lang="ts">
  // import { page } from '$app/stores';
  import { Toaster } from "svelte-hot-french-toast";
  import Header from "$lib/components/layout/Header.svelte";
  import Sidebar from "$lib/components/layout/Sidebar.svelte";
  import { sidebarOpen, allRegionsAndDistricts, selectedMonth } from "$lib/stores/uiStore";
  import { onMount } from "svelte";

  export let data;

  // Initialize stores with server-loaded data
  onMount(() => {
    allRegionsAndDistricts.set(data.allRegionsAndDistricts);
    selectedMonth.set(data.initialSelectedMonth);
  });
</script>

<Toaster />

<div class="flex min-h-screen flex-col">
  <Header />

  <div class="flex flex-1">
    <Sidebar availableMonths={data.availableMonths} />

    <main
      class="flex-1 p-4 transition-all duration-200 sm:p-6 lg:p-8"
      class:pl-64={$sidebarOpen}
    >
      <slot />
    </main>
  </div>
</div>
