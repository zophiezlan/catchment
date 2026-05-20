// OTP (Opioid Treatment Program) sites — community pharmacies + public clinics
// that dispense methadone, buprenorphine, or long-acting injectable
// buprenorphine (LAIB). Sourced from:
//   - NSW Health OTP community pharmacy map (canonical pharmacy list)
//   - per-LHD scrapes for public hospital / CHC clinics
//
// See scripts/process-otp.mjs for the data pipeline.

import RAW from "../data/otp.json";

export const OTP_LHDS = RAW.lhds;
export const OTP_SOURCES = RAW.sources;
export const OTP_ALL = RAW.sites;

export const OTP_PHARMACIES = OTP_ALL.filter((s) => s.t === "pharmacy");
export const OTP_CLINICS = OTP_ALL.filter((s) => s.t === "public-clinic");

// Postcode → { sites, pharmacy, clinic, laib } summary for that postcode.
// `sites` is the full array of records for display; the counts are convenience
// totals so Lookup can show summary tiles without re-filtering.
export const OTP_PC = (() => {
  const idx = {};
  for (const s of OTP_ALL) {
    if (!s.p) continue;
    if (!idx[s.p]) idx[s.p] = { sites: [], pharmacy: 0, clinic: 0, laib: 0 };
    const bucket = idx[s.p];
    bucket.sites.push(s);
    if (s.t === "pharmacy") bucket.pharmacy++;
    else if (s.t === "public-clinic") bucket.clinic++;
    if (s.sv?.includes("laib")) bucket.laib++;
  }
  return idx;
})();

/** Get OTP summary for a postcode, or null if no sites in that postcode. */
export function getOTPByPostcode(pc) {
  return OTP_PC[pc] || null;
}

// LHD aggregates for tables (e.g. Gap Analysis row totals).
export function getOTPByLHD() {
  const map = Object.fromEntries(
    OTP_LHDS.map((name, i) => [i, { name, pharmacy: 0, clinic: 0, laib: 0 }]),
  );
  for (const s of OTP_ALL) {
    if (s.l < 0 || !map[s.l]) continue;
    if (s.t === "pharmacy") map[s.l].pharmacy++;
    else if (s.t === "public-clinic") map[s.l].clinic++;
    if (s.sv?.includes("laib")) map[s.l].laib++;
  }
  return Object.values(map);
}
