import { describe, it, expect } from "vitest";
import { extractRings } from "./wkt-utils.mjs";

describe("extractRings", () => {
  it("extracts polygon rings from MULTIPOLYGON WKT", () => {
    const wkt = "MULTIPOLYGON (((151 -33, 151.1 -33, 151.1 -33.1, 151 -33.1, 151 -33)), ((150 -34, 150.1 -34, 150.1 -34.1, 150 -34.1, 150 -34)))";
    const rings = extractRings(wkt);
    expect(rings.length).toBe(2);
    expect(rings[0].length).toBe(5);
    expect(rings[1].length).toBe(5);
  });

  it("ignores non-coordinate groups and invalid short rings", () => {
    const wkt = "GEOMETRYCOLLECTION (POINT (151 -33), POLYGON ((151 -33, 151.1 -33, 151 -33)))";
    const rings = extractRings(wkt);
    expect(rings.length).toBe(0);
  });
});
