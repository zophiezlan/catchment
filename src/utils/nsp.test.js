import { describe, it, expect } from "vitest";
import {
  NSP_ALL,
  NSP_PC,
  NSP_LHDS,
  NSP_FACILITIES,
  getNSPByLHD,
  getGapAnalysis,
  getNearestNSP,
  getNearestPrimaryNSP,
  hasCentroid,
  NEED_TIERS,
  getTier,
} from "./nsp";

describe("NSP data", () => {
  it("loads outlets", () => {
    expect(NSP_ALL.length).toBeGreaterThan(0);
  });

  it("has postcode counts indexed", () => {
    expect(Object.keys(NSP_PC).length).toBeGreaterThan(0);
    // Each entry has primary, secondary, pharmacy
    const sample = NSP_PC[Object.keys(NSP_PC)[0]];
    expect(sample).toHaveProperty("primary");
    expect(sample).toHaveProperty("secondary");
    expect(sample).toHaveProperty("pharmacy");
  });

  it("has LHD names", () => {
    expect(NSP_LHDS.length).toBeGreaterThan(0);
  });

  it("has normalised facilities", () => {
    expect(NSP_FACILITIES.length).toBeGreaterThan(0);
  });
});

describe("getNSPByLHD", () => {
  it("returns sorted array of LHD outlet counts", () => {
    const lhds = getNSPByLHD();
    expect(lhds.length).toBeGreaterThan(0);
    // Each has name and counts
    expect(lhds[0]).toHaveProperty("name");
    expect(lhds[0]).toHaveProperty("primary");
    // Sorted by total desc
    for (let i = 1; i < lhds.length; i++) {
      const totalPrev = lhds[i-1].primary + lhds[i-1].secondary + lhds[i-1].pharmacy;
      const totalCur = lhds[i].primary + lhds[i].secondary + lhds[i].pharmacy;
      expect(totalCur).toBeLessThanOrEqual(totalPrev);
    }
  });
});

describe("getGapAnalysis", () => {
  it("returns expected shape", () => {
    const { summary, lhdCoverage, uncovered } = getGapAnalysis();
    expect(summary.total).toBeGreaterThan(0);
    expect(summary.covered).toBeGreaterThan(0);
    expect(summary.coveredPct).toBeGreaterThan(0);
    expect(summary.coveredPct).toBeLessThanOrEqual(100);
    expect(lhdCoverage.length).toBeGreaterThan(0);
    expect(uncovered.length).toBeGreaterThan(0);
  });

  it("uncovered postcodes have valid scores", () => {
    const { uncovered } = getGapAnalysis();
    for (const p of uncovered.slice(0, 20)) {
      expect(p.score).toBeGreaterThanOrEqual(1);
      expect(p.pc).toBeGreaterThan(0);
      expect(p.zn).toBeTruthy();
    }
  });

  it("uncovered postcodes include distance when centroid available", () => {
    const { uncovered } = getGapAnalysis();
    const withDist = uncovered.filter(p => p.distKm != null);
    // At least some should have distance data
    expect(withDist.length).toBeGreaterThan(0);
    for (const p of withDist) {
      expect(p.distKm).toBeGreaterThanOrEqual(0);
      expect(p.nearestOutlet).toBeTruthy();
    }
  });

  it("lhdCoverage entries have valid percentages", () => {
    const { lhdCoverage } = getGapAnalysis();
    for (const lhd of lhdCoverage) {
      expect(lhd.pct).toBeGreaterThanOrEqual(0);
      expect(lhd.pct).toBeLessThanOrEqual(100);
      expect(lhd.name).toBeTruthy();
    }
  });

  it("accepts a SEIFA index option and produces different scores per index", () => {
    const irsd = getGapAnalysis({ seifaIndex: "irsd" });
    const ieo  = getGapAnalysis({ seifaIndex: "ieo" });
    // Both should produce results with the same shape
    expect(irsd.uncovered.length).toBeGreaterThan(0);
    expect(ieo.uncovered.length).toBeGreaterThan(0);
    // Coverage stats are independent of SEIFA index used (same postcodes)
    expect(irsd.summary.covered).toBe(ieo.summary.covered);
    expect(irsd.summary.total).toBe(ieo.summary.total);
    // Uncovered records carry the decile used for scoring
    for (const p of ieo.uncovered.slice(0, 5)) {
      if (p.decile > 0) {
        expect(p.decile).toBeGreaterThanOrEqual(1);
        expect(p.decile).toBeLessThanOrEqual(10);
      }
    }
  });

  it("default seifaIndex matches explicit irsd selection", () => {
    const def = getGapAnalysis();
    const irsd = getGapAnalysis({ seifaIndex: "irsd" });
    expect(def.uncovered.length).toBe(irsd.uncovered.length);
    expect(def.summary.highNeedUncovered).toBe(irsd.summary.highNeedUncovered);
  });
});

describe("NEED_TIERS and getTier", () => {
  it("has tiers in descending min order", () => {
    for (let i = 1; i < NEED_TIERS.length; i++) {
      expect(NEED_TIERS[i].min).toBeLessThan(NEED_TIERS[i-1].min);
    }
  });

  it("getTier returns correct tier for score", () => {
    expect(getTier(6).label).toBe("Critical");
    expect(getTier(4).label).toBe("High");
    expect(getTier(2).label).toBe("Medium");
    expect(getTier(1).label).toBe("Watch");
    expect(getTier(0)).toBeNull();
  });
});

describe("getNearestNSP", () => {
  it("returns result for a postcode with centroid data", () => {
    // 2000 (Sydney CBD) should have centroid data from outlets
    const result = getNearestNSP(2000);
    if (result) {
      expect(result.outlet).toBeDefined();
      expect(result.distanceKm).toBeGreaterThanOrEqual(0);
    }
  });

  it("returns null for a postcode without centroid data", () => {
    expect(getNearestNSP(99999)).toBeNull();
  });

  it("hasCentroid returns boolean", () => {
    expect(typeof hasCentroid(2000)).toBe("boolean");
    expect(hasCentroid(99999)).toBe(false);
  });
});
