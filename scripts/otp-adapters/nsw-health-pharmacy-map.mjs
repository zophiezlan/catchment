// Adapter: NSW Health OTP community pharmacy map
// Source: https://www.health.nsw.gov.au/aod/Pages/opiod-treatment-map.aspx
//
// Single page with one <table id="pharmacy-trial"> containing ~800 NSW
// community pharmacies that dispense OTP and/or long-acting injectable
// buprenorphine. Page is server-rendered HTML; columns are stable:
//   1. Pharmacy name
//   2. Address (street only)
//   3. Suburb
//   4. Postcode
//   5. Local Health District
//   6. Service ("Opioid Treatment Program" and/or "Long-acting Injectable Buprenorphine")
//
// The page also carries a "Current as at: DAY DD MONTH YYYY" line that we
// capture for source attribution.

import {
  decodeEntities,
  canonicaliseLhd,
  normaliseServices,
  fetchHtml,
  SITE_TYPES,
} from "../otp-utils.mjs";

const URL = "https://www.health.nsw.gov.au/aod/Pages/opiod-treatment-map.aspx";

const TABLE_RE = /<table[^>]+id=["']pharmacy-trial["'][^>]*>([\s\S]*?)<\/table>/i;
const ROW_RE = /<tr>\s*((?:<td>[\s\S]*?<\/td>\s*){6})<\/tr>/gi;
const CELL_RE = /<td>([\s\S]*?)<\/td>/gi;
const UPDATED_RE = /Current as at:\s*([A-Za-z]+\s+\d{1,2}\s+[A-Za-z]+\s+\d{4})/i;

const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

function parseUpdated(html) {
  const m = html.match(UPDATED_RE);
  if (!m) return null;
  // Format: "Wednesday 6 May 2026" — parse components directly to avoid TZ drift.
  const parts = m[1].match(/[A-Za-z]+\s+(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (!parts) return m[1];
  const day = parseInt(parts[1], 10);
  const month = MONTHS[parts[2].toLowerCase()];
  const year = parseInt(parts[3], 10);
  if (!month) return m[1];
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseRow(rowHtml) {
  const cells = [];
  CELL_RE.lastIndex = 0;
  let cm;
  while ((cm = CELL_RE.exec(rowHtml)) !== null) cells.push(decodeEntities(cm[1]));
  if (cells.length !== 6) return null;
  const [name, address, suburb, postcode, lhdRaw, service] = cells;
  if (!name || !suburb || !postcode) return null;
  const pc = parseInt(postcode, 10);
  if (!Number.isFinite(pc) || pc < 1000 || pc > 9999) return null;
  const lhd = canonicaliseLhd(lhdRaw);
  const services = normaliseServices(service);
  if (services.length === 0) return null;
  return {
    n: name,
    a: address,
    s: suburb,
    p: pc,
    lhd, // canonical name; orchestrator interns to index
    t: SITE_TYPES.PHARMACY,
    sv: services,
  };
}

export default {
  id: "nsw-health-pharmacy-map",
  label: "NSW Health OTP community pharmacy map",
  url: URL,
  type: SITE_TYPES.PHARMACY,
  async run() {
    const html = await fetchHtml(URL, "NSW Health pharmacy map");
    const tableM = html.match(TABLE_RE);
    if (!tableM) {
      throw new Error("Could not find <table id='pharmacy-trial'> in page — markup may have changed");
    }
    const tableHtml = tableM[1];
    const sites = [];
    let m;
    ROW_RE.lastIndex = 0;
    while ((m = ROW_RE.exec(tableHtml)) !== null) {
      const site = parseRow(m[1]);
      if (site) sites.push(site);
    }
    return {
      sites,
      updated: parseUpdated(html),
      fetched: new Date().toISOString().slice(0, 10),
    };
  },
};
