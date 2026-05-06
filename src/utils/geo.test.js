import { describe, it, expect } from "vitest";
import { haversine, nearestOutlet, nearestOutletByType, distanceTier } from "./geo";

describe("haversine", () => {
  it("returns 0 for same point", () => {
    expect(haversine(-33.87, 151.21, -33.87, 151.21)).toBe(0);
  });

  it("calculates Sydney CBD to Parramatta (~23 km)", () => {
    const d = haversine(-33.8688, 151.2093, -33.8151, 151.0011);
    expect(d).toBeGreaterThan(20);
    expect(d).toBeLessThan(26);
  });

  it("calculates Sydney to Melbourne (~714 km)", () => {
    const d = haversine(-33.8688, 151.2093, -37.8136, 144.9631);
    expect(d).toBeGreaterThan(700);
    expect(d).toBeLessThan(730);
  });

  it("calculates short distance (< 1km)", () => {
    // Sydney Opera House to Circular Quay (~300m)
    const d = haversine(-33.8568, 151.2153, -33.8612, 151.2109);
    expect(d).toBeGreaterThan(0.2);
    expect(d).toBeLessThan(1);
  });
});

describe("nearestOutlet", () => {
  const outlets = [
    { n: "Sydney NSP", lat: -33.87, lon: 151.21, t: "primary" },
    { n: "Parramatta NSP", lat: -33.82, lon: 151.00, t: "primary" },
    { n: "Redfern Pharmacy", lat: -33.89, lon: 151.20, t: "pharmacy" },
  ];

  it("finds the closest outlet", () => {
    // Point near Sydney CBD
    const result = nearestOutlet(-33.87, 151.21, outlets);
    expect(result).not.toBeNull();
    expect(result.outlet.n).toBe("Sydney NSP");
    expect(result.distanceKm).toBeLessThan(1);
  });

  it("finds Parramatta as closest to a western point", () => {
    const result = nearestOutlet(-33.82, 150.98, outlets);
    expect(result.outlet.n).toBe("Parramatta NSP");
  });

  it("returns null for empty outlets array", () => {
    expect(nearestOutlet(-33.87, 151.21, [])).toBeNull();
  });

  it("skips outlets without coordinates", () => {
    const mixed = [
      { n: "No coords", t: "primary" },
      { n: "Has coords", lat: -33.87, lon: 151.21, t: "primary" },
    ];
    const result = nearestOutlet(-33.87, 151.21, mixed);
    expect(result.outlet.n).toBe("Has coords");
  });
});

describe("nearestOutletByType", () => {
  const outlets = [
    { n: "Primary NSP", lat: -33.87, lon: 151.21, t: "primary" },
    { n: "Pharmacy", lat: -33.88, lon: 151.21, t: "pharmacy" },
  ];

  it("filters by type", () => {
    const result = nearestOutletByType(-33.88, 151.21, outlets, "pharmacy");
    expect(result.outlet.n).toBe("Pharmacy");
  });

  it("returns null if no outlets of that type", () => {
    const result = nearestOutletByType(-33.87, 151.21, outlets, "secondary");
    expect(result).toBeNull();
  });
});

describe("distanceTier", () => {
  it("returns green for < 20km", () => {
    expect(distanceTier(10).color).toBe("#059669");
    expect(distanceTier(10).severity).toBe(0);
  });

  it("returns amber for 20-50km", () => {
    expect(distanceTier(30).severity).toBe(1);
  });

  it("returns orange for 50-100km", () => {
    expect(distanceTier(75).severity).toBe(2);
  });

  it("returns red for > 100km", () => {
    expect(distanceTier(150).color).toBe("#ef4444");
    expect(distanceTier(150).severity).toBe(3);
  });
});
