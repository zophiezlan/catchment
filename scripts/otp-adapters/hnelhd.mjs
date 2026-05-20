// Adapter: Hunter New England LHD public OTP clinics (HAND-CURATED MANIFEST)
//
// Source: https://www.nsw.gov.au/departments-and-agencies/hnelhd/services/alcohol-other-drugs
// Last verified: 2026-05-21
//
// The page publishes a Pharmacotherapy Services table with two named clinics:
//   - Cessnock: 24 View Street, Cessnock NSW 2325
//   - Newcastle: 670 Hunter Street, Newcastle West (no postcode shown on page)
// We capture both with full addresses. Hand-curated rather than scraped
// because the source table is small enough that a regex parser is fragile
// compared to the maintenance cost of confirming addresses by hand.

import { manifestSites, SITE_TYPES } from "../otp-utils.mjs";

const URL = "https://www.nsw.gov.au/departments-and-agencies/hnelhd/services/alcohol-other-drugs";
const LHD = "Hunter New England LHD";

const ENTRIES = [
  {
    n: "Cessnock Pharmacotherapy Clinic",
    a: "24 View Street",
    suburb: "Cessnock",
    lhd: LHD,
  },
  {
    n: "Newcastle Pharmacotherapy Clinic",
    a: "Newcastle Community Health Centre, 670 Hunter Street",
    suburb: "Newcastle West",
    lhd: LHD,
  },
];

export default {
  id: "lhd-hnelhd",
  label: "Hunter New England LHD — Pharmacotherapy clinics",
  url: URL,
  type: SITE_TYPES.PUBLIC_CLINIC,
  manual: true,
  async run() {
    return {
      sites: manifestSites(ENTRIES),
      updated: "2026-05-21",
      fetched: new Date().toISOString().slice(0, 10),
    };
  },
};
