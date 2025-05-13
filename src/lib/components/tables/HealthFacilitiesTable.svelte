<script lang="ts">
  import {
    getFacilitiesByRegionDistrict,
    getFacilityInfoById,
    type FacilityInfo,
  } from "$lib/data/api";
  import { selectedDistrict, selectedRegion } from "$lib/stores/uiStore";
  import {
    createSvelteTable,
    flexRender,
    getCoreRowModel,
    type ColumnDef,
  } from "@tanstack/svelte-table";

  let data: FacilityInfo[] = [];

  const columns: ColumnDef<FacilityInfo>[] = [
    {
      accessorKey: "regionName",
      header: "Region",
    },
    {
      accessorKey: "districtName",
      header: "District",
    },
    {
      accessorKey: "facilityName",
      header: "Facility name",
    },
    {
      accessorKey: "uniquePatients",
      header: "Unique patients in the last month",
    },
    {
      accessorKey: "vaccineVialStock",
      header: "Approximate vaccine vials in stock",
    },
  ];

  $: (async () => {
    console.log("Running")
    const facilities = await getFacilitiesByRegionDistrict(
      $selectedRegion,
      $selectedDistrict,
    );
    const dataWithNulls: Array<FacilityInfo | null> = await Promise.all(
      facilities.map(async (id) => await getFacilityInfoById(id)),
    );
    data = dataWithNulls
      .filter((facility) => facility !== null);
  })();
  
  $: options = {
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  };

  $: table = createSvelteTable(options);
</script>

{#if !table}
  <div class="p-4 text-center text-gray-500">Loading health facilities...</div>
{:else if table}
  <div class="overflow-x-auto rounded border border-gray-200 bg-white">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        {#each $table.getHeaderGroups() as headerGroup}
          <tr>
            {#each headerGroup.headers as header}
              <th
                class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                {#if !header.isPlaceholder}
                  <svelte:component
                    this={flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  />
                {/if}
              </th>
            {/each}
          </tr>
        {/each}
      </thead>
      <tbody class="divide-y divide-gray-100">
        {#each $table.getRowModel().rows as row}
          <tr>
            {#each row.getVisibleCells() as cell}
              <td class="whitespace-nowrap px-4 py-2">
                <svelte:component
                  this={flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext(),
                  )}
                />
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
      <tfoot>
        {#each $table.getFooterGroups() as footerGroup}
          <tr>
            {#each footerGroup.headers as header}
              <th>
                {#if !header.isPlaceholder}
                  <svelte:component
                    this={flexRender(
                      header.column.columnDef.footer,
                      header.getContext(),
                    )}
                  />
                {/if}
              </th>
            {/each}
          </tr>
        {/each}
      </tfoot>
    </table>
  </div>
{:else}
  <div class="p-4 text-center text-gray-500">No health facilities found.</div>
{/if}
