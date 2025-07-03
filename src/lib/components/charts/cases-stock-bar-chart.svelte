<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import * as d3 from "d3";
  import {
    selectedRegionID,
    selectedDistrictID,
    selectedMonth,
  } from "$lib/stores/uiStore";
  import {
    getPatientAndStockNumbers,
    type RegionCasesStockData,
    getAllRegionsAndDistricts,
  } from "$data/api";
  import LoadingSpinner from "$lib/components/ui/LoadingSpinner.svelte";

  let data: RegionCasesStockData[] = [];
  let chartContainer: HTMLDivElement | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let isLoading = true;
  let regionDistrictMap: Map<
    string,
    { name: string; districts: Map<string, string> }
  > = new Map();

  function getChartDimensions() {
    // Make the chart fill the parent div (minus button space)
    if (!chartContainer) return { width: 600, height: 400 };
    const width = chartContainer.clientWidth || 600;
    // Use almost all vertical space, minus ~60px for the button and padding
    const parentHeight = chartContainer.parentElement?.clientHeight || 400;
    // Leave 60px for the button and some margin
    const height = Math.max(200, parentHeight - 60);
    return { width, height };
  }

  // Build a map of region IDs to names and district IDs to names
  async function buildRegionDistrictMap() {
    const regionsAndDistricts = await getAllRegionsAndDistricts();
    regionsAndDistricts.forEach((item) => {
      if (!regionDistrictMap.has(item.regionID)) {
        regionDistrictMap.set(item.regionID, {
          name: item.regionName,
          districts: new Map(),
        });
      }

      const region = regionDistrictMap.get(item.regionID);
      if (region) {
        region.districts.set(item.districtID, item.districtName);
      }
    });
  }

  // Subscribe to stores and refetch/redraw on change
  let unsubscribeRegionID: (() => void) | null = null;
  let unsubscribeDistrictID: (() => void) | null = null;
  let unsubscribeSelectedMonth: (() => void) | null = null;

  async function fetchAndDraw(
    regionID: string | null,
    districtID: string | null,
    selectedMonthValue: string,
  ) {
    console.log("Bar Chart: fetchAndDraw called with", {
      regionID,
      districtID,
      selectedMonthValue,
    });
    isLoading = true;

    try {
      data = await getPatientAndStockNumbers(
        regionID,
        districtID,
        selectedMonthValue,
      );
      console.log(
        "Bar Chart: fetchAndDraw - data fetched",
        data.length,
        "items",
      );
      // Don't call drawChart() directly - let reactive statement handle it
    } finally {
      isLoading = false;
    }
  }

  // Set up resize observer when chart container becomes available
  function setupResizeObserver() {
    // Only set up if we don't already have one and container exists
    if (chartContainer && !resizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        console.log(
          "Bar Chart: ResizeObserver triggered, chartContainer:",
          !!chartContainer,
          "isLoading:",
          isLoading,
          "data.length:",
          data.length,
        );
        if (chartContainer && !isLoading && data.length > 0) {
          drawChart();
        }
      });
      resizeObserver.observe(chartContainer);
      console.log("Bar Chart: ResizeObserver set up");
    }
  }

  // Clean up resize observer
  function cleanupResizeObserver() {
    if (resizeObserver) {
      if (chartContainer) {
        resizeObserver.unobserve(chartContainer);
      }
      resizeObserver.disconnect();
      resizeObserver = null;
      console.log("Bar Chart: ResizeObserver cleaned up");
    }
  }

  // Reactive statement to set up resize observer when chartContainer is ready
  $: if (chartContainer) {
    // Check if the container is empty (was cleared) and we need to re-setup
    if (!resizeObserver || chartContainer.children.length === 0) {
      cleanupResizeObserver();
      setupResizeObserver();
    }
  }

  // Reactive statement to redraw chart when container and data are ready
  $: if (chartContainer && data && !isLoading) {
    console.log(
      "Bar Chart: Reactive redraw triggered, data.length:",
      data.length,
    );
    drawChart();
  }

  onMount(async () => {
    // Build the region/district map for lookups
    await buildRegionDistrictMap();

    let currentRegionID: string | null = null;
    let currentDistrictID: string | null = null;
    let currentSelectedMonth: string = "";

    unsubscribeRegionID = selectedRegionID.subscribe((regionID) => {
      currentRegionID = regionID;
      fetchAndDraw(currentRegionID, currentDistrictID, currentSelectedMonth);
    });

    unsubscribeDistrictID = selectedDistrictID.subscribe((districtID) => {
      currentDistrictID = districtID;
      fetchAndDraw(currentRegionID, currentDistrictID, currentSelectedMonth);
    });

    unsubscribeSelectedMonth = selectedMonth.subscribe((month) => {
      currentSelectedMonth = month;
      fetchAndDraw(currentRegionID, currentDistrictID, currentSelectedMonth);
    });

    // Initial fetch - will be triggered by subscriptions above
  });

  // Handle cleanup when component is destroyed
  onDestroy(() => {
    if (unsubscribeRegionID) unsubscribeRegionID();
    if (unsubscribeDistrictID) unsubscribeDistrictID();
    if (unsubscribeSelectedMonth) unsubscribeSelectedMonth();
    cleanupResizeObserver();
  });

  function handleBarClick(d: RegionCasesStockData) {
    // If a region is selected, clicking a bar means select a district
    // If no region is selected, clicking a bar means select a region
    if ($selectedRegionID && d.districtID) {
      selectedDistrictID.set(d.districtID ?? null);
    } else if (d.regionID) {
      selectedRegionID.set(d.regionID ?? null);
      selectedDistrictID.set(null);
    }
  }

  function drawChart() {
    console.log(
      "Bar Chart: drawChart called, chartContainer:",
      !!chartContainer,
      "data.length:",
      data?.length || 0,
    );

    if (!chartContainer) {
      console.log("Bar Chart: drawChart aborted - no chartContainer");
      return;
    }

    if (!data || data.length === 0) {
      console.log("Bar Chart: drawChart - no data, showing message");
    }

    chartContainer.innerHTML = "";

    // If no data, show a message instead of rendering empty chart
    if (!data.length) {
      const messageDiv = document.createElement("div");
      messageDiv.className =
        "flex items-center justify-center h-full text-gray-500 text-lg";
      messageDiv.textContent = "No data available for the selected filters";
      chartContainer.appendChild(messageDiv);
      return;
    }

    console.log(
      "Bar Chart: drawChart - starting chart render with",
      data.length,
      "data points",
    );

    const margin = { top: 40, right: 100, bottom: 80, left: 80 };
    const { width, height } = getChartDimensions();
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(chartContainer)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Tooltip div
    const tooltip = d3
      .select(chartContainer)
      .append("div")
      .attr(
        "class",
        "absolute z-50 bg-white border border-gray-300 rounded px-3 py-2 text-sm text-slate-800 shadow-lg pointer-events-none",
      )
      .style("opacity", 0)
      .style("position", "absolute");

    // X axis: use facilityName if present, else districtName, else regionName
    const xLabels = data.map(
      (d) => d.facilityName || d.districtName || d.regionName,
    );
    const x = d3
      .scaleBand()
      .domain(xLabels)
      .range([0, innerWidth])
      .padding(0.2);
    svg
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).tickSize(0))
      .call(d3.axisBottom(x).tickPadding(10))
      .selectAll("text")
      .attr("transform", "rotate(45)")
      .style("text-anchor", "start")
      .classed("text-base", true);

    // Y axis for unique patients (left)
    const yLeft = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.uniquePatients) || 1])
      .range([innerHeight, 0]);
    svg.append("g").call(d3.axisLeft(yLeft)).classed("text-base", true);

    // Y axis for vaccine stock (right)
    const yRight = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.vaccineStock) || 1])
      .range([innerHeight, 0]);
    svg
      .append("g")
      .attr("transform", `translate(${innerWidth},0)`)
      .call(d3.axisRight(yRight))
      .classed("text-base", true);

    // Tooltip event handlers
    function showTooltip(
      event: MouseEvent,
      d: RegionCasesStockData,
      type: "patients" | "stock",
    ) {
      let label = d.regionName;
      if (d.districtName) {
        label = `${d.districtName}, ${d.regionName}`;
      }
      if (d.facilityName) {
        label = `${d.facilityName}, ${d.districtName}, ${d.regionName}`;
      }
      let value = type === "patients" ? d.uniquePatients : d.vaccineStock;
      let valueLabel =
        type === "patients" ? "Unique Patients" : "Vaccine Vials";
      let regionNote = "";
      if (!d.districtName) {
        regionNote =
          '<div class="text-xs text-gray-500">(Sum across all districts in this region)</div>';
      } else if (!d.facilityName) {
        regionNote =
          '<div class="text-xs text-gray-500">(Sum across all facilities in this district)</div>';
      }

      // Get mouse position relative to the chart container
      const [mouseX, mouseY] = d3.pointer(event, chartContainer);

      tooltip
        .html(
          `<div><strong>${label}</strong></div>` +
            `<div>${valueLabel}: <span class="font-bold">${value.toLocaleString()}</span></div>` +
            regionNote,
        )
        .style("left", mouseX + 10 + "px")
        .style("top", mouseY - 40 + "px")
        .transition()
        .duration(100)
        .style("opacity", 1);
    }
    function hideTooltip() {
      tooltip.transition().duration(100).style("opacity", 0);
    }

    // Bars for unique patients (left axis)
    svg
      .selectAll("rect.patients")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "patients")
      .attr("x", (d) => x(d.facilityName || d.districtName || d.regionName)!)
      .attr("y", (d) => {
        // For zero values, position the bar at the bottom
        return d.uniquePatients === 0
          ? innerHeight - 1
          : yLeft(d.uniquePatients);
      })
      .attr("width", x.bandwidth() / 2)
      .attr("height", (d) => {
        // Give zero values a minimum height of 1 pixel so they're visible
        return d.uniquePatients === 0
          ? 1
          : innerHeight - yLeft(d.uniquePatients);
      })
      .attr("fill", (d) => (d.uniquePatients === 0 ? "#e5e7eb" : "#2563eb")) // Light gray for zero values
      .attr("stroke", "#334155")
      .attr("stroke-width", 0.5)
      .attr("cursor", "pointer")
      .on("mousemove", function (event, d) {
        showTooltip(event, d as RegionCasesStockData, "patients");
      })
      .on("mouseleave", hideTooltip)
      .on("click", function (event, d) {
        handleBarClick(d as RegionCasesStockData);
      });

    // Bars for vaccine stock (right axis)
    svg
      .selectAll("rect.stock")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "stock")
      .attr(
        "x",
        (d) =>
          x(d.facilityName || d.districtName || d.regionName)! +
          x.bandwidth() / 2,
      )
      .attr("y", (d) => {
        // For zero values, position the bar at the bottom
        return d.vaccineStock === 0 ? innerHeight - 1 : yRight(d.vaccineStock);
      })
      .attr("width", x.bandwidth() / 2)
      .attr("height", (d) => {
        // Give zero values a minimum height of 1 pixel so they're visible
        return d.vaccineStock === 0 ? 1 : innerHeight - yRight(d.vaccineStock);
      })
      .attr("fill", (d) => (d.vaccineStock === 0 ? "#f3f4f6" : "#fbbf24")) // Light gray for zero values
      .attr("stroke", "#334155")
      .attr("stroke-width", 0.5)
      .attr("cursor", "pointer")
      .on("mousemove", function (event, d) {
        showTooltip(event, d as RegionCasesStockData, "stock");
      })
      .on("mouseleave", hideTooltip)
      .on("click", function (event, d) {
        handleBarClick(d as RegionCasesStockData);
      });

    // Add y axis label (left)
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 15)
      .attr("x", -innerHeight / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#334155")
      .text("Unique Patients");

    // Add y axis label (right)
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", innerWidth + margin.right - 10)
      .attr("x", -innerHeight / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#b45309")
      .text("Vaccine Vials");

    // Add legend background box (make it wider and taller to fit text)
    svg
      .append("rect")
      .attr("x", innerWidth - 230 - 10)
      .attr("y", 0)
      .attr("width", 230)
      .attr("height", 96) // Increased height for the third legend item
      .attr("fill", "#fff")
      .attr("stroke", "#334155")
      .attr("stroke-width", 1);

    // Add legend items (squares and text)
    svg
      .append("rect")
      .attr("x", innerWidth - 230)
      .attr("y", 10)
      .attr("width", 16)
      .attr("height", 16)
      .attr("fill", "#2563eb")
      .attr("stroke", "#334155")
      .attr("stroke-width", 1);
    svg
      .append("text")
      .attr("x", innerWidth - 230 + 16 + 10)
      .attr("y", 10 + 8 + 1)
      .attr("alignment-baseline", "middle")
      .attr("fill", "#334155")
      .text("Unique Patients");
    svg
      .append("rect")
      .attr("x", innerWidth - 230)
      .attr("y", 10 + 16 + 10)
      .attr("width", 16)
      .attr("height", 16)
      .attr("fill", "#fbbf24")
      .attr("stroke", "#334155")
      .attr("stroke-width", 1);
    svg
      .append("text")
      .attr("x", innerWidth - 230 + 16 + 10)
      .attr("y", 10 + 16 + 10 + 8 + 1)
      .attr("alignment-baseline", "middle")
      .attr("fill", "#334155")
      .text("Vaccine Vials");
    svg
      .append("rect")
      .attr("x", innerWidth - 230)
      .attr("y", 10 + 32 + 20)
      .attr("width", 16)
      .attr("height", 16)
      .attr("fill", "#e5e7eb")
      .attr("stroke", "#334155")
      .attr("stroke-width", 1);
    svg
      .append("text")
      .attr("x", innerWidth - 230 + 16 + 10)
      .attr("y", 10 + 32 + 20 + 8 + 1)
      .attr("alignment-baseline", "middle")
      .attr("fill", "#334155")
      .text("No Data/Zero Values");

    // Style axes text and labels and legend text
    svg.selectAll(".tick text").attr("fill", "#334155");
    svg.selectAll(".domain, .tick line").attr("stroke", "#334155");
    // Style y axis labels (left and right)
    svg
      .selectAll("text")
      .filter(function () {
        const txt = d3.select(this).text();
        return txt === "Unique Patients" || txt === "Vaccine Vials";
      })
      .attr("fill", "#334155");
  }
</script>

<!-- Chart fills the parent card, leaving space for the button at the bottom -->
<div class="flex h-full w-full flex-col">
  {#if isLoading}
    <div class="flex h-full w-full items-center justify-center">
      <LoadingSpinner size="lg" message="Loading cases and stock data..." />
    </div>
  {:else}
    <div class="relative min-h-[200px] flex-1" bind:this={chartContainer}></div>
  {/if}
</div>
