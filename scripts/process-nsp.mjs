import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, "..");
const DATA_DIR = resolve(ROOT, "NSW Needle and Syringe Program (NSP) outlets.local");
const OUT = resolve(ROOT, "src/data/nsp.json");

// ── CSV parser (handles quoted fields with embedded newlines) ──────────────
function parseCSV(text) {
  const src = text.replace(/^﻿/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQ) {
      if (c === '"' && src[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQ = false;
      else field += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ',') { row.push(field); field = ""; }
      else if (c === '\n') {
        row.push(field); field = "";
        if (row.some(f => f)) rows.push(row);
        row = [];
      } else field += c;
    }
  }
  if (row.length) { row.push(field); if (row.some(f => f)) rows.push(row); }
  return rows;
}

function csv2obj(text) {
  const [headers, ...data] = parseCSV(text);
  const keys = headers.map(h => h.trim());
  return data.map(r =>
    Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()]))
  );
}

function wktCoords(wkt) {
  const m = wkt.match(/POINT Z \(([0-9.-]+)\s+([0-9.-]+)/);
  return m ? { lon: +parseFloat(m[1]).toFixed(6), lat: +parseFloat(m[2]).toFixed(6) } : null;
}

// ── postcode → LHD lookup (from existing postcodes.json) ──────────────────
const pcJson = JSON.parse(readFileSync(resolve(ROOT, "src/data/postcodes.json"), "utf8"));
const pcLhdName = {};
pcJson.d.forEach(r => {
  if (r[6] >= 0 && !pcLhdName[r[0]]) pcLhdName[r[0]] = pcJson.l[r[6]];
});

function process(file, type) {
  const text = readFileSync(resolve(DATA_DIR, file), "utf8");
  return csv2obj(text).reduce((acc, r) => {
    const coords = wktCoords(r.WKT || "");
    if (!coords) return acc;
    const pc = parseInt(r.Postcode, 10) || 0;
    // LHD from CSV first, fall back to postcode lookup
    const lhd =
      (r.Local_Health_District || r["Local Health District"] || "").trim() ||
      pcLhdName[pc] || "";
    const facs = (r.Facilities || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
    acc.push({
      n: r.Name || "",
      a: r.Address || "",
      s: r.Suburb || "",
      p: pc,
      h: (r.Phone_number_and_operating_hours || "").trim(),
      f: facs,
      lat: coords.lat,
      lon: coords.lon,
      l: lhd,
      t: type,
    });
    return acc;
  }, []);
}

const primary    = process("NSP primary outlets.csv",   "primary");
const secondary  = process("NSP secondary outlets.csv", "secondary");
const pharmacies = process("Pharmacies.csv",            "pharmacy");

// ── Intern LHD strings → indices ──────────────────────────────────────────
const lhdSet = new Set();
[...primary, ...secondary, ...pharmacies].forEach(o => { if (o.l) lhdSet.add(o.l); });
const lhds = [...lhdSet].sort();
const lhdIdx = new Map(lhds.map((l, i) => [l, i]));

const pack = outlets =>
  outlets.map(o => ({ ...o, l: lhdIdx.has(o.l) ? lhdIdx.get(o.l) : -1 }));

writeFileSync(
  OUT,
  JSON.stringify({ lhds, primary: pack(primary), secondary: pack(secondary), pharmacies: pack(pharmacies) })
);

console.log(`✓ nsp.json written`);
console.log(`  Primary:    ${primary.length}`);
console.log(`  Secondary:  ${secondary.length}`);
console.log(`  Pharmacies: ${pharmacies.length}`);
console.log(`  Total:      ${primary.length + secondary.length + pharmacies.length}`);
console.log(`  LHDs:       ${lhds.length}`);
