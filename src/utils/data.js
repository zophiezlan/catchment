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

// Place name search index: lowercased place name → [postcode, ...]
export const PLACE_IDX = {};
DATA.forEach((r) => {
  const pl = (r[2] || "").toLowerCase();
  if (!pl) return;
  if (!PLACE_IDX[pl]) PLACE_IDX[pl] = [];
  PLACE_IDX[pl].push(r[0]);
});

// All unique place names sorted
export const ALL_PLACES = Object.keys(PLACE_IDX).sort();

// Search postcodes by number or place name, returns [{pc, pl, st, z, zn}, ...]
export function searchPostcodes(query, limit = 8) {
  const q = query.trim();
  if (!q) return [];

  // Numeric search — match postcodes starting with digits
  if (/^\d+$/.test(q)) {
    return ALL_POSTCODES.filter((p) => String(p).startsWith(q))
      .slice(0, limit)
      .map((pc) => {
        const d = decode(IDX[pc][0]);
        return { pc, pl: d.pl, st: d.st, z: d.z, zn: d.zn };
      });
  }

  // Place name search
  const ql = q.toLowerCase();
  const results = [];
  const seen = new Set();

  // Exact start match first
  for (const place of ALL_PLACES) {
    if (results.length >= limit) break;
    if (place.startsWith(ql)) {
      for (const pc of PLACE_IDX[place]) {
        if (seen.has(pc)) continue;
        seen.add(pc);
        const d = decode(IDX[pc][0]);
        results.push({ pc, pl: d.pl, st: d.st, z: d.z, zn: d.zn });
        if (results.length >= limit) break;
      }
    }
  }

  // Then substring match
  if (results.length < limit) {
    for (const place of ALL_PLACES) {
      if (results.length >= limit) break;
      if (!place.startsWith(ql) && place.includes(ql)) {
        for (const pc of PLACE_IDX[place]) {
          if (seen.has(pc)) continue;
          seen.add(pc);
          const d = decode(IDX[pc][0]);
          results.push({ pc, pl: d.pl, st: d.st, z: d.z, zn: d.zn });
          if (results.length >= limit) break;
        }
      }
    }
  }

  return results;
}

// LHD summary data for NSW LHD view
export function getLHDSummary() {
  const lhdMap = {};

  DATA.forEach((r) => {
    if (r[6] < 0) return;
    const name = LHD_NAMES[r[6]];
    if (!lhdMap[name]) {
      lhdMap[name] = {
        name,
        postcodes: 0,
        pop: 0,
        popCount: 0,
        indSum: 0,
        indCount: 0,
        irsd: Array(11).fill(0),
        zones: { 1: 0, 2: 0, 3: 0, 4: 0 },
      };
    }
    const m = lhdMap[name];
    m.postcodes++;
    const z = ZONE_MAP[r[3]] || 0;
    if (z) m.zones[z]++;
    if (r[7] > 0) {
      m.pop += r[7];
      m.popCount++;
    }
    if (r[8] > 0) {
      m.indSum += r[8];
      m.indCount++;
    }
    if (r[9] > 0) m.irsd[r[9]]++;
  });

  return Object.values(lhdMap)
    .map((m) => ({
      ...m,
      avgInd: m.indCount > 0 ? +(m.indSum / m.indCount).toFixed(1) : 0,
      bot20: (() => {
        const b = m.irsd[1] + m.irsd[2];
        const t = m.irsd.slice(1).reduce((a, c) => a + c, 0);
        return t > 0 ? +((b / t) * 100).toFixed(0) : 0;
      })(),
      medianIrsd: (() => {
        const vals = [];
        m.irsd.forEach((count, dec) => {
          if (dec > 0) for (let i = 0; i < count; i++) vals.push(dec);
        });
        vals.sort((a, b) => a - b);
        return vals.length > 0 ? vals[Math.floor(vals.length / 2)] : 0;
      })(),
      dominantZone:
        Object.entries(m.zones).sort((a, b) => b[1] - a[1])[0]?.[0] || "1",
    }))
    .sort((a, b) => b.postcodes - a.postcodes);
}

// Generate CSV from decoded records
export function toCSV(records) {
  const headers = [
    "Postcode",
    "State",
    "Place",
    "Zone",
    "MMM",
    "RA",
    "PHN Code",
    "PHN Name",
    "LHD",
    "Population",
    "Indigenous %",
    "IRSD Decile",
  ];
  const rows = records.map((d) => [
    d.pc,
    d.st,
    `"${(d.pl || "").replace(/"/g, '""')}"`,
    d.zn,
    d.mmm,
    d.ra,
    d.hc,
    `"${(d.hn || "").replace(/"/g, '""')}"`,
    `"${(d.lhd || "").replace(/"/g, '""')}"`,
    d.erp || "",
    d.ip || "",
    d.id || "",
  ]);
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

// IRSD color scale
export function irsdColor(decile) {
  if (decile <= 2) return "#ef4444";
  if (decile <= 4) return "#f59e0b";
  if (decile <= 6) return "#a3a3a3";
  if (decile <= 8) return "#34d399";
  return "#059669";
}
