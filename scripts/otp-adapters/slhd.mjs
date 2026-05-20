// Adapter: Sydney LHD public OTP clinics (HAND-CURATED MANIFEST)
//
// Source: https://slhd.health.nsw.gov.au/drug-health/services
// Last verified: 2026-05-21
//
// The page states OTP clinics operate at Royal Prince Alfred and Canterbury
// Hospitals. No street addresses inline. Hospital postcodes are well-known:
//   - RPA Hospital, Camperdown 2050
//   - Canterbury Hospital, Campsie 2194

import { manifestSites, SITE_TYPES } from "../otp-utils.mjs";

const URL = "https://slhd.health.nsw.gov.au/drug-health/services";
const LHD = "Sydney LHD";

const ENTRIES = [
  {
    n: "RPA Hospital — Opioid Treatment Program",
    a: "Royal Prince Alfred Hospital",
    suburb: "Camperdown",
    lhd: LHD,
  },
  {
    n: "Canterbury Hospital — Opioid Treatment Program",
    a: "Canterbury Hospital",
    suburb: "Campsie",
    lhd: LHD,
  },
];

export default {
  id: "lhd-slhd",
  label: "Sydney LHD — OTP public clinics",
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
