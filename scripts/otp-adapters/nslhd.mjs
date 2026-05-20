// Adapter: Northern Sydney LHD public OTP clinics (HAND-CURATED MANIFEST)
//
// Source: https://www.nslhd.health.nsw.gov.au/Services/Pages/drug-and-alcohol-RNS.aspx
// Last verified: 2026-05-21
//
// The page profiles the Royal North Shore Hospital D&A service with full
// address. A second site (Brookvale CHC) is mentioned in the inventory but
// lives on a different URL. If a Brookvale clinic page is found later,
// extend this manifest.

import { manifestSites, SITE_TYPES } from "../otp-utils.mjs";

const URL = "https://www.nslhd.health.nsw.gov.au/Services/Pages/drug-and-alcohol-RNS.aspx";
const LHD = "Northern Sydney LHD";

const ENTRIES = [
  {
    n: "Drug and Alcohol Service — Royal North Shore Hospital",
    a: "Royal North Shore Community Health Centre, 2C Herbert Street",
    suburb: "St Leonards",
    lhd: LHD,
  },
];

export default {
  id: "lhd-nslhd",
  label: "Northern Sydney LHD — OTP public clinics",
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
