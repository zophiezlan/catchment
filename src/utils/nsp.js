import RAW from "../data/nsp.json";

export const NSP_LHDS      = RAW.lhds;
export const NSP_PRIMARY    = RAW.primary;
export const NSP_SECONDARY  = RAW.secondary;
export const NSP_PHARMACIES = RAW.pharmacies;
export const NSP_ALL        = [...RAW.primary, ...RAW.secondary, ...RAW.pharmacies];

// postcode → { primary, secondary, pharmacy } outlet counts
export const NSP_PC = (() => {
  const idx = {};
  const add = (outlets, key) =>
    outlets.forEach(o => {
      if (!o.p) return;
      if (!idx[o.p]) idx[o.p] = { primary: 0, secondary: 0, pharmacy: 0 };
      idx[o.p][key]++;
    });
  add(RAW.primary,    "primary");
  add(RAW.secondary,  "secondary");
  add(RAW.pharmacies, "pharmacy");
  return idx;
})();

// All unique facility strings (sorted)
export const NSP_FACILITIES = [
  ...new Set(NSP_ALL.flatMap(o => o.f)),
].sort();

// LHD summary sorted by total outlet count
export function getNSPByLHD() {
  const map = Object.fromEntries(
    NSP_LHDS.map((name, i) => [i, { name, primary: 0, secondary: 0, pharmacy: 0 }])
  );
  RAW.primary.forEach(o    => { if (o.l >= 0 && map[o.l]) map[o.l].primary++; });
  RAW.secondary.forEach(o  => { if (o.l >= 0 && map[o.l]) map[o.l].secondary++; });
  RAW.pharmacies.forEach(o => { if (o.l >= 0 && map[o.l]) map[o.l].pharmacy++; });
  return Object.values(map).sort(
    (a, b) => (b.primary + b.secondary + b.pharmacy) - (a.primary + a.secondary + a.pharmacy)
  );
}
