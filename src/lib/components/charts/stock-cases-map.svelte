<script lang="ts">
  import { onMount } from "svelte";
  import * as d3 from "d3";
  import { 
    selectedRegionID, 
    selectedDistrictID, 
    selectedRegionName, 
    selectedDistrictName
  } from "$lib/stores/uiStore";
  import {
    getPatientAndStockNumbers,
    type RegionCasesStockData,
    getAllRegionsAndDistricts
  } from "$data/api";

  let data: RegionCasesStockData[] = [];
  let geoJsonData: any = null;
  let chartContainer: HTMLDivElement | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let regionDistrictMap: Map<string, { name: string, districts: Map<string, string> }> = new Map();

  async function buildRegionDistrictMap() {
    const regionsAndDistricts = await getAllRegionsAndDistricts();
    regionsAndDistricts.forEach(item => {
      if (!regionDistrictMap.has(item.regionID)) {
        regionDistrictMap.set(item.regionID, { 
          name: item.regionName, 
          districts: new Map() 
        });
      }
      
      const region = regionDistrictMap.get(item.regionID);
      if (region) {
        region.districts.set(item.districtID, item.districtName);
      }
    });
  }

  function getChartDimensions() {
    // Make the chart fill the parent div
    if (!chartContainer) return { width: 600, height: 400 };
    const width = chartContainer.clientWidth || 600;
    // Use almost all vertical space
    const height = chartContainer.parentElement?.clientHeight || 400;
    return { width, height };
  }

  // Subscribe to stores and refetch/redraw on change
  let unsubscribeRegionID: (() => void) | null = null;
  let unsubscribeDistrictID: (() => void) | null = null;
  let unsubscribeRegionName: (() => void) | null = null;
  let unsubscribeDistrictName: (() => void) | null = null;

  async function getGeoJsonData(
    regionID: string | null,
    districtID: string | null,
  ) {
    let data = null;
    if (!regionID) {
      data = await d3.json("/geojson/tz_regions_2022.geojson");
    } else if (regionID && !districtID) {
      await d3.json("/geojson/tz_district_councils_2022.geojson").then((d) => {
        // Filter features based on region ID instead of name
        const geoJsonFeatures = d.features.filter((feature: any) => {
          return feature.properties.regin_d === regionID;
        });
        data = d;
        data.features = geoJsonFeatures;
      });
    } else if (regionID && districtID) {
      // When viewing wards, filter by district ID
      data = await d3.json("/geojson/tz_wards_2022.geojson").then((d) => {
        const geoJsonFeatures = d.features.filter((feature: any) => {
          return feature.properties.concl_d === districtID;
        });
        return { ...d, features: geoJsonFeatures };
      });
    }
    return data;
  }

  async function fetchAndDraw(regionID: string | null, districtID: string | null) {
    // Look up the corresponding names for the IDs
    let regionName: string | null = null;
    let districtName: string | null = null;
    
    if (regionID && regionDistrictMap.has(regionID)) {
      regionName = regionDistrictMap.get(regionID)?.name || null;
      
      if (districtID) {
        districtName = regionDistrictMap.get(regionID)?.districts.get(districtID) || null;
      }
    }
    
    // Update the name stores (for display purposes)
    selectedRegionName.set(regionName);
    selectedDistrictName.set(districtName);
    
    // Fetch data using IDs
    data = await getPatientAndStockNumbers(regionID, districtID);
    geoJsonData = await getGeoJsonData(regionID, districtID);
    drawChart();
  }

  onMount(async () => {
    // Build the region/district map for lookups
    await buildRegionDistrictMap();
    
    let currentRegionID: string | null = null;
    let currentDistrictID: string | null = null;
    
    unsubscribeRegionID = selectedRegionID.subscribe((regionID) => {
      currentRegionID = regionID;
      fetchAndDraw(currentRegionID, currentDistrictID);
    });
    
    unsubscribeDistrictID = selectedDistrictID.subscribe((districtID) => {
      currentDistrictID = districtID;
      fetchAndDraw(currentRegionID, currentDistrictID);
    });

    // Initial fetch
    fetchAndDraw(currentRegionID, currentDistrictID);
    
    // Responsive: redraw on resize
    resizeObserver = new ResizeObserver(() => drawChart());
    if (chartContainer) resizeObserver.observe(chartContainer);
    
    return () => {
      unsubscribeRegionID && unsubscribeRegionID();
      unsubscribeDistrictID && unsubscribeDistrictID();
      unsubscribeRegionName && unsubscribeRegionName();
      unsubscribeDistrictName && unsubscribeDistrictName();
      if (resizeObserver && chartContainer)
        resizeObserver.unobserve(chartContainer);
    };
  });

  function handleAreaClick(d: any) {
    // If a region is already selected, clicking an area means select a district
    // If no region is selected, clicking an area means select a region
    if ($selectedRegionID) {
      if (d.properties.concl_d) {
        // Use the district ID instead of name
        selectedDistrictID.set(d.properties.concl_d);
      }
    } else if (d.properties.region_id) {
      // Use the region ID instead of name
      selectedRegionID.set(d.properties.region_id);
      selectedDistrictID.set(null);
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
      // Get mouse position relative to the chart container
      const [mouseX, mouseY] = d3.pointer(event, chartContainer);

      // Different lookup based on whether we're viewing regions or districts
      let areaData;

      if (!$selectedRegionID) {
        // Region view
        areaData = data.find((r) => r.regionID === d.properties.region_id);

        if (!areaData) {
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
          areaData.regionName || d.properties.reg_name || "Unknown Region";
        const vaccineStock = areaData.vaccineStock || 0;
        const uniquePatients = areaData.uniquePatients || 0;

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
      } else if ($selectedRegionID && !$selectedDistrictID) {
        // District view
        areaData = data.find((row) => row.districtID === d.properties.concl_d);

        if (!areaData) {
          tooltip
            .html(
              `<div><strong>${d.properties.conc_nm || "Unknown District"}</strong></div>` +
                `<div>No data for this area</span></div>`,
            )
            .style("left", mouseX + 10 + "px")
            .style("top", mouseY - 50 + "px")
            .transition()
            .duration(100)
            .style("opacity", 1);
          return;
        }

        const districtName =
          areaData.districtName ||
          d.properties.conc_nm ||
          "Unknown District";
        const vaccineStock = areaData.vaccineStock || 0;
        const uniquePatients = areaData.uniquePatients || 0;

        tooltip
          .html(
            `<div><strong>${districtName}</strong></div>` +
              `<div>Vaccine Vials: <span class="font-bold">${vaccineStock.toLocaleString()}</span></div>` +
              `<div>Unique Patients: <span class="font-bold">${uniquePatients.toLocaleString()}</span></div>`,
          )
          .style("left", mouseX + 10 + "px")
          .style("top", mouseY - 50 + "px")
          .transition()
          .duration(100)
          .style("opacity", 1);
      }
    }

    function hideTooltip() {
      tooltip.transition().duration(100).style("opacity", 0);
    }

    // Draw the map with chloropleth
    svg
      .append("g")
      .selectAll("path")
      .data(geoJsonData.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", (d: any) => {
        // Check if we're showing regions or districts
        if (!$selectedRegionID) {
          // Region view - find the region data by region ID
          const areaData = data.find(
            (row) => row.regionID === d.properties.region_id,
          );
          return color(areaData?.vaccineStock || 0);
        } else {
          // District view - find the district data by district ID
          const areaData = data.find(
            (row) => row.districtID === d.properties.concl_d,
          );
          return color(areaData?.vaccineStock || 0);
        }
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
