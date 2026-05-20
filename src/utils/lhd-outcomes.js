import RAW from "../data/lhd-health-outcomes.json";

export const LHD_OUT_SOURCE = RAW.source;
export const LHD_OUT_NSW = RAW.nswSummary;
export const LHD_OUT = RAW.lhds;

/** Look up health outcomes for an LHD by name (e.g. "Sydney LHD"). */
export function getLHDOutcomes(lhdName) {
  return LHD_OUT[lhdName] || null;
}

/** Compute per-100k rate for units distributed (public NSP), given LHD population. */
export function unitsPer1000(units, population) {
  if (!units || !population) return 0;
  return (units / population) * 1000;
}

/** Array of LHDs sorted by total units distributed (descending). */
export function getLHDsByVolume() {
  return Object.entries(LHD_OUT)
    .map(([name, d]) => ({
      name,
      ...d,
      unitsTotal: d.unitsPublic + d.unitsPharmacy,
    }))
    .sort((a, b) => b.unitsTotal - a.unitsTotal);
}
