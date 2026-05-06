/**
 * Geographic utilities for distance-based NSP gap analysis.
 * Haversine formula + nearest-outlet calculations.
 */

const R = 6371; // Earth radius in km
const RAD = Math.PI / 180;

/**
 * Haversine distance between two lat/lon pairs in km.
 */
export function haversine(lat1, lon1, lat2, lon2) {
  const dLat = (lat2 - lat1) * RAD;
  const dLon = (lon2 - lon1) * RAD;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Find the nearest outlet from a given point.
 * @param {number} lat
 * @param {number} lon
 * @param {Array<{lat: number, lon: number}>} outlets
 * @returns {{ outlet: object, distanceKm: number, index: number } | null}
 */
export function nearestOutlet(lat, lon, outlets) {
  if (!outlets.length) return null;
  let best = null;
  let bestDist = Infinity;
  let bestIdx = -1;

  for (let i = 0; i < outlets.length; i++) {
    const o = outlets[i];
    if (o.lat == null || o.lon == null) continue;
    const d = haversine(lat, lon, o.lat, o.lon);
    if (d < bestDist) {
      bestDist = d;
      best = o;
      bestIdx = i;
    }
  }

  return best ? { outlet: best, distanceKm: Math.round(bestDist * 10) / 10, index: bestIdx } : null;
}

/**
 * Find the nearest outlet of a specific type.
 * @param {number} lat
 * @param {number} lon
 * @param {Array} outlets
 * @param {string} type - "primary", "secondary", or "pharmacy"
 * @returns {{ outlet: object, distanceKm: number } | null}
 */
export function nearestOutletByType(lat, lon, outlets, type) {
  const filtered = outlets.filter(o => o.t === type);
  return nearestOutlet(lat, lon, filtered);
}

/**
 * Distance tier for color coding.
 * @param {number} km
 * @returns {{ label: string, color: string, severity: number }}
 */
export function distanceTier(km) {
  if (km > 100) return { label: "> 100 km", color: "#ef4444", severity: 3 };
  if (km > 50) return { label: "50–100 km", color: "#f97316", severity: 2 };
  if (km > 20) return { label: "20–50 km", color: "#d97706", severity: 1 };
  return { label: "< 20 km", color: "#059669", severity: 0 };
}
