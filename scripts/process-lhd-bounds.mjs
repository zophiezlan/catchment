import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, "..");
const DATA_DIR = resolve(ROOT, "NSW Needle and Syringe Program (NSP) outlets.local");
const OUT = resolve(ROOT, "src/data/lhd-geo.json");

// ── CSV parser ────────────────────────────────────────────────────────────────
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
  return data.map(r => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])));
}

// ── Extract coordinate rings from WKT polygon ─────────────────────────────────
// Detects parenthesised groups whose first non-space character is a digit or '-'
// (i.e. coordinate pairs), avoiding complex recursive parsing.
function extractRings(wkt) {
  const rings = [];
  let i = 0;
  while (i < wkt.length) {
    if (wkt[i] === '(') {
      let j = i + 1;
      while (j < wkt.length && (wkt[j] === ' ' || wkt[j] === '\t' || wkt[j] === '\n' || wkt[j] === '\r')) j++;
      if (j < wkt.length && (wkt[j] === '-' || (wkt[j] >= '0' && wkt[j] <= '9'))) {
        // Find the matching closing paren (rings have no nested parens)
        let end = j;
        while (end < wkt.length && wkt[end] !== ')') end++;
        const pts = wkt.slice(i + 1, end).split(',').map(pair => {
          const parts = pair.trim().split(/\s+/);
          return [parseFloat(parts[0]), parseFloat(parts[1])];
        }).filter(p => !isNaN(p[0]) && !isNaN(p[1]));
        if (pts.length >= 4) rings.push(pts);
        i = end + 1;
        continue;
      }
    }
    i++;
  }
  return rings;
}

// ── Iterative Douglas-Peucker simplification ──────────────────────────────────
function perpDist(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  if (dx === 0 && dy === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy);
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}

function dp(pts, eps) {
  if (pts.length <= 2) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = 1;
  keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [start, end] = stack.pop();
    let maxD = 0, idx = start;
    for (let i = start + 1; i < end; i++) {
      const d = perpDist(pts[i], pts[start], pts[end]);
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > eps) {
      keep[idx] = 1;
      stack.push([start, idx]);
      stack.push([idx, end]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}

const EPS = 0.01; // ~1 km — compact for zoom-6 overview display

function processFile(file) {
  process.stdout.write(`  ${file} … `);
  const rows = csv2obj(readFileSync(resolve(DATA_DIR, file), "utf8"));

  const features = rows.map(r => {
    const name = (r.Name || "").trim();
    if (!name) return null;

    const rings = extractRings(r.WKT || "");
    const rawPts = rings.reduce((s, r) => s + r.length, 0);
    const simplified = rings.map(ring => dp(ring, EPS));
    const keptPts = simplified.reduce((s, r) => s + r.length, 0);

    process.stdout.write(`\n    ${name}: ${rawPts.toLocaleString()} → ${keptPts} pts`);

    return {
      type: "Feature",
      properties: { name },
      geometry: {
        type: "MultiPolygon",
        // Each ring becomes a standalone polygon (no holes — fine for display overlay)
        coordinates: simplified.map(ring => [
          ring.map(([lon, lat]) => [+lon.toFixed(5), +lat.toFixed(5)])
        ]),
      },
    };
  }).filter(Boolean);

  console.log("");
  return features;
}

const features = [
  ...processFile("Metropolitan local health districts.csv"),
  ...processFile("Rural and regional NSW local health districts.csv"),
];

const out = JSON.stringify({ type: "FeatureCollection", features });
writeFileSync(OUT, out);
console.log(`\n✓ lhd-geo.json: ${features.length} LHDs, ${(out.length / 1024).toFixed(1)} KB`);
