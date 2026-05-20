// Adapter: Far West LHD public OTP clinics (HAND-CURATED MANIFEST)
//
// Source: https://www.nsw.gov.au/departments-and-agencies/fwlhd/services/mental-health-drug-alcohol
// Last verified: 2026-05-21
//
// The Opioid Treatment accordion states that OTP is accessed through
// Broken Hill Hospital. The Far West Community MHDA team is split between
// Broken Hill and Dareton (55 Sturt Place) but only the Broken Hill site
// is explicitly flagged as OTP-providing — Dareton appears to be mental
// health + general AOD support.

import { manifestSites, SITE_TYPES } from "../otp-utils.mjs";

const URL = "https://www.nsw.gov.au/departments-and-agencies/fwlhd/services/mental-health-drug-alcohol";
const LHD = "Far West LHD";

const ENTRIES = [
  {
    n: "Broken Hill Hospital — Opioid Treatment Program",
    a: "Broken Hill Hospital",
    suburb: "Broken Hill",
    lhd: LHD,
  },
];

export default {
  id: "lhd-fwlhd",
  label: "Far West LHD — OTP public clinics",
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
