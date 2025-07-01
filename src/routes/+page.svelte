<script lang="ts">
  import Completeness from "$components/pages/completeness.svelte";
  import Map from "$lib/components/pages/map.svelte";
  import { onMount } from "svelte";
  import toast from "svelte-hot-french-toast";

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
      const headerHeight = document.querySelector("header")?.offsetHeight || 0;
      const targetPosition = targetPage.offsetTop - headerHeight;

      window.scrollTo({
        top: targetPosition,
        behavior: "smooth",
      });
    }
  }

  // Show notifications example
  onMount(() => {
    // Automatically discover all page elements
    const pageElements = document.querySelectorAll(".page[id]");
    pageIds = Array.from(pageElements)
      .map((el) => el.id)
      .filter((id) => id.length > 0);

    // Example notification
    setTimeout(() => {
      toast.warning("Vaccine stocks are running low in Arusha region", {
        duration: 10000,
        position: "bottom-center",
      });
    }, 3000);

    // Set up intersection observer to track current page
    const headerHeight = document.querySelector("header")?.offsetHeight || 0;
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
  <Map />
  <Completeness />

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
      {#each pageIds as id, index}
        <div
          class="h-2 w-2 rounded-full transition-colors {index ===
          currentPageIndex
            ? 'bg-blue-600'
            : 'bg-gray-300'}"
          {id}
        ></div>
      {/each}
    </div>
  </div>
</div>
