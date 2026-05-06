import { describe, it, expect } from "vitest";
import {
  analyseCohort,
  generateSummary,
  extractPostcodes,
} from "./cohort";

describe("analyseCohort", () => {
  it("returns empty for no valid postcodes", () => {
    const r = analyseCohort("hello world");
    expect(r.empty).toBe(true);
  });

  it("analyses known postcodes correctly", () => {
    const r = analyseCohort("2000\n2010\n4000");
    expect(r.empty).toBeUndefined();
    expect(r.matchCount).toBe(3);
    expect(r.uniqueCount).toBe(3);
    expect(r.total).toBe(3);
    expect(r.missed).toEqual([]);
  });

  it("handles duplicate postcodes", () => {
    const r = analyseCohort("2000, 2000, 2000, 2010");
    expect(r.matchCount).toBe(2);
    expect(r.uniqueCount).toBe(2);
    expect(r.inputCount).toBe(4);
  });

  it("tracks missed postcodes", () => {
    const r = analyseCohort("2000\n1111");
    expect(r.matchCount).toBe(1);
    expect(r.missed).toContain(1111);
  });

  it("extracts postcodes from messy text", () => {
    const r = analyseCohort("I came from 2000 and my mate from 2010, also 4000.");
    expect(r.matchCount).toBe(3);
  });

  it("computes zone breakdown", () => {
    const r = analyseCohort("2000\n2010"); // Both metro (zone 1)
    expect(r.zones[1]).toBe(2);
  });

  it("computes IRSD statistics", () => {
    const r = analyseCohort("2000\n2010\n4000");
    expect(r.withIrsd).toBeGreaterThan(0);
    expect(r.bot20pct).toBeDefined();
  });

  it("computes population total", () => {
    const r = analyseCohort("2000\n2010");
    expect(r.popTot).toBeGreaterThan(0);
  });
});

describe("generateSummary", () => {
  it("produces a non-empty string", () => {
    const r = analyseCohort("2000\n2010\n4000");
    const text = generateSummary(r);
    expect(text.length).toBeGreaterThan(50);
    expect(text).toContain("3 unique service contact postcodes");
  });

  it("mentions missed postcodes when present", () => {
    const r = analyseCohort("2000\n1111");
    const text = generateSummary(r);
    expect(text).toContain("1 postcode was not matched");
  });

  it("mentions PHN regions", () => {
    const r = analyseCohort("2000\n4000");
    const text = generateSummary(r);
    expect(text).toContain("PHN region");
  });
});

describe("extractPostcodes", () => {
  it("extracts and deduplicates postcodes", () => {
    const pcs = extractPostcodes("2000, 2010, 2000, 4000");
    expect(pcs).toContain(2000);
    expect(pcs).toContain(2010);
    expect(pcs).toContain(4000);
    expect(pcs.length).toBe(3);
  });

  it("filters out unmatched postcodes", () => {
    const pcs = extractPostcodes("2000, 1111");
    expect(pcs).toContain(2000);
    expect(pcs).not.toContain(1111);
  });

  it("returns empty for no postcodes", () => {
    expect(extractPostcodes("hello")).toEqual([]);
  });
});
