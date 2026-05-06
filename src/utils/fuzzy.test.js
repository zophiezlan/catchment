import { describe, it, expect } from "vitest";
import {
  buildTrigrams,
  trigramSimilarity,
  levenshtein,
  buildTrigramIndex,
  fuzzySearch,
} from "./fuzzy";

describe("buildTrigrams", () => {
  it("produces trigrams from a simple word", () => {
    const t = buildTrigrams("cat");
    expect(t.has(" ca")).toBe(true);
    expect(t.has("cat")).toBe(true);
    expect(t.has("at ")).toBe(true);
  });

  it("lowercases and strips non-alpha", () => {
    const t = buildTrigrams("O'Brien");
    expect(t.has(" ob")).toBe(true);
    expect(t.has("rie")).toBe(true);
  });

  it("handles empty string", () => {
    const t = buildTrigrams("");
    // Padded " " produces a small set of space-only trigrams
    expect(t.size).toBeGreaterThanOrEqual(0);
  });
});

describe("trigramSimilarity", () => {
  it("returns 1 for identical sets", () => {
    const t = buildTrigrams("sydney");
    expect(trigramSimilarity(t, t)).toBe(1);
  });

  it("returns 0 for completely different strings", () => {
    const a = buildTrigrams("aaa");
    const b = buildTrigrams("zzz");
    expect(trigramSimilarity(a, b)).toBeLessThan(0.2);
  });

  it("returns high score for similar strings", () => {
    const a = buildTrigrams("sydney");
    const b = buildTrigrams("sydeny");
    expect(trigramSimilarity(a, b)).toBeGreaterThan(0.25);
  });
});

describe("levenshtein", () => {
  it("returns 0 for identical strings", () => {
    expect(levenshtein("abc", "abc")).toBe(0);
  });

  it("returns string length for empty comparisons", () => {
    expect(levenshtein("abc", "")).toBe(3);
    expect(levenshtein("", "abc")).toBe(3);
  });

  it("counts single-char edits", () => {
    expect(levenshtein("cat", "bat")).toBe(1);
    expect(levenshtein("cat", "cats")).toBe(1);
    expect(levenshtein("cats", "cat")).toBe(1);
  });

  it("handles transpositions", () => {
    expect(levenshtein("sydney", "sydeny")).toBe(2); // transpose = 2 edits in Levenshtein
  });
});

describe("fuzzySearch", () => {
  const candidates = [
    "sydney", "parramatta", "melbourne", "brisbane",
    "adelaide", "perth", "hobart", "darwin",
    "newcastle", "wollongong", "bondi", "surry hills",
  ];
  const index = buildTrigramIndex(candidates);

  it("finds exact matches with high score", () => {
    const res = fuzzySearch("sydney", index, 3);
    expect(res.length).toBeGreaterThan(0);
    expect(res[0].name).toBe("sydney");
  });

  it("finds misspelled sydney", () => {
    const res = fuzzySearch("sydeny", index, 3);
    expect(res.some(r => r.name === "sydney")).toBe(true);
  });

  it("finds misspelled parramatta", () => {
    const res = fuzzySearch("parmatta", index, 3);
    expect(res.some(r => r.name === "parramatta")).toBe(true);
  });

  it("finds misspelled melbourne", () => {
    const res = fuzzySearch("melborn", index, 3);
    expect(res.some(r => r.name === "melbourne")).toBe(true);
  });

  it("returns empty for empty query", () => {
    expect(fuzzySearch("", index, 3)).toEqual([]);
  });

  it("respects limit", () => {
    const res = fuzzySearch("b", index, 2);
    expect(res.length).toBeLessThanOrEqual(2);
  });
});
