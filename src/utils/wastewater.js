import RAW from "../data/wastewater.json";

export const WW_SOURCE = RAW.source;
export const WW_YEARS = RAW.years;
export const WW_YEAR_LABELS = RAW.yearLabels;
export const WW_NSW = RAW.nsw;
export const WW_NATIONAL = RAW.national;
export const WW_SITE_HIGHLIGHTS = RAW.siteHighlights;

export const WW_DRUGS = ["methylamphetamine", "cocaine", "mdma", "heroin"];

export const WW_DRUG_LABELS = {
  methylamphetamine: "Methylamphetamine",
  cocaine: "Cocaine",
  mdma: "MDMA",
  heroin: "Heroin",
};

// Colours align with the existing harm-reduction palette: heroin red (NSP-relevant),
// meth orange (stimulant burden), cocaine blue (capital-city signal), MDMA purple (party).
export const WW_DRUG_COLORS = {
  methylamphetamine: "#d97706",
  cocaine: "#3b82f6",
  mdma: "#7c3aed",
  heroin: "#dc2626",
};

/** Build a recharts-ready [{year, methylamphetamine, cocaine, mdma, heroin}, ...] series. */
export function buildTrendSeries() {
  return WW_YEARS.map((y, i) => ({
    year: y,
    yearLabel: WW_YEAR_LABELS[i],
    methylamphetamine: WW_NSW.methylamphetamine.annualKg[i],
    cocaine: WW_NSW.cocaine.annualKg[i],
    mdma: WW_NSW.mdma.annualKg[i],
    heroin: WW_NSW.heroin.annualKg[i],
  }));
}

/** Drug-by-drug NSW Y9 summary with deltas for headline cards. */
export function getNswSummary() {
  return WW_DRUGS.map((drug) => {
    const d = WW_NSW[drug];
    return {
      drug,
      label: WW_DRUG_LABELS[drug],
      color: WW_DRUG_COLORS[drug],
      y9Kg: d.annualKg[d.annualKg.length - 1],
      y8Kg: d.annualKg[d.annualKg.length - 2],
      pctChange: d.pctChangeYoY,
      nationalShare: d.nationalShareY9,
      notes: d.notes,
    };
  });
}
