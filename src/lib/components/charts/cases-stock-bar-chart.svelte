<script lang="ts">
  import { onMount } from "svelte";
  import * as d3 from "d3";
  import { selectedRegion, selectedDistrict } from "$lib/stores/uiStore";
  import { getPatientAndStockNumbers, type RegionCasesStockData } from "$data/api";

  let data: RegionCasesStockData[] = [];
  let chartContainer: HTMLDivElement;

  // Subscribe to stores and refetch/redraw on change
  let unsubscribeRegion: () => void;
  let unsubscribeDistrict: () => void;

  async function fetchAndDraw(region: string|null, district: string|null) {
    data = await getPatientAndStockNumbers(region, district);
    drawChart();
  }

  onMount(() => {
    let currentRegion: string|null = null;
    let currentDistrict: string|null = null;
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
    return () => {
      unsubscribeRegion();
      unsubscribeDistrict();
    };
  });

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

    // X axis: use facilityName if present, else districtName, else regionName
    const xLabels = data.map((d) => d.facilityName || d.districtName || d.regionName);
    const x = d3
      .scaleBand()
      .domain(xLabels)
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
    function showTooltip(event: MouseEvent, d: RegionCasesStockData, type: 'patients' | 'stock') {
      let label = d.regionName;
      if (d.districtName) {
        label += `, ${d.districtName}`;
      }
      if (d.facilityName) {
        label += `, ${d.facilityName}`;
      }
      let value = type === 'patients' ? d.uniquePatients : d.vaccineStock;
      let valueLabel = type === 'patients' ? 'Unique Patients' : 'Vaccine Vials';
      let regionNote = '';
      if (!d.districtName) {
        regionNote = '<div class="text-xs text-gray-500">(Sum across all districts in this region)</div>';
      } else if (!d.facilityName) {
        regionNote = '<div class="text-xs text-gray-500">(Sum across all facilities in this district)</div>';
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
      .attr("x", (d) => x(d.facilityName || d.districtName || d.regionName)!)
      .attr("y", (d) => yLeft(d.uniquePatients))
      .attr("width", x.bandwidth() / 2)
      .attr("height", (d) => height - yLeft(d.uniquePatients))
      .attr("fill", "#2563eb")
      .on("mousemove", function(event, d) { showTooltip(event, d, 'patients'); })
      .on("mouseleave", hideTooltip)
      .on("click", function(event, d) { handleBarClick(d); });

    // Bars for vaccine stock (right axis)
    svg
      .selectAll("rect.stock")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "stock")
      .attr("x", (d) => x(d.facilityName || d.districtName || d.regionName)! + x.bandwidth() / 2)
      .attr("y", (d) => yRight(d.vaccineStock))
      .attr("width", x.bandwidth() / 2)
      .attr("height", (d) => height - yRight(d.vaccineStock))
      .attr("fill", "#fbbf24")
      .on("mousemove", function(event, d) { showTooltip(event, d, 'stock'); })
      .on("mouseleave", hideTooltip)
      .on("click", function(event, d) { handleBarClick(d); });

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

    // Add legend background box (make it wider and taller to fit text)
    svg
      .append("rect")
      .attr("x", width - 140)
      .attr("y", -40)
      .attr("width", 135)
      .attr("height", 54)
      .attr("fill", "#fff")
      .attr("stroke", "#334155")
      .attr("stroke-width", 1)
      .lower();

    // Add legend items (squares and text)
    svg
      .append("rect")
      .attr("x", width - 125)
      .attr("y", -30)
      .attr("width", 16)
      .attr("height", 16)
      .attr("fill", "#2563eb")
      .attr("stroke", "#334155")
      .attr("stroke-width", 1);
    svg
      .append("text")
      .attr("x", width - 105)
      .attr("y", -20)
      .attr("alignment-baseline", "middle")
      .attr("fill", "#334155")
      .style("font-size", "13px")
      .text("Unique Patients");
    svg
      .append("rect")
      .attr("x", width - 125)
      .attr("y", -10)
      .attr("width", 16)
      .attr("height", 16)
      .attr("fill", "#fbbf24")
      .attr("stroke", "#334155")
      .attr("stroke-width", 1);
    svg
      .append("text")
      .attr("x", width - 105)
      .attr("y", 0)
      .attr("alignment-baseline", "middle")
      .attr("fill", "#334155")
      .style("font-size", "13px")
      .text("Vaccine Vials");

    // Style axes text and labels and legend text
    svg.selectAll('.tick text')
      .attr('fill', '#334155');
    svg.selectAll('.domain, .tick line')
      .attr('stroke', '#334155');
    // Style y axis labels (left and right)
    svg.selectAll('text')
      .filter(function() {
        const txt = d3.select(this).text();
        return txt === 'Unique Patients' || txt === 'Vaccine Vials';
      })
      .attr('fill', '#334155');
  }
</script>

<div class="h-[400px] w-full" bind:this={chartContainer}></div>
