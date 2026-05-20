// Parse AHMRC member directory HTML pages → src/data/acchs.json
// Source HTML: NSW data sources.local/ahmrc-page-{1..6}.html
// Each <li class="member-post ..."> block has:
//   - h2.entry-title > a   → name + slug URL
//   - class region-{slug}-region → region
//   - class field_type-* → service types
//   - class medical_service-* → service categories
//   - btn-direction <a href="https://...maps/place/<addr>/@lat,lon,..."> for geo + address
//   - sometimes btn-direction <a href="https://maps.google.com/maps/dir//<name+addr>/@lat,lon,..."> (older format)

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, "..");
const SRC_DIR = resolve(ROOT, "NSW data sources.local");
const OUT = resolve(ROOT, "src/data/acchs.json");

// Decode common HTML entities we'll encounter in titles
const decodeEntities = (s) =>
  s.replace(/&#8211;/g, "–")
    .replace(/&#8217;/g, "’")
    .replace(/&amp;/g, "&")
    .replace(/&#038;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const TITLE_CASE = (s) =>
  s.split(" ").map(w => {
    if (w.length <= 2 && w === w.toUpperCase()) return w; // NSW, VIC etc.
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }).join(" ");

// Parse a Google Maps "place" URL: /maps/place/<plus-encoded-address>/@lat,lon,...
function parsePlaceUrl(href) {
  const m = href.match(/\/maps\/place\/([^/]+)\/@(-?[\d.]+),(-?[\d.]+)/);
  if (!m) return null;
  const addrRaw = decodeURIComponent(m[1].replace(/\+/g, " "));
  return {
    address: addrRaw.replace(/\s+/g, " ").trim(),
    lat: +parseFloat(m[2]).toFixed(6),
    lon: +parseFloat(m[3]).toFixed(6),
  };
}

// Parse the older "dir" URL: /maps/dir//<name+address>/@lat,lon,...
function parseDirUrl(href) {
  const m = href.match(/\/maps\/dir\/\/([^/]+)\/@(-?[\d.]+),(-?[\d.]+)/);
  if (!m) return null;
  const addrRaw = decodeURIComponent(m[1].replace(/\+/g, " "));
  return {
    address: addrRaw.replace(/\s+/g, " ").trim(),
    lat: +parseFloat(m[2]).toFixed(6),
    lon: +parseFloat(m[3]).toFixed(6),
  };
}

const STREET_TYPES = new Set([
  "st","street","rd","road","ave","avenue","cres","crescent","dr","drive",
  "pl","place","cl","close","lane","ln","hwy","highway","way","pde","parade",
  "tce","terrace","blvd","bvd","boulevard","ct","court","sq","square","mall",
  "esp","esplanade","promenade","cct","circuit","grove","gr","loop"
]);

// Extract street/suburb/postcode/state from a free-form address tail.
// Algorithm: anchor on trailing "STATE NNNN [, Australia]", then walk the
// remaining tokens backwards. The suburb is the run of capitalised tokens
// (1–3) immediately before the state, stopping at any street-type abbreviation.
function splitAddress(addr) {
  const clean = addr.replace(/,?\s*Australia\.?$/i, "").replace(/,\s*$/, "").trim();
  const stateM = clean.match(/^(.*?)[,\s]+(NSW|VIC|QLD|ACT|SA|TAS|WA|NT)\s+(\d{4})$/);
  if (!stateM) return { street: clean, suburb: "", state: "", postcode: 0, fullAddress: addr };

  const head = stateM[1].replace(/,$/, "").trim();
  const state = stateM[2];
  const postcode = parseInt(stateM[3], 10);

  // Tokenise; walk backwards collecting capitalised non-street-type tokens as suburb.
  const tokens = head.split(/\s+/);
  const suburbTokens = [];
  while (tokens.length && suburbTokens.length < 3) {
    const t = tokens[tokens.length - 1];
    const bare = t.replace(/[.,]$/, "").toLowerCase();
    if (STREET_TYPES.has(bare)) break;
    if (!/^[A-Z]/.test(t)) break;
    if (/^\d/.test(t)) break;
    suburbTokens.unshift(tokens.pop());
  }
  const suburb = suburbTokens.join(" ").replace(/[,.]$/, "");
  let street = tokens.join(" ").replace(/[,.]$/, "").trim();
  // Strip leading org-name prefix when present: keep from the first street number onward.
  const numIdx = street.search(/\b\d+[A-Za-z]?(?:[-/&]\d+[A-Za-z]?)?\s+[A-Z]/);
  if (numIdx > 0) street = street.slice(numIdx);
  return { street, suburb, state, postcode, fullAddress: addr };
}

const REGION_LABELS = {
  "metropolitan-region": "Metropolitan",
  "northern-region": "Northern",
  "southern-region": "Southern",
  "western-region": "Western",
  "central-region": "Central",
  "far-west-region": "Far West",
  "north-coast-region": "North Coast",
  "south-coast-region": "South Coast",
  "illawarra-region": "Illawarra",
  "central-coast-region": "Central Coast",
  "riverina-region": "Riverina",
  "murray-region": "Murray",
};

// Parse one <li class="member-post ..."> block
function parseBlock(html) {
  const classMatch = html.match(/<li[^>]+class="([^"]+)"/);
  if (!classMatch) return null;
  const classes = classMatch[1].split(/\s+/);

  // skip non-member-service entries
  if (!classes.includes("member_service")) return null;

  const regionClass = classes.find(c => c.startsWith("region-"));
  const region = regionClass ? (REGION_LABELS[regionClass.slice(7)] || regionClass.slice(7)) : "";

  const fieldTypes = classes
    .filter(c => c.startsWith("field_type-"))
    .map(c => c.slice(11).replace(/-/g, " "));

  const services = classes
    .filter(c => c.startsWith("medical_service-"))
    .map(c => c.slice(16).replace(/-/g, " "));

  const titleM = html.match(/<h2[^>]*entry-title[^>]*><a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/);
  if (!titleM) return null;
  const url = titleM[1];
  const name = decodeEntities(titleM[2]);

  const dirM = html.match(/btn-direction"[^>]*\s+href="([^"]+)"/) ||
               html.match(/href="([^"]+)"[^>]*class="btn-direction"/);
  let geo = null;
  if (dirM) {
    const href = dirM[1];
    geo = parsePlaceUrl(href) || parseDirUrl(href);
  }

  return { name, url, region, fieldTypes, services, geo };
}

const allBlocks = [];
const files = readdirSync(SRC_DIR).filter(f => /^ahmrc-page-\d+\.html$/.test(f)).sort();
for (const f of files) {
  const html = readFileSync(resolve(SRC_DIR, f), "utf8");
  const blocks = html.split(/(?=<li[^>]+class="member-post)/g).slice(1);
  for (const b of blocks) {
    const parsed = parseBlock(b);
    if (parsed) allBlocks.push(parsed);
  }
}

// De-dupe by URL
const byUrl = new Map();
for (const b of allBlocks) {
  if (!byUrl.has(b.url)) byUrl.set(b.url, b);
}
const services = [...byUrl.values()];

// Resolve address fields
const records = services.map(s => {
  if (!s.geo) return null;
  const a = splitAddress(s.geo.address);
  return {
    n: s.name,
    a: a.street || a.fullAddress,
    s: a.suburb,
    p: a.postcode,
    st: a.state,
    r: s.region,
    lat: s.geo.lat,
    lon: s.geo.lon,
    ft: s.fieldTypes,
    sv: s.services,
  };
}).filter(Boolean);

// Sort by name
records.sort((a, b) => a.n.localeCompare(b.n));

// Intern regions
const regions = [...new Set(records.map(r => r.r).filter(Boolean))].sort();
const regIdx = new Map(regions.map((r, i) => [r, i]));

const packed = records.map(r => ({ ...r, r: regIdx.has(r.r) ? regIdx.get(r.r) : -1 }));

writeFileSync(OUT, JSON.stringify({ regions, services: packed }));

// Summary
const nswCount = packed.filter(r => r.st === "NSW").length;
const stateCounts = {};
for (const r of packed) stateCounts[r.st || "?"] = (stateCounts[r.st || "?"] || 0) + 1;
console.log(`✓ acchs.json written: ${packed.length} services`);
console.log(`  States:  ${JSON.stringify(stateCounts)}`);
console.log(`  Regions: ${regions.length}`);
console.log(`  Missing coords/address: ${services.length - packed.length}`);
