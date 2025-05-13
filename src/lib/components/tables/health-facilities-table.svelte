<script lang="ts">
  import {
    getFacilitiesByRegionDistrict,
    getFacilityInfoById,
    type FacilityInfo,
  } from "$lib/data/api";
  import { selectedDistrict, selectedRegion } from "$lib/stores/uiStore";
  import {
    createColumnHelper,
    createSvelteTable,
    flexRender,
    getCoreRowModel,
    getExpandedRowModel,
    renderComponent,
    type ExpandedState,
  } from "@tanstack/svelte-table";
  import ExpandButton from "./expand-button.svelte";

  type FacilityInfoWithChildren = {
    id: string | null;
    regionName: string;
    districtName: string | null;
    facilityName: string | null;
    uniquePatients: number;
    vaccineVialStock: number;
    children?: FacilityInfoWithChildren[];
  };

  export function collapseFacilityInfo(
    data: FacilityInfo[],
  ): FacilityInfoWithChildren[] {
    const result: FacilityInfoWithChildren[] = [];

    const getOrCreateNode = (
      parent: FacilityInfoWithChildren[],
      key: {
        id: string | null;
        regionName: string;
        districtName: string | null;
        facilityName: string | null;
      },
    ): FacilityInfoWithChildren => {
      let node = parent.find(
        (entry) =>
          entry.regionName === key.regionName &&
          entry.districtName === key.districtName &&
          entry.facilityName === key.facilityName,
      );

      if (!node) {
        node = { ...key, uniquePatients: 0, vaccineVialStock: 0, children: [] };
        parent.push(node);
      }

      return node;
    };

    for (const entry of data) {
      // Find or create the region node
      const regionNode = getOrCreateNode(result, {
        id: null,
        regionName: entry.regionName,
        districtName: null,
        facilityName: null,
      });

      // Find or create the district node under the region
      const districtNode = getOrCreateNode(regionNode.children!, {
        id: null,
        regionName: entry.regionName,
        districtName: entry.districtName,
        facilityName: null,
      });

      // Find or create the facility node under the district
      const facilityNode = getOrCreateNode(districtNode.children!, {
        id: entry.id,
        regionName: entry.regionName,
        districtName: entry.districtName,
        facilityName: entry.facilityName,
      });

      // Aggregate the uniquePatients and vaccineVialStock at each level
      regionNode.uniquePatients += entry.uniquePatients;
      regionNode.vaccineVialStock += entry.vaccineVialStock;

      districtNode.uniquePatients += entry.uniquePatients;
      districtNode.vaccineVialStock += entry.vaccineVialStock;

      facilityNode.uniquePatients += entry.uniquePatients;
      facilityNode.vaccineVialStock += entry.vaccineVialStock;
    }

    return result;
  }

  let data: FacilityInfoWithChildren[] = [];

  const columnHelper = createColumnHelper<FacilityInfoWithChildren>();

  const columns = [
    columnHelper.display({
      id: "expansion",
      cell: ({ row }) =>
        renderComponent(ExpandButton, {
          onclick: row.getToggleExpandedHandler(),
          canExpand: row.getCanExpand(),
          isExpanded: row.getIsExpanded(),
        }),
    }),
    columnHelper.accessor("regionName", {
      header: "Region",
    }),
    columnHelper.accessor("districtName", {
      header: "District",
    }),
    columnHelper.accessor("facilityName", {
      header: "Facility name",
    }),
    columnHelper.accessor("uniquePatients", {
      header: "Unique patients in the last month",
    }),
    columnHelper.accessor("vaccineVialStock", {
      header: "Approximate vaccine vials in stock",
    }),
  ];

  let expandedState: ExpandedState = {};

  $: (async () => {
    const facilities = await getFacilitiesByRegionDistrict(
      $selectedRegion,
      $selectedDistrict,
    );
    const dataWithNulls: Array<FacilityInfo | null> = await Promise.all(
      facilities.map(async (id) => await getFacilityInfoById(id)),
    );
    data = collapseFacilityInfo(
      dataWithNulls.filter((facility) => facility !== null),
    );
  })();

  $: options = {
    data,
    columns,
    state: {
      get expanded() {
        return expandedState;
      },
    },
    getSubRows: (row) => row.children,
    onExpandedChange(updater) {
      if (updater instanceof Function) {
        expandedState = updater(expandedState);
      } else {
        expandedState = updater;
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
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
