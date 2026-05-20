// Shared helpers for OTP adapters.
// Each adapter returns site records in a normalised shape; the orchestrator
// (process-otp.mjs) dedupes, geocodes, and writes src/data/otp.json.

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, "..");

export const POSTCODE_CENTROIDS = JSON.parse(
  readFileSync(resolve(ROOT, "src/data/postcode-centroids.json"), "utf8"),
);

const POSTCODES_RAW = JSON.parse(
  readFileSync(resolve(ROOT, "src/data/postcodes.json"), "utf8"),
);

// postcodes.json shape: { s, h, n, l: [lhdNames...], d: [[pc, st, pl, mmm, ra, phn, lhd, ...]] }
// Build a postcode → lhd-name map (first match wins; postcodes rarely cross LHDs).
const POSTCODE_TO_LHD = (() => {
  const m = new Map();
  for (const row of POSTCODES_RAW.d) {
    const pc = row[0];
    const lhdIdx = row[6];
    if (m.has(pc)) continue;
    const lhdName = POSTCODES_RAW.l[lhdIdx];
    if (lhdName) m.set(pc, lhdName);
  }
  return m;
})();

export function lhdByPostcode(pc) {
  const key = typeof pc === "string" ? parseInt(pc, 10) : pc;
  return POSTCODE_TO_LHD.get(key) || null;
}

// Suburb name → first matching NSW postcode. Useful when an LHD page omits
// the postcode (common — they trust readers to know "Nowra" without it).
//
// We use localities.json (full per-postcode locality list, e.g. 2541 →
// ["Bangalee", "Bomaderry", "Nowra", "Nowra DC", ...]) rather than
// postcodes.json (which only carries one place name per postcode).
// Ambiguity: returns the first NSW match when a suburb name occurs in
// multiple postcodes. For NSW-only the collisions are rare.
const LOCALITIES = JSON.parse(
  readFileSync(resolve(ROOT, "src/data/localities.json"), "utf8"),
);

const SUBURB_TO_POSTCODE = (() => {
  const m = new Map();
  // Iterate in ascending postcode order so the lower postcode wins ties.
  // BUT skip postcodes that don't have a centroid — those are mail-only PO
  // Box codes (e.g. Sydney's 1xxx range) that share suburb names with real
  // residential postcodes and would otherwise hijack the lookup
  // (St Leonards 1590 vs 2065, North Parramatta 1750 vs 2151, etc.).
  const sortedPcs = Object.keys(LOCALITIES).sort((a, b) => parseInt(a) - parseInt(b));
  for (const pc of sortedPcs) {
    const names = LOCALITIES[pc];
    if (!Array.isArray(names)) continue;
    const pcNum = parseInt(pc, 10);
    if (!POSTCODE_CENTROIDS[String(pcNum).padStart(4, "0")]) continue;
    for (const name of names) {
      if (!name) continue;
      const key = name.toLowerCase();
      if (!m.has(key)) m.set(key, pcNum);
    }
  }
  return m;
})();

export function postcodeBySuburb(suburb) {
  if (!suburb) return null;
  return SUBURB_TO_POSTCODE.get(suburb.toLowerCase().trim()) || null;
}

// Canonical NSW LHD names (must match nsp.json exactly so map overlays line up)
export const LHD_CANONICAL = [
  "Central Coast LHD",
  "Far West LHD",
  "Hunter New England LHD",
  "Illawarra Shoalhaven LHD",
  "Mid North Coast LHD",
  "Murrumbidgee LHD",
  "Nepean Blue Mountains LHD",
  "Northern NSW LHD",
  "Northern Sydney LHD",
  "South Eastern Sydney LHD",
  "South Western Sydney LHD",
  "Southern NSW LHD",
  "Sydney LHD",
  "Western NSW LHD",
  "Western Sydney LHD",
];

const LHD_SET = new Set(LHD_CANONICAL.map((l) => l.toLowerCase()));

// Aliases for known source-page variations.
const LHD_ALIASES = new Map([
  ["central coast (nsw)", "Central Coast LHD"],
  ["central coast", "Central Coast LHD"],
]);

export function canonicaliseLhd(raw) {
  if (!raw) return null;
  const norm = raw.replace(/\s+/g, " ").trim();
  const lower = norm.toLowerCase();
  if (LHD_SET.has(lower)) {
    return LHD_CANONICAL.find((l) => l.toLowerCase() === lower);
  }
  if (LHD_ALIASES.has(lower)) return LHD_ALIASES.get(lower);
  // Trailing "LHD" optional
  for (const canon of LHD_CANONICAL) {
    if (canon.toLowerCase().startsWith(lower + " lhd")) return canon;
    if ((lower + " lhd") === canon.toLowerCase()) return canon;
  }
  return null;
}

export function decodeEntities(s) {
  if (!s) return "";
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#038;/g, "&")
    .replace(/&#8211;/g, "–")
    .replace(/&#8217;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Strip a trailing ", NSW 2000" tail if present (occurs when LHD pages put
// the full address in one cell).
export function stripStateTail(s) {
  return s
    .replace(/,?\s*(NSW|VIC|QLD|ACT|SA|TAS|WA|NT)\s+\d{4}\s*$/i, "")
    .replace(/,\s*$/, "")
    .trim();
}

export function geocodeByPostcode(pc) {
  const key = String(pc).padStart(4, "0");
  const c = POSTCODE_CENTROIDS[key];
  if (!c || !Array.isArray(c) || c.length < 2) return null;
  return { lat: +c[0].toFixed(6), lon: +c[1].toFixed(6) };
}

export async function fetchHtml(url, label) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Catchment-data-pipeline (harm-reduction planning tool)",
      Accept: "text/html",
    },
  });
  if (!res.ok) {
    throw new Error(`${label} fetch failed: ${res.status} ${res.statusText}`);
  }
  return await res.text();
}

// Service codes — keep short. "otp" = standard dosing, "laib" = long-acting
// injectable buprenorphine. A single pharmacy can offer both.
export function normaliseServices(raw) {
  if (!raw) return [];
  const lower = raw.toLowerCase();
  const out = [];
  if (lower.includes("opioid treatment") || /\botp\b/.test(lower)) out.push("otp");
  if (lower.includes("long-acting") || lower.includes("long acting") || /\blaib\b/.test(lower) || lower.includes("buprenorphine"))
    out.push("laib");
  return out;
}

// Site types
export const SITE_TYPES = {
  PHARMACY: "pharmacy",
  PUBLIC_CLINIC: "public-clinic",
  PRIVATE_CLINIC: "private-clinic",
};

// Build a synchronous helper for hand-curated adapters: given an array of
// { n, a?, suburb, lhd, sv? } entries, resolve postcode-by-suburb and assemble
// the standard site shape. Throws if any suburb fails to resolve — a manual
// adapter should never silently drop entries.
export function manifestSites(entries) {
  const out = [];
  for (const e of entries) {
    const pc = e.postcode ?? postcodeBySuburb(e.suburb);
    if (!pc) {
      throw new Error(`manifestSites: postcode lookup failed for suburb "${e.suburb}" (clinic "${e.n}")`);
    }
    out.push({
      n: e.n,
      a: e.a || e.n,
      s: e.suburb,
      p: pc,
      lhd: e.lhd,
      t: e.t || SITE_TYPES.PUBLIC_CLINIC,
      sv: e.sv || ["otp"],
    });
  }
  return out;
}
