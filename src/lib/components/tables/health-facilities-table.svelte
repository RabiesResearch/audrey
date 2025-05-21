<script lang="ts">
  import {
    getFacilitiesByRegionDistrict,
    getFacilityInfoById,
    type FacilityInfo,
  } from "$lib/data/api";
  import { 
    selectedRegionID, 
    selectedDistrictID, 
    selectedRegionName, 
    selectedDistrictName 
  } from "$lib/stores/uiStore";
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
    regionID: string | null;
    regionName: string | null;
    districtID: string | null;
    districtName: string | null;
    facilityName: string | null;
    uniquePatients: number;
    vaccineVialStock: number;
    children?: FacilityInfoWithChildren[];
  };

  function collapseFacilityInfo(
    data: FacilityInfo[],
  ): FacilityInfoWithChildren[] {
    const result: FacilityInfoWithChildren[] = [];

    const getOrCreateNode = (
      parent: FacilityInfoWithChildren[],
      key: {
        id: string | null;
        regionID: string | null;
        regionName: string | null;
        districtID: string | null;
        districtName: string | null;
        facilityName: string | null;
      },
    ): FacilityInfoWithChildren => {
      let node = parent.find(
        (entry) =>
          entry.regionID === key.regionID &&
          entry.districtID === key.districtID &&
          entry.facilityName === key.facilityName,
      );

      if (!node) {
        node = {
          id: key.id,
          regionID: key.regionID ?? null,
          regionName: key.regionName ?? null,
          districtID: key.districtID ?? null,
          districtName: key.districtName ?? null,
          facilityName: key.facilityName ?? null,
          uniquePatients: 0,
          vaccineVialStock: 0,
          children: [] as FacilityInfoWithChildren[],
        };
        parent.push(node);
      }

      return node;
    };

    for (const entry of data) {
      // Find or create the region node
      const regionNode = getOrCreateNode(result, {
        id: null,
        regionID: entry.regionID,
        regionName: entry.regionName,
        districtID: null,
        districtName: null,
        facilityName: null,
      });

      // Find or create the district node under the region
      const districtNode = getOrCreateNode(regionNode.children!, {
        id: null,
        regionID: null,
        regionName: null,
        districtID: entry.districtID,
        districtName: entry.districtName,
        facilityName: null,
      });

      // Find or create the facility node under the district
      const facilityNode = getOrCreateNode(districtNode.children!, {
        id: entry.facilityID,
        regionID: null,
        regionName: null,
        districtID: null,
        districtName: null,
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
    // Always fetch all facilities for the selected region (not just the district)
    const facilities = await getFacilitiesByRegionDistrict($selectedRegionID, null);
    const dataWithNulls: Array<FacilityInfo | null> = [];
    for (const id of facilities) {
      dataWithNulls.push(await getFacilityInfoById(id));
    }
    let collapsed = collapseFacilityInfo(
      dataWithNulls.filter((facility) => facility !== null),
    );
    // If a district is selected, filter the region's children to only that district
    if ($selectedDistrictID && collapsed.length > 0) {
      collapsed[0].children = collapsed[0].children?.filter(
        (d) => d.districtID === $selectedDistrictID
      );
      // Auto-expand the region and the district if present
      expandedState = { '0': true };
      if (collapsed[0].children && collapsed[0].children.length > 0) {
        expandedState['0.0'] = true;
      }
    } else if (collapsed.length === 1) {
      expandedState = { '0': true };
    }
    data = collapsed;
  })();

  $: options = {
    data,
    columns,
    state: {
      expanded: expandedState,
    },
    getSubRows: (row: FacilityInfoWithChildren) => row.children,
    onExpandedChange(updater: any) {
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
