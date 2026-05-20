// Orchestrator: run all OTP adapters, geocode, intern, write src/data/otp.json.
//
//   node scripts/process-otp.mjs
//
// Output schema (src/data/otp.json):
// {
//   lhds:    ["Central Coast LHD", ...],          // canonical LHD names
//   sources: [{id, label, url, updated, fetched}],
//   sites:   [{n, a, s, p, lat, lon, l, t, sv, src}]
//       n=name a=address s=suburb p=postcode l=lhd-index
//       t=type (pharmacy|public-clinic|private-clinic)
//       sv=services (subset of "otp","laib")
//       src=index into sources[]
// }

import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

import { ADAPTERS } from "./otp-adapters/index.mjs";
import { LHD_CANONICAL, geocodeByPostcode, lhdByPostcode } from "./otp-utils.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, "..");
const OUT = resolve(ROOT, "src/data/otp.json");

const lhdIdx = new Map(LHD_CANONICAL.map((l, i) => [l, i]));

const sources = [];
const allSites = [];
const counts = {};

for (const adapter of ADAPTERS) {
  process.stdout.write(`→ ${adapter.id} ... `);
  try {
    const { sites, updated, fetched } = await adapter.run();
    const srcIdx = sources.length;
    sources.push({
      id: adapter.id,
      label: adapter.label,
      url: adapter.url,
      updated: updated || null,
      fetched: fetched || null,
    });
    counts[adapter.id] = { fetched: sites.length, kept: 0, dropped: 0, lhdDerived: 0 };
    for (const s of sites) {
      const geo = geocodeByPostcode(s.p);
      if (!geo) {
        counts[adapter.id].dropped += 1;
        continue;
      }
      // Source-cell LHD when usable, else derive from postcode (source has
      // data-entry errors — e.g. some rows put suburb in the LHD column).
      let canonLhd = s.lhd;
      if (!canonLhd || !lhdIdx.has(canonLhd)) {
        canonLhd = lhdByPostcode(s.p);
        if (canonLhd) counts[adapter.id].lhdDerived += 1;
      }
      const l = canonLhd && lhdIdx.has(canonLhd) ? lhdIdx.get(canonLhd) : -1;
      allSites.push({
        n: s.n,
        a: s.a,
        s: s.s,
        p: s.p,
        lat: geo.lat,
        lon: geo.lon,
        l,
        t: s.t,
        sv: s.sv,
        src: srcIdx,
      });
      counts[adapter.id].kept += 1;
    }
    const c = counts[adapter.id];
    console.log(`${sites.length} sites (kept ${c.kept}, dropped ${c.dropped}, LHD derived from postcode for ${c.lhdDerived})`);
  } catch (err) {
    console.log(`FAILED: ${err.message}`);
    counts[adapter.id] = { error: err.message };
  }
}

// Sort: by LHD index, then suburb, then name (stable display order)
allSites.sort((a, b) => {
  if (a.l !== b.l) return a.l - b.l;
  if (a.s !== b.s) return a.s.localeCompare(b.s);
  return a.n.localeCompare(b.n);
});

const output = {
  lhds: LHD_CANONICAL,
  sources,
  sites: allSites,
};

writeFileSync(OUT, JSON.stringify(output));

// Summary
console.log("");
console.log(`✓ otp.json written: ${allSites.length} sites total`);
const byType = {};
const byLhd = {};
const byService = { otp: 0, laib: 0 };
const noLhd = allSites.filter((s) => s.l === -1).length;
for (const s of allSites) {
  byType[s.t] = (byType[s.t] || 0) + 1;
  if (s.l >= 0) byLhd[LHD_CANONICAL[s.l]] = (byLhd[LHD_CANONICAL[s.l]] || 0) + 1;
  for (const sv of s.sv) byService[sv] = (byService[sv] || 0) + 1;
}
console.log(`  By type:     ${JSON.stringify(byType)}`);
console.log(`  By service:  ${JSON.stringify(byService)}`);
console.log(`  Unmapped LHD: ${noLhd}`);
console.log(`  By LHD:`);
for (const lhd of LHD_CANONICAL) {
  console.log(`    ${lhd.padEnd(28)} ${byLhd[lhd] || 0}`);
}
