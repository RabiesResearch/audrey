<script lang="ts">
  import { onMount } from "svelte";
  import * as d3 from "d3";
  import { selectedRegion, selectedDistrict } from "$lib/stores/uiStore";
  import {
    getPatientAndStockNumbers,
    type RegionCasesStockData,
  } from "$data/api";

  let data: RegionCasesStockData[] = [];
  let geoJsonData: any = null;
  let chartContainer: HTMLDivElement | null = null;
  let resizeObserver: ResizeObserver | null = null;

  function getChartDimensions() {
    // Make the chart fill the parent div
    if (!chartContainer) return { width: 600, height: 400 };
    const width = chartContainer.clientWidth || 600;
    // Use almost all vertical space
    const height = chartContainer.parentElement?.clientHeight || 400;
    return { width, height };
  }

  // Subscribe to stores and refetch/redraw on change
  let unsubscribeRegion: (() => void) | null = null;
  let unsubscribeDistrict: (() => void) | null = null;

  async function fetchAndDraw(region: string | null, district: string | null) {
    geoJsonData = await d3.json("/geojson/tz_regions_2022.geojson");
    data = await getPatientAndStockNumbers(region, district);
    drawChart();
  }

  onMount(() => {
    let currentRegion: string | null = null;
    let currentDistrict: string | null = null;
    unsubscribeRegion = selectedRegion.subscribe((region) => {
      currentRegion = region;
      fetchAndDraw(currentRegion, currentDistrict);
    });
    unsubscribeDistrict = selectedDistrict.subscribe((district) => {
      currentDistrict = district;
      fetchAndDraw(currentRegion, currentDistrict);
    });
    // Initial fetch
    fetchAndDraw(currentRegion, currentDistrict);
    // Responsive: redraw on resize
    resizeObserver = new ResizeObserver(() => drawChart());
    if (chartContainer) resizeObserver.observe(chartContainer);
    return () => {
      unsubscribeRegion && unsubscribeRegion();
      unsubscribeDistrict && unsubscribeDistrict();
      if (resizeObserver && chartContainer)
        resizeObserver.unobserve(chartContainer);
    };
  });

  // TODO replace with handleRegionClick
  function handleBarClick(d: RegionCasesStockData) {
    // If a region is selected, clicking a bar means select a district
    // If no region is selected, clicking a bar means select a region
    if ($selectedRegion && d.districtName) {
      selectedDistrict.set(d.districtName ?? null);
    } else if (d.regionName) {
      selectedRegion.set(d.regionName ?? null);
      selectedDistrict.set(null);
    }
  }

  function drawChart() {
    if (!chartContainer) return;
    chartContainer.innerHTML = "";
    if (!data.length) return;

    const { width, height } = getChartDimensions();

    // D3 projection and path
    const projection = d3.geoMercator().fitSize([width, height], geoJsonData);
    const path = d3.geoPath().projection(projection);

    // Color scale for vials
    const color = d3
      .scaleSequential(d3.interpolateYlGnBu)
      .domain([0, d3.max(data, (d) => d.vaccineStock) || 1]);

    const svg = d3
      .select(chartContainer)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    svg
      .append("g")
      .selectAll("path")
      .data(geoJsonData.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", (d: any) => {
        return color(d.vaccineStock || 0);
      })
      .attr("stroke", "#334155")
      .attr("stroke-width", 1);  // TODO add tooltip

    // TODO Add legend (simple gradient bar)
  }
</script>

<div class="flex h-full w-full flex-col">
  <div class="relative h-full flex-1" bind:this={chartContainer}></div>
</div>
