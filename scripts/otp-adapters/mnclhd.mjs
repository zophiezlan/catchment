// Adapter: Mid North Coast LHD public OTP clinics
// Source: https://mnclhd.health.nsw.gov.au/alcohol-and-other-drugs/
//
// Accordion layout: each location has a <button aria-controls="X"> + a matching
// <div id="X"> containing:
//   <p><a href="HOSPITAL_PAGE">CLINIC NAME</a><br />
//   STREET ADDRESS<br />
//   SUBURB NSW POSTCODE<br />
//   ...</p>
//
// Three clinics: Coffs Harbour Health Campus, Kempsey District Hospital,
// Port Macquarie Community Health.

import {
  decodeEntities,
  fetchHtml,
  SITE_TYPES,
} from "../otp-utils.mjs";

const URL = "https://mnclhd.health.nsw.gov.au/alcohol-and-other-drugs/";
const LHD = "Mid North Coast LHD";

// <a>NAME</a><br />STREET<br />SUBURB NSW POSTCODE
const CLINIC_RE =
  /<a\s[^>]*>([^<]+)<\/a>\s*<br\s*\/?>\s*([^<\n]+?)\s*<br\s*\/?>\s*([A-Za-z][A-Za-z\s'-]+?)\s+NSW\s+(\d{4})/gi;

function parseClinics(html) {
  const sites = [];
  CLINIC_RE.lastIndex = 0;
  let m;
  while ((m = CLINIC_RE.exec(html)) !== null) {
    const name = decodeEntities(m[1]);
    const street = decodeEntities(m[2]).trim();
    const suburb = decodeEntities(m[3]).trim();
    const pc = parseInt(m[4], 10);
    if (!name || !suburb || !Number.isFinite(pc)) continue;
    sites.push({
      n: name,
      a: street,
      s: suburb,
      p: pc,
      lhd: LHD,
      t: SITE_TYPES.PUBLIC_CLINIC,
      sv: ["otp"],
    });
  }
  return sites;
}

export default {
  id: "lhd-mnclhd",
  label: "Mid North Coast LHD — OTP public clinics",
  url: URL,
  type: SITE_TYPES.PUBLIC_CLINIC,
  async run() {
    const html = await fetchHtml(URL, "MNCLHD");
    const sites = parseClinics(html);
    return { sites, updated: null, fetched: new Date().toISOString().slice(0, 10) };
  },
};
