// Need score (0-7): SEIFA decile + Indigenous% + MMM.
// `decile` is on the SEIFA convention where 1 = most disadvantaged / lowest score.
// Works for any SEIFA index — IRSD, IRSAD, IER, IEO — because the disadvantage
// direction is consistent across all four (low decile = more disadvantage).
function needScore(decile, ip, mmm) {
  let s = 0;
  if (decile > 0) {
    if (decile <= 2) s += 3;
    else if (decile <= 4) s += 2;
    else if (decile <= 6) s += 1;
  }
  if (ip >= 10) s += 2;
  else if (ip >= 3) s += 1;
  if (mmm >= 6) s += 2;
  else if (mmm >= 4) s += 1;
  return s;
}

// Distance-aware need score (0-9): base score + distance-to-nearest-outlet weighting.
function needScoreWithDistance(decile, ip, mmm, distanceKm) {
  let s = needScore(decile, ip, mmm);
  if (distanceKm != null) {
    if (distanceKm > 100) s += 2;
    else if (distanceKm > 50) s += 1;
  }
  return s;
}

export const NEED_TIERS = [
  { min: 6, label: "Critical", color: "#ef4444", bg: "var(--c-error-bg)", text: "var(--c-error-text)", border: "var(--c-error-border)" },
  { min: 4, label: "High", color: "#f97316", bg: "var(--c-orange-bg)", text: "var(--c-orange-text)", border: "var(--c-orange-border)" },
  { min: 2, label: "Medium", color: "#d97706", bg: "var(--c-warning-bg)", text: "var(--c-warning-text)", border: "var(--c-warning-border)" },
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

function buildUncoveredPostcodeRecord(r, lhd, zoneMap, zoneNames, getNearestNsp, getDecileFn) {
  const row = normalizeGapRow(r, zoneMap, zoneNames);
  const nearest = getNearestNsp(row.pc);
  const distKm = nearest ? nearest.distanceKm : null;
  const decile = getDecileFn(row.pc, row.id);
  const score = needScoreWithDistance(decile, row.ip, row.mmm, distKm);

  if (score < 1) return null;

  return {
    pc: row.pc,
    pl: row.pl,
    lhd,
    erp: row.erp,
    ip: row.ip,
    id: row.id,        // always the IRSD decile for backwards compat
    decile,            // the decile actually used for scoring (varies by selected index)
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
  // Optional: function(postcode, irsdFromRow) → decile (1–10) for the SEIFA index
  // driving the disadvantage component. Defaults to returning IRSD from the row,
  // which preserves existing v1 behaviour.
  getDecile = (_pc, irsd) => irsd,
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
        getNearestNsp,
        getDecile,
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
