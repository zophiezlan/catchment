import RAW from "../data/nsp.json";
import CENTROIDS from "../data/postcode-centroids.json";
import { DATA, STATES, LHD_NAMES, ZONE_MAP, ZONE_NAMES } from "./data.js";
import { nearestOutlet } from "./geo.js";
import { NEED_TIERS, getTier, buildGapAnalysis } from "./nsp-gap.js";

export { NEED_TIERS, getTier };

export const NSP_LHDS      = RAW.lhds;
export const NSP_PRIMARY    = RAW.primary;
export const NSP_SECONDARY  = RAW.secondary;
export const NSP_PHARMACIES = RAW.pharmacies;
export const NSP_ALL        = [...RAW.primary, ...RAW.secondary, ...RAW.pharmacies];

function buildPostcodeOutletIndex() {
  const idx = {};
  const add = (outlets, key) => {
    outlets.forEach((o) => {
      if (!o.p) return;
      if (!idx[o.p]) idx[o.p] = { primary: 0, secondary: 0, pharmacy: 0 };
      idx[o.p][key]++;
    });
  };

  add(RAW.primary, "primary");
  add(RAW.secondary, "secondary");
  add(RAW.pharmacies, "pharmacy");
  return idx;
}

// postcode → { primary, secondary, pharmacy } outlet counts
export const NSP_PC = buildPostcodeOutletIndex();

export const NSP_FACILITIES = [...new Set(NSP_ALL.flatMap(o => o.f))].sort();

function createLhdCountMap() {
  return Object.fromEntries(
    NSP_LHDS.map((name, i) => [i, { name, primary: 0, secondary: 0, pharmacy: 0 }])
  );
}

function incrementLhdCounts(map, outlets, key) {
  outlets.forEach((o) => {
    if (o.l >= 0 && map[o.l]) map[o.l][key]++;
  });
}

function sortLhdCountsByTotal(a, b) {
  const totalA = a.primary + a.secondary + a.pharmacy;
  const totalB = b.primary + b.secondary + b.pharmacy;
  return totalB - totalA;
}

export function getNSPByLHD() {
  const map = createLhdCountMap();
  incrementLhdCounts(map, RAW.primary, "primary");
  incrementLhdCounts(map, RAW.secondary, "secondary");
  incrementLhdCounts(map, RAW.pharmacies, "pharmacy");
  return Object.values(map).sort(sortLhdCountsByTotal);
}

// ── Nearest NSP lookup ───────────────────────────────────────────────────────

// Cache for nearest outlet per postcode
const _nearestCache = {};

/**
 * Get the nearest NSP outlet for a given postcode.
 * Returns { outlet, distanceKm, type } or null if no centroid data available.
 */
export function getNearestNSP(pc) {
  if (_nearestCache[pc] !== undefined) return _nearestCache[pc];
  const centroid = CENTROIDS[pc];
  if (!centroid) {
    _nearestCache[pc] = null;
    return null;
  }
  const result = nearestOutlet(centroid[0], centroid[1], NSP_ALL);
  _nearestCache[pc] = result;
  return result;
}

/**
 * Get the nearest PRIMARY NSP outlet for a given postcode.
 */
export function getNearestPrimaryNSP(pc) {
  const centroid = CENTROIDS[pc];
  if (!centroid) return null;
  return nearestOutlet(centroid[0], centroid[1], NSP_PRIMARY);
}

/** Check if a postcode has centroid data available */
export function hasCentroid(pc) {
  return !!CENTROIDS[pc];
}

export function getGapAnalysis() {
  return buildGapAnalysis({
    data: DATA,
    states: STATES,
    lhdNames: LHD_NAMES,
    nspPc: NSP_PC,
    zoneMap: ZONE_MAP,
    zoneNames: ZONE_NAMES,
    getNearestNsp: getNearestNSP,
  });
}
