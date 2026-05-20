// Adapter: Illawarra Shoalhaven LHD public OTP clinics
// Source: https://www.islhd.health.nsw.gov.au/services-clinics/opioid-treatment-programs
//
// Page contains a schema.org block:
//   <span itemprop="streetAddress">
//     Bungora<br />
//     2 Urunga Pde<br />
//     Wollongong NSW 2500<br />
//     <br />
//     LAMP (Lawrence Ave Methadone Program)<br />
//     5-7 Lawrence Ave<br />
//     Nowra<br />            ← no postcode/state
//     <br />
//   </span>
//
// We parse the streetAddress block: split clinics on blank lines, then each
// clinic into [name, street, "suburb [NSW pc]"] lines. Missing postcodes are
// recovered via postcodeBySuburb.

import {
  decodeEntities,
  postcodeBySuburb,
  stripStateTail,
  fetchHtml,
  SITE_TYPES,
} from "../otp-utils.mjs";

const URL = "https://www.islhd.health.nsw.gov.au/services-clinics/opioid-treatment-programs";
const LHD = "Illawarra Shoalhaven LHD";

const ADDR_BLOCK_RE = /<span\s+itemprop=["']streetAddress["'][^>]*>([\s\S]*?)<\/span>/i;

function parseAddressBlock(html) {
  // Strip source whitespace (\r\n inside the HTML) first — only <br /> tags
  // should produce line breaks. Otherwise each content line gets a phantom
  // trailing newline that confuses block-grouping.
  const lines = html
    .replace(/[\r\n]+/g, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .split("\n")
    .map((l) => decodeEntities(l))
    .map((l) => l.trim());

  // Group into clinic blocks separated by blank lines.
  const blocks = [];
  let cur = [];
  for (const l of lines) {
    if (!l) {
      if (cur.length) blocks.push(cur);
      cur = [];
    } else {
      cur.push(l);
    }
  }
  if (cur.length) blocks.push(cur);
  return blocks;
}

function parseClinic(block) {
  if (block.length < 3) return null;
  const name = block[0];
  const address = block[1];

  // Last line is "Suburb [NSW Postcode]" — sometimes both, sometimes suburb only.
  const tail = block[block.length - 1];
  const m = tail.match(/^(.+?)\s+(NSW|VIC|QLD|ACT|SA|TAS|WA|NT)\s+(\d{4})$/i);
  let suburb;
  let postcode;
  if (m) {
    suburb = m[1].trim();
    postcode = parseInt(m[3], 10);
  } else {
    suburb = stripStateTail(tail);
    postcode = postcodeBySuburb(suburb);
  }
  if (!suburb || !postcode) return null;

  return {
    n: name,
    a: address,
    s: suburb,
    p: postcode,
    lhd: LHD,
    t: SITE_TYPES.PUBLIC_CLINIC,
    sv: ["otp"],
  };
}

export default {
  id: "lhd-islhd",
  label: "Illawarra Shoalhaven LHD — OTP public clinics",
  url: URL,
  type: SITE_TYPES.PUBLIC_CLINIC,
  async run() {
    const html = await fetchHtml(URL, "ISLHD");
    const m = html.match(ADDR_BLOCK_RE);
    if (!m) {
      throw new Error("ISLHD page: streetAddress block not found — markup may have changed");
    }
    const blocks = parseAddressBlock(m[1]);
    const sites = blocks.map(parseClinic).filter(Boolean);
    return {
      sites,
      updated: null, // ISLHD page has no visible last-updated marker
      fetched: new Date().toISOString().slice(0, 10),
    };
  },
};
