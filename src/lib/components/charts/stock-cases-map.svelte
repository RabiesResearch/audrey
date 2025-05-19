<script lang="ts">
import { onMount } from "svelte";
import * as d3 from "d3";
import { getPatientAndStockNumbers } from "$lib/data/api";

let svgContainer: HTMLDivElement | null = null;
let width = 600;
let height = 600;
let regionGeoJson: any = null;
let regionVialData: Record<string, number> = {};

async function drawMap() {
  if (!svgContainer) return;
  svgContainer.innerHTML = "";

  // Load GeoJSON for Tanzania regions (assume pre-converted from SHP)
  // You would normally fetch this from a static file, e.g. /static/tz_regions_2022.geojson
  // For this example, we assume it's available as an import or fetched here
  // regionGeoJson = await d3.json("/static/tz_regions_2022.geojson");
  // For now, regionGeoJson must be provided in the project for this to work
  if (!regionGeoJson) return;

  // Get region vial data
  const regionData = await getPatientAndStockNumbers(null, null);
  regionVialData = {};
  for (const d of regionData) {
    regionVialData[d.regionName] = d.vaccineStock;
  }

  // D3 projection and path
  const projection = d3.geoMercator()
    .fitSize([width, height], regionGeoJson);
  const path = d3.geoPath().projection(projection);

  // Color scale for vials
  const vialValues = Object.values(regionVialData);
  const color = d3.scaleSequential(d3.interpolateYlGnBu)
    .domain([d3.min(vialValues) || 0, d3.max(vialValues) || 1]);

  const svg = d3.select(svgContainer)
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  svg.append("g")
    .selectAll("path")
    .data(regionGeoJson.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", (d: any) => {
      const regionName = d.properties.region_name || d.properties.name || d.properties.REGION_NAME;
      const vials = regionVialData[regionName] || 0;
      return color(vials);
    })
    .attr("stroke", "#334155")
    .attr("stroke-width", 1)
    .on("mouseover", function (event, d: any) {
      d3.select(this).attr("fill", "#fbbf24");
    })
    .on("mouseout", function (event, d: any) {
      const regionName = d.properties.region_name || d.properties.name || d.properties.REGION_NAME;
      const vials = regionVialData[regionName] || 0;
      d3.select(this).attr("fill", color(vials));
    });

  // Add legend (simple gradient bar)
  const legendWidth = 200;
  const legendHeight = 16;
  const legendSvg = svg.append("g")
    .attr("transform", `translate(${width - legendWidth - 30},${height - 40})`);

  const defs = svg.append("defs");
  const linearGradient = defs.append("linearGradient")
    .attr("id", "legend-gradient");
  linearGradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", color.range()[0]);
  linearGradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", color.range()[1]);

  legendSvg.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legend-gradient)");

  // Legend axis
  const legendScale = d3.scaleLinear()
    .domain(color.domain() as [number, number])
    .range([0, legendWidth]);
  const legendAxis = d3.axisBottom(legendScale)
    .ticks(5)
    .tickFormat(d3.format(".0f"));
  legendSvg.append("g")
    .attr("transform", `translate(0,${legendHeight})`)
    .call(legendAxis);
}

onMount(() => {
  // Fetch the GeoJSON file that was converted from the shapefile
  d3.json("/geojson/tz_regions_2022.geojson").then(json => { 
    regionGeoJson = json; 
    drawMap(); 
  }).catch(error => {
    console.error("Error loading Tanzania regions GeoJSON:", error);
    // Display an error message in the SVG container
    if (svgContainer) {
      d3.select(svgContainer)
        .append("div")
        .attr("class", "text-red-500 text-center p-4")
        .text("Error loading map data. Please run the shapefile conversion script first.");
    }
  });
});
</script>

<div class="w-full h-full" bind:this={svgContainer}></div>
