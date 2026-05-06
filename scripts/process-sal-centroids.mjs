/**
 * Extract suburb/locality centroids from ABS SAL 2021 shapefile.
 *
 * Matches SAL polygon names to our AusPost PC001 localities,
 * computes centroids, and writes suburb-centroids.json aligned
 * to the order in localities.json so names don't need repeating.
 *
 * Format:  { "2000": [[lat,lon],[lat,lon],...], ... }
 * Each inner array is aligned to localities.json[postcode] order.
 * Entries are null when no SAL polygon matched that locality name.
 *
 * Usage:
 *   node scripts/process-sal-centroids.mjs <path-to-SAL_2021_AUST_GDA2020.shp>
 */

import { open } from "shapefile";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const shpPath = process.argv[2];
if (!shpPath) {
  console.error("Usage: node scripts/process-sal-centroids.mjs <path-to-.shp>");
  process.exit(1);
}

// Load localities (AusPost PC001)
const locsPath = resolve(__dirname, "../src/data/localities.json");
const LOCS = JSON.parse(readFileSync(locsPath, "utf8"));

// Load postcodes to get state info for disambiguation
const pcPath = resolve(__dirname, "../src/data/postcodes.json");
const PC = JSON.parse(readFileSync(pcPath, "utf8"));
const STATES = PC.s;
const DATA = PC.d;

// Build postcode → state map
const pcState = {};
DATA.forEach(r => {
  if (!pcState[r[0]]) pcState[r[0]] = STATES[r[1]];
});

// ABS state code → abbreviation
const ABS_STATE = {
  "1": "NSW", "2": "VIC", "3": "QLD", "4": "SA",
  "5": "WA", "6": "TAS", "7": "NT", "8": "ACT", "9": "OT",
};

// Build reverse lookup: UPPER name → [{ pc, idx }]
// idx = position in localities.json[pc] array
const nameIndex = {};
for (const [pc, names] of Object.entries(LOCS)) {
  names.forEach((name, idx) => {
    const key = name.toUpperCase();
    if (!nameIndex[key]) nameIndex[key] = [];
    nameIndex[key].push({ pc: Number(pc), idx });
  });
}

console.log(`Localities: ${Object.keys(LOCS).length} postcodes, ${Object.values(LOCS).reduce((s, a) => s + a.length, 0)} entries`);
console.log(`Unique locality names: ${Object.keys(nameIndex).length}`);

// Centroid from polygon outer ring (signed-area-weighted)
function centroid(geom) {
  let ring;
  if (geom.type === "Polygon") {
    ring = geom.coordinates[0];
  } else if (geom.type === "MultiPolygon") {
    // Use largest polygon by area
    let maxArea = 0;
    for (const poly of geom.coordinates) {
      const r = poly[0];
      if (!r || r.length < 3) continue;
      let a = 0;
      for (let i = 0; i < r.length - 1; i++) {
        a += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1];
      }
      a = Math.abs(a * 0.5);
      if (a > maxArea) { maxArea = a; ring = r; }
    }
  }
  if (!ring || ring.length < 3) return null;

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
    // Degenerate — simple average
    let sLat = 0, sLon = 0;
    for (const [lon, lat] of ring) { sLon += lon; sLat += lat; }
    return [Math.round(sLat / ring.length * 1000) / 1000, Math.round(sLon / ring.length * 1000) / 1000];
  }
  cx /= (6 * area);
  cy /= (6 * area);
  // [lat, lon] rounded to 3dp (~111m precision)
  return [Math.round(cy * 1000) / 1000, Math.round(cx * 1000) / 1000];
}

// Process shapefile
const result = {}; // pc → array of [lat,lon] | null, aligned to LOCS[pc]
let processed = 0, matched = 0, ambiguous = 0;

const source = await open(shpPath);
while (true) {
  const r = await source.read();
  if (r.done) break;
  processed++;

  const props = r.value.properties;
  const salName = props.SAL_NAME21;
  const stateCode = props.STE_CODE21;
  const stateAbbr = ABS_STATE[stateCode] || "";

  // Clean name: strip state suffix like " (NSW)", " (Vic.)"
  const clean = salName.replace(/\s*\([^)]+\)\s*$/, "").toUpperCase();

  const entries = nameIndex[clean] || nameIndex[salName.toUpperCase()];
  if (!entries || entries.length === 0) continue;

  const c = centroid(r.value.geometry);
  if (!c) continue;

  // Match to the correct postcode(s) — prefer same state
  let targets = entries;
  if (entries.length > 1 && stateAbbr) {
    const sameState = entries.filter(e => pcState[e.pc] === stateAbbr);
    if (sameState.length > 0) targets = sameState;
  }

  for (const { pc, idx } of targets) {
    if (!result[pc]) {
      // Initialize with nulls for all locality slots
      result[pc] = new Array(LOCS[pc].length).fill(null);
    }
    result[pc][idx] = c;
    matched++;
  }
}

console.log(`\nProcessed ${processed} SAL features`);
console.log(`Matched ${matched} locality entries`);

// Count postcodes with at least one centroid
const pcsWithData = Object.keys(result).length;
const totalSlots = Object.values(result).reduce((s, a) => s + a.length, 0);
const filledSlots = Object.values(result).reduce((s, a) => s + a.filter(Boolean).length, 0);
console.log(`Postcodes with suburb centroids: ${pcsWithData}`);
console.log(`Filled: ${filledSlots} / ${totalSlots} locality slots (${Math.round(filledSlots / totalSlots * 100)}%)`);

// Write output
const outPath = resolve(__dirname, "../src/data/suburb-centroids.json");
writeFileSync(outPath, JSON.stringify(result));

const sizeKB = Math.round(JSON.stringify(result).length / 1024);
console.log(`\nWrote suburb-centroids.json (${sizeKB} KB)`);
