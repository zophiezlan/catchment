// Adapter: Nepean Blue Mountains LHD public OTP clinics (HAND-CURATED MANIFEST)
//
// Source: https://www.nsw.gov.au/departments-and-agencies/nbmlhd/services/drug-alcohol
// Last verified: 2026-05-21
//
// The "Opioid treatment" accordion lists three clinics with location names but
// not street addresses. Per-site subpages exist under /service-directory/<slug>
// that contain detailed info; could be followed in a future revision. For now
// we capture name + suburb + postcode (via postcodeBySuburb).
//
//   - Gateway Clinic, Nepean Hospital (Kingswood)
//   - Woodlands Clinic, Blue Mountains ANZAC Memorial Hospital (Katoomba)
//   - Lithgow Clinic, Lithgow Community Health Centre

import { manifestSites, SITE_TYPES } from "../otp-utils.mjs";

const URL = "https://www.nsw.gov.au/departments-and-agencies/nbmlhd/services/drug-alcohol";
const LHD = "Nepean Blue Mountains LHD";

const ENTRIES = [
  // Kingswood is ambiguous — 2340 near Tamworth vs 2747 in Penrith. Explicit
  // override avoids the suburb-lookup picking the wrong one.
  { n: "Gateway Clinic (Nepean Hospital)",        suburb: "Kingswood", postcode: 2747, lhd: LHD },
  { n: "Woodlands Clinic (Blue Mountains ANZAC)", suburb: "Katoomba",                   lhd: LHD },
  { n: "Lithgow Clinic (Lithgow CHC)",            suburb: "Lithgow",                    lhd: LHD },
];

export default {
  id: "lhd-nbmlhd",
  label: "Nepean Blue Mountains LHD — OTP public clinics",
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
