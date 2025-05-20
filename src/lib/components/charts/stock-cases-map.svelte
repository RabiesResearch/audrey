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

  function handleAreaClick(d: any) {
    // If a region is already selected, clicking an area means select a district
    // If no region is selected, clicking an area means select a region
    console.log(d.properties);
    if ($selectedRegion && d.properties.district_name) {
      selectedDistrict.set(d.properties.district_name ?? null);
    } else if (d.properties.reg_name) {
      selectedRegion.set(d.properties.reg_name ?? null);
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
      .scaleSequential(d3.interpolateBlues)
      .domain([0, d3.max(data, (d) => d.vaccineStock) || 1]);

    const svg = d3
      .select(chartContainer)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    // Create tooltip
    const tooltip = d3
      .select(chartContainer)
      .append("div")
      .attr(
        "class",
        "absolute z-50 bg-white border border-gray-300 rounded px-3 py-2 text-sm text-slate-800 shadow-lg pointer-events-none",
      )
      .style("opacity", 0)
      .style("position", "absolute");

    // Tooltip event handlers
    function showTooltip(event: MouseEvent, d: any) {
      const regionID = d.properties.region_id;
      const regionData = data.find((r) => r.regionID === regionID);

      // Get mouse position relative to the chart container
      const [mouseX, mouseY] = d3.pointer(event, chartContainer);

      if (!regionData) {
        tooltip
          .html(
            `<div><strong>${d.properties.reg_name || "Unknown Region"}</strong></div>` +
              `<div>No data for this area</span></div>`,
          )
          .style("left", mouseX + 10 + "px")
          .style("top", mouseY - 50 + "px")
          .transition()
          .duration(100)
          .style("opacity", 1);
        return;
      }

      const regionName =
        regionData.regionName || d.properties.reg_name || "Unknown Region";
      const vaccineStock = regionData.vaccineStock || 0;
      const uniquePatients = regionData.uniquePatients || 0;

      tooltip
        .html(
          `<div><strong>${regionName}</strong></div>` +
            `<div>Vaccine Vials: <span class="font-bold">${vaccineStock.toLocaleString()}</span></div>` +
            `<div>Unique Patients: <span class="font-bold">${uniquePatients.toLocaleString()}</span></div>`,
        )
        .style("left", mouseX + 10 + "px")
        .style("top", mouseY - 50 + "px")
        .transition()
        .duration(100)
        .style("opacity", 1);
    }

    function hideTooltip() {
      tooltip.transition().duration(100).style("opacity", 0);
    }

    svg
      .append("g")
      .selectAll("path")
      .data(geoJsonData.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", (d: any) => {
        const areaData = data.find(
          (area) => area.regionID === d.properties.region_id,
        );
        return color(areaData?.vaccineStock || 0);
      })
      .attr("stroke", "#334155")
      .attr("stroke-width", 1)
      .attr("cursor", "pointer")
      .on("mousemove", function (event, d) {
        showTooltip(event, d);
      })
      .on("mouseleave", hideTooltip)
      .on("click", function (event, d) {
        handleAreaClick(d);
      });

    // Add a color legend
    const legendWidth = 200;
    const legendHeight = 15;
    const legendX = width - legendWidth - 20;
    const legendY = height - legendHeight - 30;

    // Create a gradient for the legend
    const defs = svg.append("defs");
    const linearGradient = defs
      .append("linearGradient")
      .attr("id", "vaccine-stock-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");

    // Add color stops to the gradient
    linearGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", color(0));

    linearGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", color(d3.max(data, (d) => d.vaccineStock) || 1));

    // Draw the colored rectangle
    svg
      .append("rect")
      .attr("x", legendX)
      .attr("y", legendY)
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#vaccine-stock-gradient)")
      .attr("stroke", "#334155")
      .attr("stroke-width", 1);

    // Add legend title
    svg
      .append("text")
      .attr("x", legendX)
      .attr("y", legendY - 10)
      .attr("fill", "#334155")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .text("Vaccine Vials Stock");

    // Add legend labels (min and max)
    svg
      .append("text")
      .attr("x", legendX)
      .attr("y", legendY + legendHeight + 15)
      .attr("fill", "#334155")
      .style("font-size", "10px")
      .attr("text-anchor", "start")
      .text("0");

    svg
      .append("text")
      .attr("x", legendX + legendWidth)
      .attr("y", legendY + legendHeight + 15)
      .attr("fill", "#334155")
      .style("font-size", "10px")
      .attr("text-anchor", "end")
      .text((d3.max(data, (d) => d.vaccineStock) || 0).toLocaleString());
  }
</script>

<div class="flex h-full w-full flex-col">
  <div class="relative h-full flex-1" bind:this={chartContainer}></div>
</div>
