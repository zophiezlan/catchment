import L from "leaflet";

const COLOR = "#475569";

export const lhdLayer = {
  id: "lhd",
  label: "LHD boundaries",
  group: "Boundaries",
  defaultOn: false,
  swatch: COLOR,
  swatchShape: "square",
  load: () => import("../../../data/lhd-geo.json").then((m) => m.default),
  render: (_map, geo) =>
    L.geoJSON(geo, {
      style: { color: COLOR, weight: 1.5, opacity: 0.55, fill: false },
    }),
  getLegend: () => [{ color: COLOR, label: "LHD boundary", shape: "line", opacity: 0.55 }],
};
