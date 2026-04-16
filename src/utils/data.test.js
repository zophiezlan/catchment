import { describe, it, expect } from "vitest";
import {
  DATA,
  STATES,
  PHN_CODES,
  PHN_NAMES,
  LHD_NAMES,
  MMM_LABELS,
  RA_LABELS,
  ZONE_MAP,
  ZONE_NAMES,
  ZONE_COLORS,
  decode,
  IDX,
  PIDX,
  ALL_POSTCODES,
  PLACE_IDX,
  ALL_PLACES,
  searchPostcodes,
  getLHDSummary,
  toCSV,
  irsdColor,
} from "./data";

describe("data integrity", () => {
  it("loads a non-empty dataset", () => {
    expect(DATA.length).toBeGreaterThan(2000);
  });

  it("has all lookup tables populated", () => {
    expect(STATES.length).toBeGreaterThan(0);
    expect(PHN_CODES.length).toBeGreaterThan(0);
    expect(PHN_NAMES.length).toBe(PHN_CODES.length);
    expect(LHD_NAMES.length).toBeGreaterThan(0);
  });

  it("every record has 10 elements", () => {
    for (const r of DATA) {
      expect(r.length).toBe(10);
    }
  });

  it("every postcode is a positive number", () => {
    for (const r of DATA) {
      expect(r[0]).toBeGreaterThan(0);
      expect(Number.isInteger(r[0])).toBe(true);
    }
  });
});

describe("decode", () => {
  it("decodes a raw record into an object with expected fields", () => {
    const r = DATA[0];
    const d = decode(r);
    expect(d).toHaveProperty("pc");
    expect(d).toHaveProperty("st");
    expect(d).toHaveProperty("pl");
    expect(d).toHaveProperty("mmm");
    expect(d).toHaveProperty("ml");
    expect(d).toHaveProperty("ra");
    expect(d).toHaveProperty("rl");
    expect(d).toHaveProperty("hc");
    expect(d).toHaveProperty("hn");
    expect(d).toHaveProperty("lhd");
    expect(d).toHaveProperty("erp");
    expect(d).toHaveProperty("ip");
    expect(d).toHaveProperty("id");
    expect(d).toHaveProperty("z");
    expect(d).toHaveProperty("zn");
  });

  it("maps MMM to correct zone", () => {
    // MMM 1 → zone 1 (Metro)
    const fakeMetro = [2000, 0, "Test", 1, 1, 0, -1, 10000, 2.5, 5];
    const d = decode(fakeMetro);
    expect(d.z).toBe(1);
    expect(d.zn).toBe("Metro");

    // MMM 6 → zone 4 (Remote)
    const fakeRemote = [2000, 0, "Test", 6, 4, 0, -1, 100, 10, 2];
    const dRemote = decode(fakeRemote);
    expect(dRemote.z).toBe(4);
    expect(dRemote.zn).toBe("Remote");
  });

  it("handles missing PHN and LHD gracefully", () => {
    const r = [800, 0, "Test", 7, 5, -1, -1, 0, 0, 0];
    const d = decode(r);
    expect(d.hc).toBe("");
    expect(d.hn).toBe("");
    expect(d.lhd).toBe("");
  });
});

describe("indexes", () => {
  it("IDX maps postcodes to arrays of records", () => {
    const keys = Object.keys(IDX);
    expect(keys.length).toBeGreaterThan(0);
    for (const pc of keys.slice(0, 10)) {
      expect(Array.isArray(IDX[pc])).toBe(true);
      expect(IDX[pc].length).toBeGreaterThan(0);
    }
  });

  it("PIDX maps postcodes to a single primary record", () => {
    const keys = Object.keys(PIDX);
    expect(keys.length).toBeGreaterThan(0);
    for (const pc of keys.slice(0, 10)) {
      expect(Array.isArray(PIDX[pc])).toBe(true);
      expect(PIDX[pc].length).toBe(10); // single raw record with 10 elements
    }
  });

  it("ALL_POSTCODES is sorted numerically", () => {
    for (let i = 1; i < ALL_POSTCODES.length; i++) {
      expect(ALL_POSTCODES[i]).toBeGreaterThanOrEqual(ALL_POSTCODES[i - 1]);
    }
  });

  it("PLACE_IDX contains lowercase keys", () => {
    for (const key of ALL_PLACES.slice(0, 20)) {
      expect(key).toBe(key.toLowerCase());
    }
  });
});

