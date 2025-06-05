<script lang="ts">
  import {
    getCompletenessData,
    getAvailableMonths,
    type CompletenessData,
  } from "$lib/data/api";
  import {
    selectedDistrictID,
    selectedRegionID
  } from "$lib/stores/uiStore";
  import { onMount, onDestroy } from "svelte";
  import { ChevronDown, ChevronRight } from "@steeze-ui/heroicons";
  import { Icon } from "@steeze-ui/svelte-icon";

  let data: CompletenessData[] = [];
  let availableMonths: string[] = [];
  let isLoading = true;
  let error: string | null = null;
  let expandedItems = new Set<string>();

  // Get last 12 months for column headers
  let monthColumns: { display: string; key: string }[] = [];

  function generateMonthColumns() {
    const now = new Date();
    const months = [];
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const displayStr = date.toLocaleDateString('en-GB', { 
        month: 'short', 
        year: 'numeric' 
      });
      const apiKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.push({ display: displayStr, key: apiKey });
    }
    
    monthColumns = months;
  }

  function getItemKey(item: CompletenessData): string {
    if (item.facilityID) return `facility-${item.facilityID}`;
    if (item.districtID) return `district-${item.districtID}`;
    return `region-${item.regionID}`;
  }

  function toggleExpanded(key: string) {
    if (expandedItems.has(key)) {
      expandedItems.delete(key);
    } else {
      expandedItems.add(key);
    }
    expandedItems = expandedItems; // Trigger reactivity
  }

  function formatCompleteness(value: number | boolean): string {
    if (typeof value === 'boolean') {
      return value ? '✓' : '✗';
    }
    return `${Math.round(value)}%`;
  }

  function getCompletenessColor(value: number | boolean): string {
    if (typeof value === 'boolean') {
      return value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    }
    
    if (value >= 80) return 'bg-green-100 text-green-800';
    if (value >= 60) return 'bg-yellow-100 text-yellow-800';
    if (value >= 40) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  }

  async function loadCompletenessData() {
    try {
      isLoading = true;
      error = null;
      
      // Get available months for reference
      availableMonths = await getAvailableMonths();

      // Fetch completeness data
      data = await getCompletenessData($selectedRegionID, $selectedDistrictID);
      
    } catch (err) {
      console.error('Error loading completeness data:', err);
      error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      isLoading = false;
    }
  }

  let unsubscribeRegion: (() => void) | undefined;
  let unsubscribeDistrict: (() => void) | undefined;

  onMount(() => {
    generateMonthColumns();
    loadCompletenessData();

    // Subscribe to store changes
    unsubscribeRegion = selectedRegionID.subscribe(() => {
      loadCompletenessData();
    });

    unsubscribeDistrict = selectedDistrictID.subscribe(() => {
      loadCompletenessData();
    });
  });

  onDestroy(() => {
    if (unsubscribeRegion) unsubscribeRegion();
    if (unsubscribeDistrict) unsubscribeDistrict();
  });
</script>

