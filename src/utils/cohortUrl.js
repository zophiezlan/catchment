/**
 * Shareable cohort URLs — encode/decode postcode lists in URL hash.
 *
 * Small cohorts (< 100):  #cohort/2000,2010,2050
 * Large cohorts (>= 100): #cohort/b64:<base64 encoded comma string>
 */

const PREFIX = "cohort/";
const B64_PREFIX = "b64:";
const LARGE_THRESHOLD = 100; // postcodes

/**
 * Check if a hash string is a cohort share link.
 * @param {string} hash - window.location.hash (with or without #)
 */
export function isCohortHash(hash) {
  const h = hash.startsWith("#") ? hash.slice(1) : hash;
  return h.startsWith(PREFIX);
}

/**
 * Encode an array of postcodes into a URL hash fragment.
 * @param {number[]} postcodes
 * @returns {string} hash fragment including #
 */
export function encodeCohort(postcodes) {
  if (!postcodes.length) return "";
  const sorted = [...new Set(postcodes)].sort((a, b) => a - b);
  const csv = sorted.join(",");

  if (sorted.length >= LARGE_THRESHOLD) {
    try {
      const encoded = btoa(csv);
      return `#${PREFIX}${B64_PREFIX}${encoded}`;
    } catch {
      // Fallback to plain CSV if btoa fails
      return `#${PREFIX}${csv}`;
    }
  }

  return `#${PREFIX}${csv}`;
}

/**
 * Decode a cohort hash back to an array of postcodes.
 * @param {string} hash - window.location.hash (with or without #)
 * @returns {number[]} sorted array of postcodes, or empty if invalid
 */
export function decodeCohort(hash) {
  try {
    const h = hash.startsWith("#") ? hash.slice(1) : hash;
    if (!h.startsWith(PREFIX)) return [];

    let payload = h.slice(PREFIX.length);

    // Decode base64 if present
    if (payload.startsWith(B64_PREFIX)) {
      payload = atob(payload.slice(B64_PREFIX.length));
    }

    // Parse comma-separated postcodes
    const postcodes = payload
      .split(",")
      .map(s => parseInt(s, 10))
      .filter(n => !isNaN(n) && n >= 200 && n <= 9999);

    return [...new Set(postcodes)].sort((a, b) => a - b);
  } catch {
    return [];
  }
}

/**
 * Generate a full shareable URL for a cohort.
 * @param {number[]} postcodes
 * @returns {string} full URL
 */
export function buildShareUrl(postcodes) {
  const hash = encodeCohort(postcodes);
  if (!hash) return "";
  return `${window.location.origin}${window.location.pathname}${hash}`;
}