describe("searchPostcodes", () => {
  it("returns empty array for empty query", () => {
    expect(searchPostcodes("")).toEqual([]);
    expect(searchPostcodes("  ")).toEqual([]);
  });

  it("finds postcodes by numeric prefix", () => {
    const res = searchPostcodes("200", 5);
    expect(res.length).toBeGreaterThan(0);
    for (const r of res) {
      expect(String(r.pc).startsWith("200")).toBe(true);
    }
  });

  it("finds exact postcode match", () => {
    const res = searchPostcodes("2000", 5);
    expect(res.length).toBeGreaterThan(0);
    expect(res[0].pc).toBe(2000);
  });

  it("finds postcodes by place name", () => {
    const res = searchPostcodes("sydney", 5);
    expect(res.length).toBeGreaterThan(0);
  });

  it("respects the limit parameter", () => {
    const res = searchPostcodes("2", 3);
    expect(res.length).toBeLessThanOrEqual(3);
  });

  it("returns results with expected shape", () => {
    const res = searchPostcodes("2000", 1);
    expect(res.length).toBe(1);
    const r = res[0];
    expect(r).toHaveProperty("pc");
    expect(r).toHaveProperty("pl");
    expect(r).toHaveProperty("st");
    expect(r).toHaveProperty("z");
    expect(r).toHaveProperty("zn");
  });
});

describe("getLHDSummary", () => {
  it("returns an array of LHD summaries", () => {
    const lhds = getLHDSummary();
    expect(lhds.length).toBeGreaterThan(0);
  });

  it("each LHD has required fields", () => {
    const lhds = getLHDSummary();
    for (const lhd of lhds) {
      expect(lhd).toHaveProperty("name");
      expect(lhd).toHaveProperty("postcodes");
      expect(lhd).toHaveProperty("pop");
      expect(lhd).toHaveProperty("avgInd");
      expect(lhd).toHaveProperty("bot20");
      expect(lhd).toHaveProperty("medianIrsd");
      expect(lhd).toHaveProperty("dominantZone");
      expect(lhd).toHaveProperty("zones");
      expect(lhd.postcodes).toBeGreaterThan(0);
    }
  });

  it("is sorted by postcode count descending", () => {
    const lhds = getLHDSummary();
    for (let i = 1; i < lhds.length; i++) {
      expect(lhds[i].postcodes).toBeLessThanOrEqual(lhds[i - 1].postcodes);
    }
  });
});

describe("toCSV", () => {
  it("generates a CSV string with headers", () => {
    const records = [decode(DATA[0]), decode(DATA[1])];
    const csv = toCSV(records);
    const lines = csv.split("\n");
    expect(lines.length).toBe(3); // header + 2 rows
    expect(lines[0]).toContain("Postcode");
    expect(lines[0]).toContain("State");
    expect(lines[0]).toContain("IRSD Decile");
  });

  it("quotes place names containing commas", () => {
    const d = decode(DATA[0]);
    d.pl = 'Test, Place "Name"';
    const csv = toCSV([d]);
    // The place field should be quoted with escaped inner quotes
    expect(csv).toContain('"Test, Place ""Name"""');
  });

  it("returns only headers for empty input", () => {
    const csv = toCSV([]);
    const lines = csv.split("\n");
    expect(lines.length).toBe(1);
  });
});

describe("irsdColor", () => {
  it("returns red for decile 1-2", () => {
    expect(irsdColor(1)).toBe("#ef4444");
    expect(irsdColor(2)).toBe("#ef4444");
  });

  it("returns amber for decile 3-4", () => {
    expect(irsdColor(3)).toBe("#f59e0b");
    expect(irsdColor(4)).toBe("#f59e0b");
  });

  it("returns green for decile 9-10", () => {
    expect(irsdColor(9)).toBe("#059669");
    expect(irsdColor(10)).toBe("#059669");
  });
});

describe("constants", () => {
  it("MMM_LABELS covers keys 1-7", () => {
    for (let i = 1; i <= 7; i++) {
      expect(MMM_LABELS[i]).toBeDefined();
    }
  });

  it("RA_LABELS covers keys 1-5", () => {
    for (let i = 1; i <= 5; i++) {
      expect(RA_LABELS[i]).toBeDefined();
    }
  });

  it("ZONE_MAP maps all MMM values to zones 1-4", () => {
    for (let i = 1; i <= 7; i++) {
      expect(ZONE_MAP[i]).toBeGreaterThanOrEqual(1);
      expect(ZONE_MAP[i]).toBeLessThanOrEqual(4);
    }
  });

  it("ZONE_NAMES and ZONE_COLORS cover zones 1-4", () => {
    for (let i = 1; i <= 4; i++) {
      expect(ZONE_NAMES[i]).toBeDefined();
      expect(ZONE_COLORS[i]).toBeDefined();
    }
  });
});
