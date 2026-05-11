/**
 * Pure cohort analysis logic — extracted from CohortAnalyser.jsx for testability.
 *
 * All functions are pure (no React state, no DOM, no side effects).
 */

import { PIDX, decode, ZONE_NAMES, RA_LABELS } from "./data.js";

const STORAGE_KEY = "saved-cohorts";

/**
 * Analyse a raw text input containing postcodes.
 * Extracts postcodes (3-4 digit numbers), matches against the dataset,
 * and produces aggregate statistics.
 *
 * @param {string} raw - raw text containing postcodes in any format
 * @returns {object} analysis results
 */
export function analyseCohort(raw) {
  const pcs = raw.match(/\d{3,4}/g) || [];
  const unique = [...new Set(pcs.map(Number))];
  const matched = [];
  const missed = [];

  unique.forEach((pc) => {
    if (PIDX[pc]) matched.push(decode(PIDX[pc]));
    else missed.push(pc);
  });

  if (!matched.length) {
    return { empty: true };
  }

  const zones = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const ras = {};
  const phns = {};
  const lhds = {};
  const states = {};
  const irsd = Array(11).fill(0);
  let popTot = 0,
    indW = 0,
    indPop = 0;

  matched.forEach((d) => {
    zones[d.z] = (zones[d.z] || 0) + 1;
    ras[d.ra] = (ras[d.ra] || 0) + 1;
    if (d.hn) phns[d.hn] = (phns[d.hn] || 0) + 1;
    if (d.lhd) lhds[d.lhd] = (lhds[d.lhd] || 0) + 1;
    states[d.st] = (states[d.st] || 0) + 1;
    if (d.id > 0) irsd[d.id]++;
    if (d.erp > 0) popTot += d.erp;
    if (d.ip > 0) {
      indW += d.ip;
      indPop++;
    }
  });

  const bot20 = irsd.slice(1, 3).reduce((a, b) => a + b, 0);
  const withIrsd = irsd.slice(1).reduce((a, b) => a + b, 0);

  return {
    inputCount: pcs.length,
    uniqueCount: unique.length,
    matchCount: matched.length,
    missed,
    zones,
    ras,
    phns,
    lhds,
    states,
    irsd,
    popTot,
    avgInd: indPop > 0 ? (indW / indPop).toFixed(1) : "0",
    indPop,
    bot20,
    withIrsd,
    bot20pct: withIrsd > 0 ? ((bot20 / withIrsd) * 100).toFixed(0) : "0",
    total: matched.length,
  };
}

/**
 * Generate a human-readable summary of cohort analysis results.
 *
 * @param {object} r - results from analyseCohort()
 * @returns {string} summary text
 */
export function generateSummary(r) {
  const zoneParts = [1, 2, 3, 4]
    .filter((z) => r.zones[z] > 0)
    .map(
      (z) =>
        `${((r.zones[z] / r.total) * 100).toFixed(0)}% ${ZONE_NAMES[z].toLowerCase()}`,
    );

  const phnCount = Object.keys(r.phns).length;
  const lhdCount = Object.keys(r.lhds).length;

  let text = `Analysis of ${r.matchCount} unique service contact postcode${r.matchCount !== 1 ? "s" : ""}`;
  text += ` shows ${zoneParts.join(", ")}`;
  text += `, spanning ${phnCount} PHN region${phnCount !== 1 ? "s" : ""}`;
  if (lhdCount > 0)
    text += ` and ${lhdCount} NSW Local Health District${lhdCount !== 1 ? "s" : ""}`;
  text += ".";

  if (r.withIrsd > 0) {
    text += ` ${r.bot20pct}% of postcodes with IRSD data fall in the most disadvantaged quintile (decile 1–2).`;
  }

  if (Number(r.avgInd) > 0) {
    text += ` Average Indigenous population across matched postcodes is ${r.avgInd}%.`;
  }

  if (r.missed.length > 0) {
    text += ` ${r.missed.length} postcode${r.missed.length !== 1 ? "s were" : " was"} not matched.`;
  }

  return text;
}

/**
 * Load saved cohorts from localStorage.
 * @returns {Array} saved cohorts
 */
export function loadSavedCohorts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Get localStorage usage approximation.
 * @returns {{ usedKB: number, limitKB: number }}
 */
function getStorageUsage() {
  try {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      total += (localStorage.getItem(key) || "").length;
    }
    return { usedKB: Math.round((total * 2) / 1024), limitKB: 5120 };
  } catch {
    return { usedKB: 0, limitKB: 5120 };
  }
}

/**
 * Persist cohorts to localStorage with size checking.
 * @param {Array} cohorts
 * @returns {boolean} success
 */
export function persistCohorts(cohorts) {
  try {
    const data = JSON.stringify(cohorts);
    const sizeKB = Math.round((data.length * 2) / 1024);
    const { usedKB, limitKB } = getStorageUsage();
    if (usedKB + sizeKB > limitKB * 0.9) {
      console.warn("LocalStorage near capacity — cohort not saved");
      return false;
    }
    localStorage.setItem(STORAGE_KEY, data);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract unique matched postcodes from raw input.
 * @param {string} raw
 * @returns {number[]} matched postcodes
 */
export function extractPostcodes(raw) {
  const pcs = raw.match(/\d{3,4}/g) || [];
  return [...new Set(pcs.map(Number))].filter(pc => PIDX[pc]);
}
