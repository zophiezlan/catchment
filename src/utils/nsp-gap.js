// Need score (0-7): IRSD + Indigenous% + MMM
function needScore(irsd, ip, mmm) {
  let s = 0;
  if (irsd > 0) {
    if (irsd <= 2) s += 3;
    else if (irsd <= 4) s += 2;
    else if (irsd <= 6) s += 1;
  }
  if (ip >= 10) s += 2;
  else if (ip >= 3) s += 1;
  if (mmm >= 6) s += 2;
  else if (mmm >= 4) s += 1;
  return s;
}

// Distance-aware need score (0-9): base score + distance-to-nearest-outlet weighting.
function needScoreWithDistance(irsd, ip, mmm, distanceKm) {
  let s = needScore(irsd, ip, mmm);
  if (distanceKm != null) {
    if (distanceKm > 100) s += 2;
    else if (distanceKm > 50) s += 1;
  }
  return s;
}

export const NEED_TIERS = [
  { min: 6, label: "Critical", color: "#ef4444", bg: "#fef2f2", text: "#991b1b", border: "rgba(239,68,68,0.3)" },
  { min: 4, label: "High", color: "#f97316", bg: "#fff7ed", text: "#9a3412", border: "rgba(249,115,22,0.3)" },
  { min: 2, label: "Medium", color: "#d97706", bg: "#fffbeb", text: "#92400e", border: "rgba(217,119,6,0.3)" },
  { min: 1, label: "Watch", color: "#a3a3a3", bg: "var(--c-bg3)", text: "var(--c-text3)", border: "var(--c-border)" },
];

export function getTier(score) {
  return NEED_TIERS.find((t) => score >= t.min) ?? null;
}

function isNswResidentialRow(r, states) {
  if (states[r[1]] !== "NSW") return false;
  // Skip postcodes with neither population nor IRSD (non-residential / no data)
  if ((r[7] || 0) <= 0 && (r[9] || 0) <= 0) return false;
  return true;
}

function getRowLhdName(r, lhdNames) {
  return r[6] >= 0 ? lhdNames[r[6]] : "—";
}

function updateSummaryAndLhdCoverage(summary, lhdMap, lhd, covered) {
  summary.total++;
  if (covered) summary.covered++;

  if (lhd === "—") return;
  if (!lhdMap[lhd]) lhdMap[lhd] = { total: 0, covered: 0 };
  lhdMap[lhd].total++;
  if (covered) lhdMap[lhd].covered++;
}

function normalizeGapRow(r, zoneMap, zoneNames) {
  const pc = r[0];
  const pl = r[2] ?? "";
  const mmm = r[3] ?? 0;
  const erp = r[7] ?? 0;
  const ip = r[8] ?? 0;
  const id = r[9] ?? 0;
  const zoneIdx = zoneMap[mmm] ?? 0;
  const zn = zoneNames[zoneIdx] ?? "";
  return { pc, pl, erp, ip, id, mmm, zn };
}

function buildUncoveredPostcodeRecord(r, lhd, zoneMap, zoneNames, getNearestNsp) {
  const row = normalizeGapRow(r, zoneMap, zoneNames);
  const nearest = getNearestNsp(row.pc);
  const distKm = nearest ? nearest.distanceKm : null;
  const score = needScoreWithDistance(row.id, row.ip, row.mmm, distKm);

  if (score < 1) return null;

  return {
    pc: row.pc,
    pl: row.pl,
    lhd,
    erp: row.erp,
    ip: row.ip,
    id: row.id,
    mmm: row.mmm,
    zn: row.zn,
    score,
    distKm,
    nearestOutlet: nearest?.outlet?.n || null,
  };
}

function buildLhdCoverage(lhdMap) {
  return Object.entries(lhdMap)
    .map(([name, d]) => ({
      name,
      ...d,
      pct: d.total > 0 ? Math.round((d.covered / d.total) * 100) : 0,
    }))
    .sort((a, b) => a.pct - b.pct); // worst coverage first
}

function computeCoveredPct(summary) {
  return summary.total > 0 ? Math.round((summary.covered / summary.total) * 100) : 0;
}

export function buildGapAnalysis({
  data,
  states,
  lhdNames,
  nspPc,
  zoneMap,
  zoneNames,
  getNearestNsp,
}) {
  const summary = { total: 0, covered: 0, coveredPct: 0, highNeedUncovered: 0 };
  const lhdMap = {};
  const uncovered = [];

  data.forEach((r) => {
    if (!isNswResidentialRow(r, states)) return;

    const pc = r[0];
    const lhd = getRowLhdName(r, lhdNames);
    const covered = !!nspPc[pc];
    updateSummaryAndLhdCoverage(summary, lhdMap, lhd, covered);

    if (!covered) {
      const uncoveredRecord = buildUncoveredPostcodeRecord(
        r,
        lhd,
        zoneMap,
        zoneNames,
        getNearestNsp
      );
      if (!uncoveredRecord) return;
      uncovered.push(uncoveredRecord);
      if (uncoveredRecord.score >= 4) summary.highNeedUncovered++;
    }
  });

  summary.coveredPct = computeCoveredPct(summary);
  const lhdCoverage = buildLhdCoverage(lhdMap);
  uncovered.sort((a, b) => b.score - a.score);

  return { summary, lhdCoverage, uncovered };
}