<div class="p-4">
  <h2 class="text-xl font-bold mb-4">Data Completeness</h2>
  
  {#if isLoading}
    <div class="p-4 text-center text-gray-500">Loading completeness data...</div>
  {:else if error}
    <div class="p-4 text-center text-red-500">Error: {error}</div>
  {:else if data.length > 0}
    <div class="overflow-x-auto rounded border border-gray-200 bg-white">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-2 text-left text-sm font-medium uppercase tracking-wider text-gray-500">
              Location
            </th>
            {#each monthColumns as month}
              <th class="px-2 py-2 text-center text-sm font-medium uppercase tracking-wider text-gray-500">
                {month.display}
              </th>
            {/each}
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          {#each data as item}
            {@const itemKey = getItemKey(item)}
            {@const isExpanded = expandedItems.has(itemKey)}
            {@const hasChildren = item.children && item.children.length > 0}
            
            <tr>
              <td class="whitespace-nowrap px-4 py-2">
                <div class="flex items-center">
                  {#if hasChildren}
                    <button 
                      class="mr-2"
                      on:click={() => toggleExpanded(itemKey)}
                    >
                      <Icon
                        src={isExpanded ? ChevronDown : ChevronRight}
                        size="1.2em"
                        theme="solid"
                      />
                    </button>
                  {:else}
                    <span class="w-6"></span>
                  {/if}
                  
                  <div>
                    <div class="font-medium text-gray-900">
                      {item.facilityName || item.districtName || item.regionName}
                    </div>
                    {#if item.facilityName}
                      <div class="text-sm text-gray-500">Facility</div>
                    {:else if item.districtName}
                      <div class="text-sm text-gray-500">District</div>
                    {:else}
                      <div class="text-sm text-gray-500">Region</div>
                    {/if}
                  </div>
                </div>
              </td>
              
              {#each monthColumns as month}
                {@const completeness = item.monthlyCompleteness?.[month.key]}
                <td class="whitespace-nowrap px-2 py-2 text-center">
                  {#if completeness !== undefined}
                    <span class="inline-block px-2 py-1 rounded text-xs font-medium {getCompletenessColor(completeness)}">
                      {formatCompleteness(completeness)}
                    </span>
                  {:else}
                    <span class="text-gray-400">-</span>
                  {/if}
                </td>
              {/each}
            </tr>
            
            {#if hasChildren && isExpanded}
              {#each item.children || [] as child}
                {@const childKey = getItemKey(child)}
                {@const childExpanded = expandedItems.has(childKey)}
                {@const childHasChildren = child.children && child.children.length > 0}
                
                <tr>
                  <td class="whitespace-nowrap px-4 py-2">
                    <div class="flex items-center ml-6">
                      {#if childHasChildren}
                        <button 
                          class="mr-2"
                          on:click={() => toggleExpanded(childKey)}
                        >
                          <Icon
                            src={childExpanded ? ChevronDown : ChevronRight}
                            size="1.2em"
                            theme="solid"
                          />
                        </button>
                      {:else}
                        <span class="w-6"></span>
                      {/if}
                      
                      <div>
                        <div class="font-medium text-gray-900">
                          {child.facilityName || child.districtName || child.regionName}
                        </div>
                        {#if child.facilityName}
                          <div class="text-sm text-gray-500">Facility</div>
                        {:else if child.districtName}
                          <div class="text-sm text-gray-500">District</div>
                        {:else}
                          <div class="text-sm text-gray-500">Region</div>
                        {/if}
                      </div>
                    </div>
                  </td>
                  
                  {#each monthColumns as month}
                    {@const completeness = child.monthlyCompleteness?.[month.key]}
                    <td class="whitespace-nowrap px-2 py-2 text-center">
                      {#if completeness !== undefined}
                        <span class="inline-block px-2 py-1 rounded text-xs font-medium {getCompletenessColor(completeness)}">
                          {formatCompleteness(completeness)}
                        </span>
                      {:else}
                        <span class="text-gray-400">-</span>
                      {/if}
                    </td>
                  {/each}
                </tr>
                
                {#if childHasChildren && childExpanded}
                  {#each child.children || [] as grandchild}
                    <tr>
                      <td class="whitespace-nowrap px-4 py-2">
                        <div class="flex items-center ml-12">
                          <span class="w-6"></span>
                          <div>
                            <div class="font-medium text-gray-900">
                              {grandchild.facilityName || grandchild.districtName || grandchild.regionName}
                            </div>
                            <div class="text-sm text-gray-500">Facility</div>
                          </div>
                        </div>
                      </td>
                      
                      {#each monthColumns as month}
                        {@const completeness = grandchild.monthlyCompleteness?.[month.key]}
                        <td class="whitespace-nowrap px-2 py-2 text-center">
                          {#if completeness !== undefined}
                            <span class="inline-block px-2 py-1 rounded text-xs font-medium {getCompletenessColor(completeness)}">
                              {formatCompleteness(completeness)}
                            </span>
                          {:else}
                            <span class="text-gray-400">-</span>
                          {/if}
                        </td>
                      {/each}
                    </tr>
                  {/each}
                {/if}
              {/each}
            {/if}
          {/each}
        </tbody>
      </table>
    </div>
    
    <div class="mt-4 text-sm text-gray-600">
      <p><strong>Legend:</strong></p>
      <div class="flex flex-wrap gap-4 mt-2">
        <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
          ≥80% / ✓ Complete
        </span>
        <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
          60-79% Partial
        </span>
        <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
          40-59% Low
        </span>
        <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
          &lt;40% / ✗ Poor
        </span>
      </div>
    </div>
  {:else}
    <div class="p-4 text-center text-gray-500">No completeness data found.</div>
  {/if}
</div>
