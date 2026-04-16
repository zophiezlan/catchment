import RAW from "../data/postcodes.json";

export const STATES = RAW.s;
export const PHN_CODES = RAW.h;
export const PHN_NAMES = RAW.n;
export const LHD_NAMES = RAW.l;
export const DATA = RAW.d;

export const MMM_LABELS = {
  1: "Metropolitan",
  2: "Regional centre",
  3: "Large rural",
  4: "Medium rural",
  5: "Small rural",
  6: "Remote",
  7: "Very remote",
};

export const RA_LABELS = {
  1: "Major cities",
  2: "Inner regional",
  3: "Outer regional",
  4: "Remote",
  5: "Very remote",
};

export const ZONE_MAP = { 1: 1, 2: 2, 3: 2, 4: 3, 5: 3, 6: 4, 7: 4 };
export const ZONE_NAMES = {
  1: "Metro",
  2: "Regional",
  3: "Rural",
  4: "Remote",
};

export const ZONE_COLORS = {
  1: "#3b82f6",
  2: "#059669",
  3: "#d97706",
  4: "#dc2626",
};

export const ZONE_COLORS_LIGHT = {
  1: "#dbeafe",
  2: "#d1fae5",
  3: "#fef3c7",
  4: "#fee2e2",
};

export const ZONE_COLORS_TEXT = {
  1: "#1e40af",
  2: "#065f46",
  3: "#92400e",
  4: "#991b1b",
};

// Decode a raw record into a readable object
export function decode(r) {
  const mmm = r[3];
  const zone = ZONE_MAP[mmm] || 0;
  return {
    pc: r[0],
    st: STATES[r[1]] || "",
    pl: r[2],
    mmm,
    ml: MMM_LABELS[mmm] || "",
    ra: r[4],
    rl: RA_LABELS[r[4]] || "",
    hc: r[5] >= 0 ? PHN_CODES[r[5]] : "",
    hn: r[5] >= 0 ? PHN_NAMES[r[5]] : "",
    lhd: r[6] >= 0 ? LHD_NAMES[r[6]] : "",
    erp: r[7],
    ip: r[8],
    id: r[9],
    z: zone,
    zn: ZONE_NAMES[zone] || "",
  };
}

// Index: postcode → array of raw records (may have multiple states)
export const IDX = {};
DATA.forEach((r) => {
  const p = r[0];
  if (!IDX[p]) IDX[p] = [];
  IDX[p].push(r);
});

// Primary index: postcode → single primary record (first state entry)
export const PIDX = {};
DATA.forEach((r) => {
  const p = r[0];
  if (!PIDX[p]) PIDX[p] = r;
});

// Sorted list of all postcodes
export const ALL_POSTCODES = Object.keys(IDX)
  .map(Number)
  .sort((a, b) => a - b);

// IRSD color scale
export function irsdColor(decile) {
  if (decile <= 2) return "#ef4444";
  if (decile <= 4) return "#f59e0b";
  if (decile <= 6) return "#a3a3a3";
  if (decile <= 8) return "#34d399";
  return "#059669";
}
