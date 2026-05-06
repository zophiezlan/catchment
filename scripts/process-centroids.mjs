#!/usr/bin/env node
/**
 * process-centroids.mjs
 *
 * Generates postcode centroids for NSW postcodes:
 * 1. From NSP outlet coordinates (average for postcodes with outlets)
 * 2. Interpolated from nearest known centroid (for postcodes without outlets)
 *
 * Usage:
 *   node scripts/process-centroids.mjs
 *
 * Output: src/data/postcode-centroids.json
 *         Format: { "2000": [-33.8688, 151.2093], ... }
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load data
const nsp = JSON.parse(readFileSync(resolve(__dirname, "../src/data/nsp.json"), "utf8"));
const postcodes = JSON.parse(readFileSync(resolve(__dirname, "../src/data/postcodes.json"), "utf8"));
const all = [...nsp.primary, ...nsp.secondary, ...nsp.pharmacies];

// NSW postcodes
const nswPCs = new Set();
postcodes.d.forEach(r => {
  if (postcodes.s[r[1]] === "NSW") nswPCs.add(r[0]);
});

// Step 1: Centroids from outlet coordinates
const pcCoords = {};
for (const o of all) {
  if (!o.p || o.lat == null || o.lon == null) continue;
  if (!pcCoords[o.p]) pcCoords[o.p] = { lats: [], lons: [] };
  pcCoords[o.p].lats.push(o.lat);
  pcCoords[o.p].lons.push(o.lon);
}

const centroids = {};
for (const [pc, { lats, lons }] of Object.entries(pcCoords)) {
  const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
  const avgLon = lons.reduce((a, b) => a + b, 0) / lons.length;
  centroids[pc] = [
    Math.round(avgLat * 10000) / 10000,
    Math.round(avgLon * 10000) / 10000,
  ];
}

const directCount = Object.keys(centroids).length;

// Step 2: Interpolate for NSW postcodes without outlets
// Find nearest postcode (numerically) that has a centroid
const knownPCs = Object.keys(centroids).map(Number).sort((a, b) => a - b);

function findNearestKnown(pc) {
  let lo = 0, hi = knownPCs.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (knownPCs[mid] < pc) lo = mid + 1;
    else hi = mid;
  }
  // Check lo and lo-1 for closest
  const candidates = [];
  if (lo < knownPCs.length) candidates.push(knownPCs[lo]);
  if (lo > 0) candidates.push(knownPCs[lo - 1]);
  return candidates.sort((a, b) => Math.abs(a - pc) - Math.abs(b - pc))[0];
}

let interpolatedCount = 0;
for (const pc of nswPCs) {
  if (centroids[pc]) continue;
  const nearest = findNearestKnown(pc);
  if (nearest && centroids[nearest]) {
    // Use nearest known centroid as approximation
    // Add a tiny offset based on postcode difference to avoid exact overlap
    const offset = (pc - nearest) * 0.001;
    centroids[pc] = [
      Math.round((centroids[nearest][0] + offset) * 10000) / 10000,
      Math.round((centroids[nearest][1] + offset * 0.5) * 10000) / 10000,
    ];
    interpolatedCount++;
  }
}

const outputPath = resolve(__dirname, "../src/data/postcode-centroids.json");
const json = JSON.stringify(centroids);
writeFileSync(outputPath, json, "utf8");

const sizeKB = Math.round(json.length / 1024);
console.log(`Generated: ${outputPath}`);
console.log(`  Direct from outlets: ${directCount}`);
console.log(`  Interpolated for NSW: ${interpolatedCount}`);
console.log(`  Total centroids: ${Object.keys(centroids).length}`);
console.log(`  NSW coverage: ${[...nswPCs].filter(pc => centroids[pc]).length} / ${nswPCs.size}`);
console.log(`  File size: ${sizeKB} KB`);
