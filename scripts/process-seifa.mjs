// Build src/data/seifa.json from the ABS SEIFA 2021 Postal Area data cube.
//
// Source: https://www.abs.gov.au/statistics/people/people-and-communities/
//         socio-economic-indexes-areas-seifa-australia/2021/Index-data-cubes-all.zip
// Local: NSW data sources.local/Postal Area, Indexes, SEIFA 2021.xlsx
//
// Sheet "Table 1" layout (header rows 4-5):
//   A: POA code
//   B/C: IRSD score / decile
//   D/E: IRSAD score / decile
//   F/G: IER score / decile
//   H/I: IEO score / decile
//   J: Usual Resident Population
//   K: "use with caution" flag (non-empty when set)
//   L: cross-state flag (non-empty when set)
//
// Output schema (small JSON keyed by postcode):
//   {
//     source: { ... },
//     d: { "<pc>": [irsdScore, irsd, irsadScore, irsad, ierScore, ier, ieoScore, ieo, urp, caution, crossState] }
//   }
// Scores are rounded to int; deciles are 1-10 (-1 if missing). Flags are 0/1.

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, "..");
const SRC = resolve(ROOT, "NSW data sources.local/Postal Area, Indexes, SEIFA 2021.xlsx");
const OUT = resolve(ROOT, "src/data/seifa.json");

const wb = XLSX.readFile(SRC);
const sheet = wb.Sheets["Table 1"];
if (!sheet) throw new Error("Table 1 not found in SEIFA workbook");

const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
// data starts at row 6 (zero-indexed)
const dataRows = rows.slice(6).filter(r => r && r[0] != null);

const dict = {};
let skipped = 0;
for (const r of dataRows) {
  const pcStr = String(r[0]).trim();
  if (!/^\d{3,4}$/.test(pcStr)) { skipped++; continue; }
  const pc = parseInt(pcStr, 10);

  const irsdScore  = r[1] == null ? null : Math.round(r[1]);
  const irsd       = r[2] == null ? -1 : Number(r[2]);
  const irsadScore = r[3] == null ? null : Math.round(r[3]);
  const irsad      = r[4] == null ? -1 : Number(r[4]);
  const ierScore   = r[5] == null ? null : Math.round(r[5]);
  const ier        = r[6] == null ? -1 : Number(r[6]);
  const ieoScore   = r[7] == null ? null : Math.round(r[7]);
  const ieo        = r[8] == null ? -1 : Number(r[8]);
  const urp        = r[9] == null ? 0 : Number(r[9]);
  const caution    = r[10] ? 1 : 0;
  const crossState = r[11] ? 1 : 0;

  dict[pc] = [
    irsdScore,  irsd,
    irsadScore, irsad,
    ierScore,   ier,
    ieoScore,   ieo,
    urp, caution, crossState,
  ];
}

const out = {
  source: {
    name: "Socio-Economic Indexes for Areas (SEIFA), 2021",
    issuer: "Australian Bureau of Statistics",
    release: "2023-04-27",
    geography: "Postal Area (POA), 2021",
    url: "https://www.abs.gov.au/statistics/people/people-and-communities/socio-economic-indexes-areas-seifa-australia/latest-release",
    indexes: {
      irsd:  "Index of Relative Socio-economic Disadvantage",
      irsad: "Index of Relative Socio-economic Advantage and Disadvantage",
      ier:   "Index of Economic Resources",
      ieo:   "Index of Education and Occupation",
    },
    schema: "[irsdScore, irsd, irsadScore, irsad, ierScore, ier, ieoScore, ieo, urp, caution, crossState]",
    deciles: "1 = most disadvantaged / lowest score; 10 = most advantaged / highest score. -1 = no data.",
  },
  d: dict,
};

writeFileSync(OUT, JSON.stringify(out));

const count = Object.keys(dict).length;
const withCaution = Object.values(dict).filter(v => v[9] === 1).length;
const crossing = Object.values(dict).filter(v => v[10] === 1).length;
console.log(`✓ seifa.json written: ${count} postal areas (skipped ${skipped} non-numeric rows)`);
console.log(`  Use with caution: ${withCaution}`);
console.log(`  Crosses state boundary: ${crossing}`);
console.log(`  File size: ${(JSON.stringify(out).length / 1024).toFixed(1)} KB`);
