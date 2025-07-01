<script lang="ts">
  export let selectedRegion: string | undefined = undefined;
  // Avoid linting error for unused prop
  $: console.log("Selected region:", selectedRegion);
</script>

<div class="flex h-full items-center justify-center bg-gray-100">
  <p class="text-gray-500">Tanzania Map Visualization (Placeholder)</p>
</div>
