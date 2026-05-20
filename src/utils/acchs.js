import RAW from "../data/acchs.json";

export const ACCHS_REGIONS = RAW.regions;
export const ACCHS_ALL = RAW.services;

// NSW-only view (1 service is just-across-the-border at Wodonga, Vic)
export const ACCHS_NSW = ACCHS_ALL.filter((s) => s.st === "NSW");

/** Postcode → array of ACCHS services with that postcode */
export const ACCHS_PC = (() => {
  const idx = {};
  for (const s of ACCHS_ALL) {
    if (!s.p) continue;
    if (!idx[s.p]) idx[s.p] = [];
    idx[s.p].push(s);
  }
  return idx;
})();

/** Region name → array of services */
export const ACCHS_BY_REGION = (() => {
  const idx = {};
  for (const s of ACCHS_ALL) {
    const r = s.r >= 0 ? ACCHS_REGIONS[s.r] : "—";
    if (!idx[r]) idx[r] = [];
    idx[r].push(s);
  }
  return idx;
})();

/** Get any ACCHS that share a postcode (returns array, possibly empty) */
export function getACCHSByPostcode(pc) {
  return ACCHS_PC[pc] || [];
}
