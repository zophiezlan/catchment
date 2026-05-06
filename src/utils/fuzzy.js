/**
 * Lightweight trigram-based fuzzy search for Australian place names.
 * No external dependencies — optimised for ~15K locality candidates.
 */

/** Build trigram set from a string, padded with spaces */
export function buildTrigrams(str) {
  const s = ` ${str.toLowerCase().replace(/[^a-z ]/g, "")} `;
  const set = new Set();
  for (let i = 0; i <= s.length - 3; i++) {
    set.add(s.slice(i, i + 3));
  }
  return set;
}

/** Dice coefficient between two trigram sets (0–1) */
export function trigramSimilarity(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;
  let shared = 0;
  for (const t of setA) {
    if (setB.has(t)) shared++;
  }
  return (2 * shared) / (setA.size + setB.size);
}

/** Simple Levenshtein distance for short strings */
export function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Precomputed trigram index for a list of candidate strings.
 * Build once at module init, reuse for every search.
 */
export function buildTrigramIndex(candidates) {
  return candidates.map(name => ({
    name,
    trigrams: buildTrigrams(name),
  }));
}

/**
 * Fuzzy search against a precomputed trigram index.
 * Returns top matches above the threshold, sorted by relevance.
 *
 * @param {string} query
 * @param {Array<{name: string, trigrams: Set}>} index - from buildTrigramIndex
 * @param {number} limit - max results
 * @param {number} threshold - minimum similarity (default 0.25)
 * @returns {Array<{name: string, score: number}>}
 */
export function fuzzySearch(query, index, limit = 8, threshold = 0.25) {
  const ql = query.toLowerCase().replace(/[^a-z ]/g, "");
  if (!ql) return [];

  const queryTrigrams = buildTrigrams(ql);
  const results = [];

  for (const entry of index) {
    const sim = trigramSimilarity(queryTrigrams, entry.trigrams);
    if (sim >= threshold) {
      // For short queries (< 5 chars), boost Levenshtein-close matches
      let score = sim;
      if (ql.length < 5) {
        const editDist = levenshtein(ql, entry.name.slice(0, ql.length + 2));
        const editSim = 1 - editDist / Math.max(ql.length, entry.name.length);
        score = Math.max(sim, editSim * 0.9); // blend
      }
      // Bonus for matching start
      if (entry.name.startsWith(ql)) {
        score += 0.3;
      }
      results.push({ name: entry.name, score });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}
