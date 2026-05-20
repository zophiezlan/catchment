// Adapter: Central Coast LHD public OTP clinics (HAND-CURATED MANIFEST)
//
// Source: https://www.cclhd.health.nsw.gov.au/services/drugs-and-alcohol/
// Last verified: 2026-05-21
//
// The page names the two OTP clinics (Kullaroo at Gosford and Wallama at
// Wyong) but does not publish street addresses inline. Cross-referenced
// against the NSW Health service directory.
//
// If the source page restructures, re-verify the clinic names against the
// URL above and update accordingly.

import { manifestSites, SITE_TYPES } from "../otp-utils.mjs";

const URL = "https://www.cclhd.health.nsw.gov.au/services/drugs-and-alcohol/";
const LHD = "Central Coast LHD";

const ENTRIES = [
  { n: "Kullaroo Clinic", suburb: "Gosford", lhd: LHD },
  { n: "Wallama Clinic", suburb: "Wyong", lhd: LHD },
];

export default {
  id: "lhd-cclhd",
  label: "Central Coast LHD — OTP public clinics",
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
