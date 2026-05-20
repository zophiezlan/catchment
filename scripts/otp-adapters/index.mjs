// Registry of OTP source adapters. Add new adapters here as they're built.
// Each adapter exports { id, label, url, type, run() → { sites, updated, fetched } }.

import pharmacyMap from "./nsw-health-pharmacy-map.mjs";
import islhd from "./islhd.mjs";
import mnclhd from "./mnclhd.mjs";
import seslhd from "./seslhd.mjs";
import swslhd from "./swslhd.mjs";
import cclhd from "./cclhd.mjs";
import hnelhd from "./hnelhd.mjs";
import nbmlhd from "./nbmlhd.mjs";
import nslhd from "./nslhd.mjs";
import wslhd from "./wslhd.mjs";
import fwlhd from "./fwlhd.mjs";
import slhd from "./slhd.mjs";

export const ADAPTERS = [
  pharmacyMap,
  // Easy-tier LHD adapters (scraped from live HTML)
  islhd,
  mnclhd,
  seslhd,
  swslhd,
  // Mixed-tier LHD adapters (hand-curated manifests — see each file header for provenance)
  cclhd,
  hnelhd,
  nbmlhd,
  nslhd,
  wslhd,
  fwlhd,
  slhd,
];
