import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";
import { resolve } from "path";
import { defineConfig } from "vite";

// Function to create symbolic links from tan-gis geojson files to static directory
function linkTanGisFiles() {
  return {
    name: "link-tan-gis-files",
    buildStart() {
      // Path to geojson files in tan-gis
      const geojsonDir = resolve(__dirname, "src/lib/tan-gis/data/geojson");
      const staticDir = resolve(__dirname, "static/geojson");

      // If the geojson directory exists
      if (fs.existsSync(geojsonDir)) {
        // Get all geojson files
        const geojsonFiles = fs
          .readdirSync(geojsonDir)
          .filter((file) => file.endsWith(".geojson"));

        // Create symbolic links for each file
        geojsonFiles.forEach((file) => {
          const sourcePath = resolve(geojsonDir, file);
          const destPath = resolve(staticDir, file);

          // Only create link if destination doesn't exist or is outdated
          if (
            !fs.existsSync(destPath) ||
            fs.statSync(sourcePath).mtime > fs.statSync(destPath).mtime
          ) {
            // Copy file instead of creating a symbolic link (more reliable)
            try {
              fs.copyFileSync(sourcePath, destPath);
              console.log(`Copied ${file} to static directory`);
            } catch (error) {
              if (error instanceof Error) {
                console.error(`Error copying ${file}: ${error.message}`);
              } else {
                console.error(`Error copying ${file}:`, error);
              }
            }
          }
        });
      }
    },
  };
}

export default defineConfig({
  plugins: [sveltekit(), tailwindcss(), linkTanGisFiles()],
});
