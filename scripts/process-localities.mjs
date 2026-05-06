#!/usr/bin/env node
/**
 * process-localities.mjs
 *
 * Reads AusPost PC001 standard postcode file and generates a compact
 * localities.json mapping each postcode to all its suburb/locality names.
 *
 * Usage:
 *   node scripts/process-localities.mjs <path-to-pc001.csv>
 *
 * Input:  AusPost standard_postcode_file_pc001_DDMMYYYY.csv
 *         Format: Pcode,Locality,State,Comment,Category
 *
 * Output: src/data/localities.json
 *         Format: { "2000": ["BARANGAROO","DAWES POINT","HAYMARKET",...], ... }
 *
 * Only includes postcodes that exist in postcodes.json (our master dataset).
 * Excludes PO Box-only entries unless they're the only locality for a postcode.
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: node scripts/process-localities.mjs <path-to-pc001.csv>");
  process.exit(1);
}

// Load our master postcode dataset to filter
const masterPath = resolve(__dirname, "../src/data/postcodes.json");
const master = JSON.parse(readFileSync(masterPath, "utf8"));
const masterPCs = new Set(master.d.map(r => r[0]));

console.log(`Master dataset: ${masterPCs.size} unique postcodes`);

// Parse AusPost CSV
const raw = readFileSync(resolve(csvPath), "utf8").trim().split("\n");
const header = raw[0].split(",").map(s => s.trim());
console.log(`PC001 header: ${header.join(", ")}`);
console.log(`PC001 rows: ${raw.length - 1}`);

// Build postcode → localities map
const pcMap = {};       // all localities
const pcDelivery = {};  // delivery-area-only localities (preferred)

for (let i = 1; i < raw.length; i++) {
  const parts = raw[i].split(",").map(s => s.trim());
  const pc = parseInt(parts[0], 10);
  const locality = parts[1];
  const category = parts[4] || "";

  if (!masterPCs.has(pc)) continue; // skip postcodes not in our dataset
  if (!locality) continue;

  // Title case the locality name
  const name = locality
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\bNsw\b/gi, "NSW")
    .replace(/\bNt\b/g, "NT")
    .replace(/\bAct\b/g, "ACT")
    .replace(/\bDc\b/g, "DC")
    .replace(/\bGpo\b/gi, "GPO")
    .replace(/\bPo\b/gi, "PO");

  if (!pcMap[pc]) pcMap[pc] = new Set();
  pcMap[pc].add(name);

  if (category === "Delivery Area") {
    if (!pcDelivery[pc]) pcDelivery[pc] = new Set();
    pcDelivery[pc].add(name);
  }
}

// Build final output: prefer delivery-area localities, fall back to all
const output = {};
let totalLocalities = 0;
let multiCount = 0;

for (const pc of [...masterPCs].sort((a, b) => a - b)) {
  const deliveryLocs = pcDelivery[pc];
  const allLocs = pcMap[pc];

  // Use delivery-area localities if available, otherwise all
  const locs = deliveryLocs && deliveryLocs.size > 0 ? deliveryLocs : allLocs;

  if (locs && locs.size > 0) {
    const sorted = [...locs].sort();
    output[pc] = sorted;
    totalLocalities += sorted.length;
    if (sorted.length > 1) multiCount++;
  }
}

const outputPath = resolve(__dirname, "../src/data/localities.json");
const json = JSON.stringify(output);
writeFileSync(outputPath, json, "utf8");

const sizeKB = Math.round(json.length / 1024);

console.log(`\nGenerated: ${outputPath}`);
console.log(`  Postcodes with localities: ${Object.keys(output).length}`);
console.log(`  Multi-locality postcodes: ${multiCount}`);
console.log(`  Total locality entries: ${totalLocalities}`);
console.log(`  File size: ${sizeKB} KB`);

// Sample output for verification
console.log(`\nSample entries:`);
for (const pc of [2000, 2010, 3000, 4000, 5000, 6000, 810]) {
  if (output[pc]) {
    console.log(`  ${pc}: ${output[pc].join(", ")}`);
  }
}
