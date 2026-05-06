/**
 * Extract postcode centroids from ABS POA 2021 shapefile.
 *
 * Reads the polygon boundaries, computes the centroid of each POA,
 * and writes postcode-centroids.json with real ABS-derived coordinates.
 *
 * Usage:
 *   node scripts/process-abs-centroids.mjs <path-to-POA_2021_AUST_GDA2020.shp>
 *
 * The output replaces the interpolated centroids with accurate polygon centroids.
 */

import { open } from "shapefile";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const shpPath = process.argv[2];
if (!shpPath) {
  console.error("Usage: node scripts/process-abs-centroids.mjs <path-to-.shp>");
  process.exit(1);
}

// Load current master dataset to know which postcodes we care about
const dataPath = resolve(__dirname, "../src/data/postcodes.json");
const DATA = JSON.parse(readFileSync(dataPath, "utf8"));
const STATES = DATA.s;
const RECORDS = DATA.d;

// Build set of postcodes in our dataset
const knownPostcodes = new Set();
RECORDS.forEach(r => {
  knownPostcodes.add(r[0]);
});

console.log(`Master dataset has ${knownPostcodes.size} unique postcodes`);

// Also load existing centroids to see what we're replacing
const existingPath = resolve(__dirname, "../src/data/postcode-centroids.json");
const existing = JSON.parse(readFileSync(existingPath, "utf8"));
console.log(`Existing centroids: ${Object.keys(existing).length} postcodes`);

// Compute centroid of a polygon (array of [lon, lat] coordinate rings)
function polygonCentroid(coords) {
  // Use all rings (outer + holes), weighted by area
  // For simplicity, use the arithmetic mean of the outer ring vertices
  const ring = coords[0]; // outer ring
  if (!ring || ring.length === 0) return null;

  let sumLat = 0, sumLon = 0, n = 0;
  // Use signed-area-weighted centroid for better accuracy
  let area = 0, cx = 0, cy = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const x0 = ring[i][0], y0 = ring[i][1];
    const x1 = ring[i + 1][0], y1 = ring[i + 1][1];
    const a = x0 * y1 - x1 * y0;
    area += a;
    cx += (x0 + x1) * a;
    cy += (y0 + y1) * a;
  }
  area *= 0.5;
  if (Math.abs(area) < 1e-10) {
    // Degenerate polygon — fall back to simple average
    for (const [lon, lat] of ring) {
      sumLon += lon;
      sumLat += lat;
      n++;
    }
    return n > 0 ? [sumLat / n, sumLon / n] : null;
  }
  cx /= (6 * area);
  cy /= (6 * area);
  return [cy, cx]; // [lat, lon]
}

// Compute centroid for MultiPolygon (multiple polygon parts)
function multiPolygonCentroid(polygons) {
  // Weight each polygon's centroid by its area
  let totalArea = 0;
  let wLat = 0, wLon = 0;

  for (const coords of polygons) {
    const ring = coords[0];
    if (!ring || ring.length < 3) continue;

    let area = 0;
    for (let i = 0; i < ring.length - 1; i++) {
      area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
    }
    area = Math.abs(area * 0.5);

    const c = polygonCentroid(coords);
    if (c) {
      wLat += c[0] * area;
      wLon += c[1] * area;
      totalArea += area;
    }
  }

  if (totalArea === 0) return null;
  return [wLat / totalArea, wLon / totalArea];
}

// Read shapefile and extract centroids
const centroids = {};
const source = await open(shpPath);
let count = 0;
let matched = 0;

while (true) {
  const result = await source.read();
  if (result.done) break;

  const feature = result.value;
  count++;

  // POA_CODE21 or POA_CODE_2021 — the postcode string
  const poaCode = feature.properties.POA_CODE21
    || feature.properties.POA_CODE_2021
    || feature.properties.POA_CODE
    || "";

  const pc = parseInt(poaCode, 10);
  if (isNaN(pc) || pc <= 0) continue;

  // Only include postcodes in our master dataset
  if (!knownPostcodes.has(pc)) continue;

  const geom = feature.geometry;
  let centroid = null;

  if (geom.type === "Polygon") {
    centroid = polygonCentroid(geom.coordinates);
  } else if (geom.type === "MultiPolygon") {
    centroid = multiPolygonCentroid(geom.coordinates);
  }

  if (centroid) {
    // Round to 4 decimal places (~11m precision)
    centroids[pc] = [
      Math.round(centroid[0] * 10000) / 10000,
      Math.round(centroid[1] * 10000) / 10000,
    ];
    matched++;
  }
}

console.log(`\nProcessed ${count} POA features`);
console.log(`Matched ${matched} postcodes in our dataset`);

// Check NSW coverage specifically
const nswPostcodes = new Set();
RECORDS.forEach(r => {
  if (STATES[r[1]] === "NSW") nswPostcodes.add(r[0]);
});
const nswWithCentroid = [...nswPostcodes].filter(pc => centroids[pc]).length;
console.log(`NSW coverage: ${nswWithCentroid}/${nswPostcodes.size} postcodes`);

// Write output
const outPath = resolve(__dirname, "../src/data/postcode-centroids.json");
writeFileSync(outPath, JSON.stringify(centroids));

const sizeKB = Math.round(JSON.stringify(centroids).length / 1024);
console.log(`\nWrote ${Object.keys(centroids).length} centroids to postcode-centroids.json (${sizeKB} KB)`);

// Report what changed vs old
const oldKeys = new Set(Object.keys(existing));
const newKeys = new Set(Object.keys(centroids));
const added = [...newKeys].filter(k => !oldKeys.has(k)).length;
const removed = [...oldKeys].filter(k => !newKeys.has(k)).length;
const updated = [...newKeys].filter(k => oldKeys.has(k)).length;
console.log(`Changes: ${added} added, ${removed} removed, ${updated} updated`);
