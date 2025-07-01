<script lang="ts">
  import { page } from "$app/stores";
  import { Toaster } from "svelte-hot-french-toast";
  import Header from "$lib/components/layout/Header.svelte";
  import Sidebar from "$lib/components/layout/Sidebar.svelte";
  import { sidebarOpen } from "$lib/stores/uiStore";

  // Only show dashboard layout for dashboard routes
  $: isDashboard = $page.url.pathname.startsWith("/dashboard");
</script>

<Toaster />

{#if isDashboard}
  <div class="flex min-h-screen flex-col">
    <Header />

    <div class="flex flex-1">
      <Sidebar />

      <main
        class="flex-1 p-4 transition-all duration-200 sm:p-6 lg:p-8"
        class:pl-64={$sidebarOpen}
      >
        <slot />
      </main>
    </div>
  </div>
{:else}
  <slot />
{/if}
