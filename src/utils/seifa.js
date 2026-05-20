import RAW from "../data/seifa.json";

export const SEIFA_SOURCE = RAW.source;
export const SEIFA_INDEX = RAW.d;

export const SEIFA_INDEXES = [
  { key: "irsd",  label: "IRSD",  full: "Index of Relative Socio-economic Disadvantage",
    description: "Focus on disadvantage only. Low decile = high disadvantage." },
  { key: "irsad", label: "IRSAD", full: "Index of Relative Socio-economic Advantage and Disadvantage",
    description: "Both advantage and disadvantage. Low = both low; high = both high." },
  { key: "ier",   label: "IER",   full: "Index of Economic Resources",
    description: "Income, housing costs, asset ownership. Low = scarce economic resources." },
  { key: "ieo",   label: "IEO",   full: "Index of Education and Occupation",
    description: "Educational attainment + occupational skill. Low = lower education/occupation profile." },
];

// Schema positions in the compact array
const POS = {
  irsdScore: 0, irsd: 1,
  irsadScore: 2, irsad: 3,
  ierScore: 4, ier: 5,
  ieoScore: 6, ieo: 7,
  urp: 8, caution: 9, crossState: 10,
};

/** Get the full SEIFA record for a postcode, or null. */
export function getSEIFA(pc) {
  const r = SEIFA_INDEX[pc];
  if (!r) return null;
  return {
    irsd:       r[POS.irsd],
    irsdScore:  r[POS.irsdScore],
    irsad:      r[POS.irsad],
    irsadScore: r[POS.irsadScore],
    ier:        r[POS.ier],
    ierScore:   r[POS.ierScore],
    ieo:        r[POS.ieo],
    ieoScore:   r[POS.ieoScore],
    urp:        r[POS.urp],
    caution:    r[POS.caution] === 1,
    crossState: r[POS.crossState] === 1,
  };
}

/** Return decile (1-10) for given index key, or -1 if not available */
export function getDecile(pc, indexKey) {
  const r = SEIFA_INDEX[pc];
  if (!r) return -1;
  return r[POS[indexKey]] ?? -1;
}
