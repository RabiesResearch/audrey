<script lang="ts">
  import { onMount } from "svelte";
  import * as d3 from "d3";
  import { selectedRegion, selectedDistrict } from "$lib/stores/uiStore";
  import { getPatientAndStockNumbers, type RegionCasesStockData } from "$data/api";

  let data: RegionCasesStockData[] = [];
  let chartContainer: HTMLDivElement;

  // Only fetch and draw on the client
  onMount(() => {
    async function fetchAndDraw() {
      data = await getPatientAndStockNumbers($selectedRegion, $selectedDistrict);
      drawChart();
    }
    fetchAndDraw();
  });

  $: if (chartContainer && data.length) {
    drawChart();
  }

  function drawChart() {
    if (!chartContainer) return;
    chartContainer.innerHTML = "";
    if (!data.length) return;

    const margin = { top: 40, right: 60, bottom: 80, left: 60 };
    const width = chartContainer.clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3
      .select(chartContainer)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Tooltip div
    const tooltip = d3.select(chartContainer)
      .append("div")
      .attr("class", "absolute z-50 bg-white border border-gray-300 rounded px-3 py-2 text-sm text-slate-800 shadow-lg pointer-events-none")
      .style("opacity", 0)
      .style("position", "absolute");

    // X axis
    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.districtName || d.regionName))
      .range([0, width])
      .padding(0.2);
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(45)")
      .style("text-anchor", "start");

    // Y axis for unique patients (left)
    const yLeft = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.uniquePatients) || 1])
      .range([height, 0]);
    svg.append("g").call(d3.axisLeft(yLeft));

    // Y axis for vaccine stock (right)
    const yRight = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.vaccineStock) || 1])
      .range([height, 0]);
    svg
      .append("g")
      .attr("transform", `translate(${width},0)`)
      .call(d3.axisRight(yRight));

    // Tooltip event handlers
    function showTooltip(event, d, type) {
      let label = d.regionName;
      if (d.districtName) {
        label += `, ${d.districtName}`;
      }
      let value = type === 'patients' ? d.uniquePatients : d.vaccineStock;
      let valueLabel = type === 'patients' ? 'Unique Patients' : 'Vaccine Vials';
      let regionNote = '';
      if (!d.districtName) {
        regionNote = '<div class="text-xs text-gray-500">(Sum across all districts in this region)</div>';
      }
      tooltip
        .html(
          `<div><strong>${label}</strong></div>` +
          `<div>${valueLabel}: <span class="font-bold">${value}</span></div>` +
          regionNote
        )
        .style("left", (event.clientX + 20) + "px")
        .style("top", (event.clientY - 10) + "px")
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
      .attr("x", (d) => x(d.districtName || d.regionName)!)
      .attr("y", (d) => yLeft(d.uniquePatients))
      .attr("width", x.bandwidth() / 2)
      .attr("height", (d) => height - yLeft(d.uniquePatients))
      .attr("fill", "#2563eb")
      .on("mousemove", function(event, d) { showTooltip(event, d, 'patients'); })
      .on("mouseleave", hideTooltip);

    // Bars for vaccine stock (right axis)
    svg
      .selectAll("rect.stock")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "stock")
      .attr("x", (d) => x(d.districtName || d.regionName)! + x.bandwidth() / 2)
      .attr("y", (d) => yRight(d.vaccineStock))
      .attr("width", x.bandwidth() / 2)
      .attr("height", (d) => height - yRight(d.vaccineStock))
      .attr("fill", "#fbbf24")
      .on("mousemove", function(event, d) { showTooltip(event, d, 'stock'); })
      .on("mouseleave", hideTooltip);

    // Add y axis label (left)
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 15)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#334155")
      .style("font-size", "14px")
      .text("Unique Patients");

    // Add y axis label (right)
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", width + margin.right - 10)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#b45309")
      .style("font-size", "14px")
      .text("Vaccine Vials");

    // Add legend
    svg
      .append("rect")
      .attr("x", width - 120)
      .attr("y", -30)
      .attr("width", 16)
      .attr("height", 16)
      .attr("fill", "#2563eb");
    svg
      .append("text")
      .attr("x", width - 100)
      .attr("y", -18)
      .attr("alignment-baseline", "middle")
      .attr("fill", "#2563eb")
      .style("font-size", "13px")
      .text("Unique Patients");
    svg
      .append("rect")
      .attr("x", width - 120)
      .attr("y", -10)
      .attr("width", 16)
      .attr("height", 16)
      .attr("fill", "#fbbf24");
    svg
      .append("text")
      .attr("x", width - 100)
      .attr("y", 2)
      .attr("alignment-baseline", "middle")
      .attr("fill", "#fbbf24")
      .style("font-size", "13px")
      .text("Vaccine Vials");
  }
</script>

<div class="h-[400px] w-full" bind:this={chartContainer}></div>
