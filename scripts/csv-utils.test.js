import { describe, it, expect } from "vitest";
import { parseCSV, csv2obj } from "./csv-utils.mjs";

describe("parseCSV", () => {
  it("parses basic CSV rows", () => {
    const rows = parseCSV("a,b\n1,2\n3,4\n");
    expect(rows).toEqual([
      ["a", "b"],
      ["1", "2"],
      ["3", "4"],
    ]);
  });

  it("handles quoted fields with commas and embedded newlines", () => {
    const rows = parseCSV('name,notes\n"Alpha","line 1\nline 2"\n');
    expect(rows[1][0]).toBe("Alpha");
    expect(rows[1][1]).toBe("line 1\nline 2");
  });
});

describe("csv2obj", () => {
  it("maps rows to trimmed object keys and values", () => {
    const result = csv2obj("Name, Value\n Test , 42 \n");
    expect(result).toEqual([{ Name: "Test", Value: "42" }]);
  });
});
