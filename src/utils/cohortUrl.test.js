import { describe, it, expect } from "vitest";
import {
  isCohortHash,
  encodeCohort,
  decodeCohort,
  buildShareUrl,
} from "./cohortUrl";

describe("isCohortHash", () => {
  it("recognises a valid cohort hash", () => {
    expect(isCohortHash("#cohort/2000,2010")).toBe(true);
    expect(isCohortHash("cohort/2000,2010")).toBe(true);
  });

  it("rejects non-cohort hashes", () => {
    expect(isCohortHash("#overview")).toBe(false);
    expect(isCohortHash("#lookup")).toBe(false);
    expect(isCohortHash("")).toBe(false);
  });
});

describe("encodeCohort / decodeCohort round-trip", () => {
  it("round-trips a small cohort", () => {
    const pcs = [2000, 2010, 4000, 3000];
    const hash = encodeCohort(pcs);
    const decoded = decodeCohort(hash);
    // Should be sorted and deduplicated
    expect(decoded).toEqual([2000, 2010, 3000, 4000]);
  });

  it("round-trips an empty array", () => {
    expect(encodeCohort([])).toBe("");
    expect(decodeCohort("")).toEqual([]);
  });

  it("deduplicates postcodes", () => {
    const hash = encodeCohort([2000, 2000, 2010]);
    const decoded = decodeCohort(hash);
    expect(decoded).toEqual([2000, 2010]);
  });

  it("handles a large cohort (base64 encoded)", () => {
    // Generate 150 postcodes
    const pcs = Array.from({ length: 150 }, (_, i) => 2000 + i);
    const hash = encodeCohort(pcs);
    expect(hash).toContain("b64:");
    const decoded = decodeCohort(hash);
    expect(decoded.length).toBe(150);
    expect(decoded[0]).toBe(2000);
    expect(decoded[149]).toBe(2149);
  });

  it("rejects invalid postcode values", () => {
    const decoded = decodeCohort("#cohort/99,2000,99999");
    // 99 is below 200, 99999 is above 9999 — both filtered
    expect(decoded).toEqual([2000]);
  });
});

describe("decodeCohort edge cases", () => {
  it("returns empty for malformed hash", () => {
    expect(decodeCohort("#cohort/")).toEqual([]);
    expect(decodeCohort("#cohort/abc")).toEqual([]);
  });

  it("returns empty for wrong prefix", () => {
    expect(decodeCohort("#lookup/2000")).toEqual([]);
  });

  it("handles base64 decoding errors gracefully", () => {
    expect(decodeCohort("#cohort/b64:!!!invalid!!!")).toEqual([]);
  });
});
