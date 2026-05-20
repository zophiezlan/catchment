// Adapter: South Western Sydney LHD public Drug Health clinics
// Source: https://www.swslhd.health.nsw.gov.au/drughealth/DHS_sites.html
//
// Pattern:
//   <p><strong>CLINIC NAME</strong><br />
//   Address: STREET, SUBURB [NSW] POSTCODE<br />
//   ... more lines ...
//   </p>
//
// IMPORTANT: the page lists Drug Health Services generally — not all are
// explicit OTP dosing sites. Per inventory note, SWSLHD doesn't disambiguate
// on this page. We import all 5 with sv=["otp"] but tag the source label
// as "Drug Health Services" so downstream code can show uncertainty.

import {
  decodeEntities,
  fetchHtml,
  SITE_TYPES,
} from "../otp-utils.mjs";

const URL = "https://www.swslhd.health.nsw.gov.au/drughealth/DHS_sites.html";
const LHD = "South Western Sydney LHD";

// Match the <strong>name</strong><br />Address: ... pattern. The trailing
// address line ends with a postcode (with or without "NSW" preceding it).
const CLINIC_RE =
  /<strong>([^<]+?)<\/strong>\s*<br\s*\/?>\s*Address:\s*([^<]+?)<br\s*\/?>/gi;

function splitAddress(raw) {
  const cleaned = raw.replace(/\s+/g, " ").trim();
  const m = cleaned.match(/^(.+?),\s*([A-Za-z][A-Za-z\s'-]+?)\s+(?:NSW\s+)?(\d{4})\s*$/);
  if (!m) return null;
  return {
    street: m[1].trim(),
    suburb: m[2].trim(),
    postcode: parseInt(m[3], 10),
  };
}

function parseClinics(html) {
  const sites = [];
  CLINIC_RE.lastIndex = 0;
  let m;
  while ((m = CLINIC_RE.exec(html)) !== null) {
    const name = decodeEntities(m[1]).replace(/\s+/g, " ").trim();
    const addr = splitAddress(decodeEntities(m[2]));
    if (!name || !addr) continue;
    sites.push({
      n: name,
      a: addr.street,
      s: addr.suburb,
      p: addr.postcode,
      lhd: LHD,
      t: SITE_TYPES.PUBLIC_CLINIC,
      sv: ["otp"],
    });
  }
  return sites;
}

export default {
  id: "lhd-swslhd",
  label: "South Western Sydney LHD — Drug Health Services",
  url: URL,
  type: SITE_TYPES.PUBLIC_CLINIC,
  async run() {
    const html = await fetchHtml(URL, "SWSLHD");
    const sites = parseClinics(html);
    return { sites, updated: null, fetched: new Date().toISOString().slice(0, 10) };
  },
};
