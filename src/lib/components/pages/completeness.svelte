<script lang="ts">
  import CompletenessTable from "$components/tables/completeness-table.svelte";
</script>

<div
  id="completeness"
  class="page mx-5 flex flex-col lg:mx-10"
  style="height: 85vh;"
>
  <div class="mb-8 grid min-h-0 flex-1 grid-cols-1 gap-6" style="height: 100%;">
    <div
      class="flex h-full flex-col overflow-y-scroll rounded-lg bg-white p-4 shadow-md"
    >
      <h2 class="mb-2 text-lg font-semibold">Reporting Completeness</h2>
      <CompletenessTable />
    </div>
  </div>
</div>
