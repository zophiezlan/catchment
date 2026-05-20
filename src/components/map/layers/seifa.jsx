import L from "leaflet";

// Decile colour ramp: red (most disadvantaged) → green (least). 10 stops.
const RAMP = [
  "#7f1d1d", "#b91c1c", "#dc2626", "#ef4444", "#f97316",
  "#eab308", "#84cc16", "#22c55e", "#16a34a", "#15803d",
];

const INDEX_OPTIONS = [
  { key: "irsd",  label: "IRSD"  },
  { key: "irsad", label: "IRSAD" },
  { key: "ier",   label: "IER"   },
  { key: "ieo",   label: "IEO"   },
];

function IndexPicker({ options, setOptions }) {
  const value = options?.index || "irsd";
  return (
    <select
      value={value}
      onChange={(e) => setOptions({ ...options, index: e.target.value })}
      style={{
        padding: "3px 6px",
        fontSize: 11,
        fontFamily: "var(--font-body)",
        border: "1px solid var(--c-border)",
        borderRadius: "var(--radius-xs)",
        background: "var(--c-surface)",
        color: "var(--c-text2)",
        cursor: "pointer",
      }}
    >
      {INDEX_OPTIONS.map((o) => (
        <option key={o.key} value={o.key}>{o.label}</option>
      ))}
    </select>
  );
}

const INDEX_LABELS = {
  irsd:  "IRSD (disadvantage)",
  irsad: "IRSAD (adv./disadv.)",
  ier:   "IER (economic resources)",
  ieo:   "IEO (education/occupation)",
};

export const seifaLayer = {
  id: "seifa",
  label: "SEIFA decile",
  group: "Demographics",
  defaultOn: false,
  swatch: RAMP[3],
  defaultOptions: { index: "irsd" },
  Controls: IndexPicker,
  load: () =>
    Promise.all([
      import("../../../utils/seifa"),
      import("../../../data/postcode-centroids.json"),
    ]).then(([seifaMod, centroidsMod]) => ({
      getSEIFA: seifaMod.getSEIFA,
      centroids: centroidsMod.default,
    })),
  render: (_map, { getSEIFA, centroids }, options) => {
    const index = options?.index || "irsd";
    const lg = L.layerGroup();
    for (const pc of Object.keys(centroids)) {
      const c = centroids[pc];
      if (!c) continue;
      const s = getSEIFA(Number(pc));
      if (!s) continue;
      const decile = s[index];
      if (!decile || decile < 1) continue;
      const color = RAMP[decile - 1];
      L.circleMarker([c[0], c[1]], {
        radius: 4,
        color: "white",
        fillColor: color,
        fillOpacity: 0.75,
        weight: 0.5,
      })
        .bindPopup(
          `<div style="font-family:system-ui;font-size:12px;min-width:160px;line-height:1.5">
            <strong style="font-size:13px;display:block;margin-bottom:2px">Postcode ${pc}</strong>
            <div style="color:var(--c-text2);font-size:11px;margin-bottom:4px">${INDEX_LABELS[index]}</div>
            <div style="display:flex;align-items:center;gap:6px">
              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color}"></span>
              <span style="font-weight:600">Decile ${decile}</span>
              <span style="color:var(--c-text3);font-size:10px">/ 10</span>
            </div>
            ${s.urp ? `<div style="font-size:10px;color:var(--c-text3);margin-top:4px">Pop: ${s.urp.toLocaleString()}</div>` : ""}
          </div>`,
          { maxWidth: 240 },
        )
        .addTo(lg);
    }
    return lg;
  },
  getLegend: (options) => {
    const index = options?.index || "irsd";
    const label = INDEX_LABELS[index] || "SEIFA";
    return [
      { color: RAMP[0], label: `1 — most disadv. (${label.split(" ")[0]})` },
      { color: RAMP[4], label: "5" },
      { color: RAMP[9], label: "10 — least" },
    ];
  },
};
