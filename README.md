# Catchment

A postcode lookup and analysis dashboard for harm reduction service planning. Built on 2,957 Australian postcodes enriched with health geography and equity data.

## Data sources

- **AusPost PC001** (Feb 2026) — postcode to place mapping, delivery types
- **MMM 2023** (DoH) — Modified Monash Model remoteness classification
- **PHN 2017 boundaries** via POA 2021 concordance (DoH) — Primary Health Network mapping
- **Census/SEIFA 2021** (ABS) — population, Indigenous %, IRSD disadvantage index
- **NSW LHD mapping** — Local Health District for NSW postcodes

## Views

- **Overview** — national distribution across zones, remoteness, states, IRSD deciles
- **Lookup** — single postcode search with full detail card
- **Cohort Analyser** — paste a list of postcodes, get aggregate equity and geography profile
- **Explorer** — filter by state, zone, RA, PHN, IRSD range; paginated table
- **NSW LHDs** — Local Health District breakdown for NSW postcodes

## Setup

```bash
npm install
npm run dev
```

Opens at http://localhost:5173

## Build for deployment

```bash
npm run build
```

Static files output to `dist/`. Can be deployed to any static host (Netlify, Vercel, GitHub Pages, etc).

## Project structure

```text
src/
  data/postcodes.json    — 124KB compact dataset (all 2,957 postcodes)
  utils/data.js          — constants, decode function, indexes
  components/
    Shared.jsx           — reusable UI components (Pill, MetricCard, charts)
    Overview.jsx         — national overview tab
    Lookup.jsx           — single postcode search tab
    CohortAnalyser.jsx   — batch postcode analysis tab
    CohortCompare.jsx    — cohort comparison sub-component
    Explorer.jsx         — filter + browse tab
    LHDView.jsx          — NSW Local Health District tab
  App.jsx                — tab navigation shell
  main.jsx               — React entry point
  index.css              — design tokens, global styles
```

## Extending

The data file (`src/data/postcodes.json`) is a compact array format. Each record:

```text
[postcode, state_idx, place, mmm, ra, phn_idx, lhd_idx, erp, indigenous_pct, irsd_decile]
```

Lookup tables for state names, PHN codes/names, and LHD names are at the top level of the JSON. See `src/utils/data.js` for the decode function.

To add new fields: extend the record array in the JSON, update the `decode()` function, and add UI in the relevant component.

## Data refresh

The master dataset lives in `shopify_postcode_shipping_tools_2026_v2.3.xlsx`. To regenerate the JSON from a new version of that workbook, extract columns using openpyxl with the same compact format. See the Data_Sourcing_Guide sheet in the workbook for external data update instructions.
