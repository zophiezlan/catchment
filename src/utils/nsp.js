import RAW from "../data/nsp.json";
import { DATA, STATES, LHD_NAMES, ZONE_MAP, ZONE_NAMES } from "./data.js";

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

export const NSP_FACILITIES = [...new Set(NSP_ALL.flatMap(o => o.f))].sort();

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

// ── Gap analysis ──────────────────────────────────────────────────────────────

// Need score (0–7): IRSD + Indigenous% + MMM
function needScore(irsd, ip, mmm) {
  let s = 0;
  if (irsd > 0) {
    if (irsd <= 2) s += 3;
    else if (irsd <= 4) s += 2;
    else if (irsd <= 6) s += 1;
  }
  if (ip >= 10) s += 2;
  else if (ip >= 3)  s += 1;
  if (mmm >= 6) s += 2;
  else if (mmm >= 4) s += 1;
  return s;
}

export const NEED_TIERS = [
  { min: 5, label: "Critical", color: "#ef4444", bg: "#fef2f2", text: "#991b1b", border: "rgba(239,68,68,0.3)" },
  { min: 4, label: "High",     color: "#f97316", bg: "#fff7ed", text: "#9a3412", border: "rgba(249,115,22,0.3)" },
  { min: 2, label: "Medium",   color: "#d97706", bg: "#fffbeb", text: "#92400e", border: "rgba(217,119,6,0.3)" },
  { min: 1, label: "Watch",    color: "#a3a3a3", bg: "var(--c-bg3)", text: "var(--c-text3)", border: "var(--c-border)" },
];

export function getTier(score) {
  return NEED_TIERS.find(t => score >= t.min) ?? null;
}

export function getGapAnalysis() {
  const summary = { total: 0, covered: 0, coveredPct: 0, highNeedUncovered: 0 };
  const lhdMap  = {};
  const uncovered = [];

  DATA.forEach(r => {
    if (STATES[r[1]] !== "NSW") return;
    // Skip postcodes with neither population nor IRSD (non-residential / no data)
    if ((r[7] || 0) <= 0 && (r[9] || 0) <= 0) return;

    const pc  = r[0];
    const lhd = r[6] >= 0 ? LHD_NAMES[r[6]] : "—";
    const covered = !!NSP_PC[pc];

    summary.total++;
    if (covered) summary.covered++;

    if (lhd !== "—") {
      if (!lhdMap[lhd]) lhdMap[lhd] = { total: 0, covered: 0 };
      lhdMap[lhd].total++;
      if (covered) lhdMap[lhd].covered++;
    }

    if (!covered) {
      const score = needScore(r[9] || 0, r[8] || 0, r[3] || 0);
      if (score >= 1) {
        uncovered.push({
          pc,
          pl:  r[2] || "",
          lhd,
          erp: r[7] || 0,
          ip:  r[8] || 0,
          id:  r[9] || 0,
          mmm: r[3] || 0,
          zn:  ZONE_NAMES[ZONE_MAP[r[3]] || 0] || "",
          score,
        });
        if (score >= 4) summary.highNeedUncovered++;
      }
    }
  });

  summary.coveredPct =
    summary.total > 0 ? Math.round((summary.covered / summary.total) * 100) : 0;

  const lhdCoverage = Object.entries(lhdMap)
    .map(([name, d]) => ({
      name,
      ...d,
      pct: d.total > 0 ? Math.round((d.covered / d.total) * 100) : 0,
    }))
    .sort((a, b) => a.pct - b.pct); // worst coverage first

  uncovered.sort((a, b) => b.score - a.score);

  return { summary, lhdCoverage, uncovered };
}
