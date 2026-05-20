// Adapter: South Eastern Sydney LHD public OTP clinics
// Source: https://www.seslhd.health.nsw.gov.au/services-clinics/directory/drug-and-alcohol-services
//
// Pattern:
//   <h4>CLINIC NAME</h4>
//   <p><strong>Address:</strong> STREET, SUBURB NSW POSTCODE [(building ref ...)]</p>
//   <p><strong>Phone:</strong> ...</p>
//   <p><strong>Fax:</strong> ...</p>
//   <h4>NEXT CLINIC</h4>
//
// Three clinics: The Langton Centre, St George Hospital D&A Service,
// The Sutherland Hospital D&A Service.

import {
  decodeEntities,
  fetchHtml,
  SITE_TYPES,
} from "../otp-utils.mjs";

const URL =
  "https://www.seslhd.health.nsw.gov.au/services-clinics/directory/drug-and-alcohol-services";
const LHD = "South Eastern Sydney LHD";

// Capture h4 (clinic name) followed by the nearest <p><strong>Address:</strong>...</p>.
// Address paragraph may contain inline <a> links (e.g. campus map references)
// so we capture across tags and strip them before parsing.
const CLINIC_RE =
  /<h4>([^<]+)<\/h4>\s*<p>\s*<strong>Address:<\/strong>\s*([\s\S]+?)<\/p>/gi;

function splitAddress(raw) {
  // Strip any inline HTML tags (campus map links), then trailing parentheticals.
  const noTags = raw.replace(/<[^>]+>/g, "");
  const cleaned = noTags.replace(/\s*\([^)]*\)\s*$/, "").trim();
  const m = cleaned.match(/^(.+?),\s*([A-Za-z][A-Za-z\s'-]+?)\s+NSW\s+(\d{4})\s*$/);
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
    const name = decodeEntities(m[1]);
    const addr = splitAddress(m[2]);
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
  id: "lhd-seslhd",
  label: "South Eastern Sydney LHD — D&A clinics",
  url: URL,
  type: SITE_TYPES.PUBLIC_CLINIC,
  async run() {
    const html = await fetchHtml(URL, "SESLHD");
    const sites = parseClinics(html);
    return { sites, updated: null, fetched: new Date().toISOString().slice(0, 10) };
  },
};
