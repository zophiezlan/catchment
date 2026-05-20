// Adapter: Western Sydney LHD public OTP clinics (HAND-CURATED MANIFEST)
//
// Source: https://www.nsw.gov.au/departments-and-agencies/wslhd/services/drug-alcohol
// Last verified: 2026-05-21
//
// The page lists four contactable services by name + phone but no addresses.
// Locations confirmed via NSW Health service directory and healthdirect.
//   - Blacktown Methadone Clinic (Blacktown 2148)
//   - Cumberland Centre for Addiction Medicine (Cumberland Hospital, Westmead 2145)
//   - Fleet Street Opioid Treatment Unit (North Parramatta 2151)
//   - Mount Druitt Centre for Addiction Medicine (Mount Druitt 2770)

import { manifestSites, SITE_TYPES } from "../otp-utils.mjs";

const URL = "https://www.nsw.gov.au/departments-and-agencies/wslhd/services/drug-alcohol";
const LHD = "Western Sydney LHD";

const ENTRIES = [
  { n: "Blacktown Methadone Clinic",            suburb: "Blacktown",       lhd: LHD },
  { n: "Cumberland Centre for Addiction Medicine", suburb: "Westmead",     lhd: LHD },
  { n: "Fleet Street Opioid Treatment Unit",    suburb: "North Parramatta", lhd: LHD },
  { n: "Mount Druitt Centre for Addiction Medicine", suburb: "Mount Druitt", lhd: LHD },
];

export default {
  id: "lhd-wslhd",
  label: "Western Sydney LHD — OTP public clinics",
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
