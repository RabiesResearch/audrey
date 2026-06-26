// Regenerates src/lib/server/data/ward-points.json (tangis_ward_id → [lng, lat])
// from the tan-gis submodule, which is the source of record. Re-run after bumping
// the submodule:  npm run gen:ward-points
import { readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = resolve(
  root,
  "src/lib/tan-gis/data/processed/wards_master_2022.csv",
);
const OUT = resolve(root, "src/lib/server/data/ward-points.json");

const lines = readFileSync(SRC, "utf8").trim().split(/\r?\n/);
const header = lines[0].split(",");
const iWard = header.indexOf("ward_id");
const iLng = header.indexOf("longitude");
const iLat = header.indexOf("latitude");
if (iWard < 0 || iLng < 0 || iLat < 0) {
  throw new Error(
    `${SRC} is missing ward_id/longitude/latitude columns — check the submodule`,
  );
}

const points = {};
for (const line of lines.slice(1)) {
  const cols = line.split(",");
  const id = cols[iWard]?.trim();
  const lng = Number(cols[iLng]);
  const lat = Number(cols[iLat]);
  if (!id || !Number.isFinite(lng) || !Number.isFinite(lat)) continue;
  points[id] = [Number(lng.toFixed(6)), Number(lat.toFixed(6))];
}

const sorted = {};
for (const id of Object.keys(points).sort()) sorted[id] = points[id];
writeFileSync(OUT, JSON.stringify(sorted));
console.log(`Wrote ${Object.keys(sorted).length} ward points → ${OUT}`);
