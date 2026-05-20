import L from "leaflet";

const TYPE = {
  primary:   { label: "Primary NSP",   color: "#059669", radius: 8, fillOpacity: 0.9,  weight: 2 },
  secondary: { label: "Secondary NSP", color: "#3b82f6", radius: 5, fillOpacity: 0.75, weight: 1 },
  pharmacy:  { label: "Pharmacy",      color: "#d97706", radius: 5, fillOpacity: 0.75, weight: 1 },
};

const FAC_NORM = {
  "staff and information available - advice/referral": "Staffed",
  "staff & information": "Staffed",
  "disposal bin": "Disposal bin",
  "coin operated machine": "Coin machine",
  "free machine": "Free machine",
  "free dispensing machine": "Free machine",
  "free dispensing chutes and machine": "Free chutes & machine",
  "free dispensing chute": "Free chute",
  "internal dispensing chute": "Internal chute",
  "internal dispensing": "Internal chute",
  "external dispensing chutes": "External chute",
  "external dispensing chute": "External chute",
  "outreach": "Outreach",
  "supplies bulk": "Bulk supplies",
  "extended range of equipment": "Extended range",
  "free 24 hr chutes": "24h chutes",
  "vending machine": "Vending machine",
  "vending machine & disposal bin": "Vending + disposal",
};
const normFac = (f) => FAC_NORM[f.toLowerCase().trim()] ?? f;

export const nspLayer = {
  id: "nsp",
  label: "NSP outlets",
  group: "Services",
  defaultOn: true,
  swatch: TYPE.primary.color,
  load: () =>
    import("../../../utils/nsp").then((m) => ({
      outlets: m.NSP_ALL,
      lhds: m.NSP_LHDS,
    })),
  render: (_map, { outlets, lhds }) => {
    const lg = L.layerGroup();
    for (const o of outlets) {
      if (!o.lat || !o.lon) continue;
      const t = TYPE[o.t] ?? TYPE.secondary;
      const lhdName = o.l >= 0 ? lhds[o.l] : "";
      const facs = (o.f || []).map(normFac).join(", ") || "—";
      L.circleMarker([o.lat, o.lon], {
        radius: t.radius,
        color: "white",
        fillColor: t.color,
        fillOpacity: t.fillOpacity,
        weight: t.weight,
      })
        .bindPopup(
          `<div style="font-family:system-ui;font-size:13px;min-width:180px;line-height:1.5">
            <strong style="font-size:14px;display:block;margin-bottom:2px">${o.n}</strong>
            <span style="color:var(--c-text2)">${o.a}, ${o.s}${o.p ? " " + o.p : ""}</span>
            ${lhdName ? `<div style="font-size:11px;color:var(--c-text3);margin-top:3px">${lhdName}</div>` : ""}
            ${o.h ? `<div style="margin-top:6px;white-space:pre-line;font-size:11px;color:var(--c-text2);border-top:1px solid var(--c-border);padding-top:5px">${o.h}</div>` : ""}
            ${facs !== "—" ? `<div style="margin-top:5px;font-size:11px;color:var(--c-text3)">${facs}</div>` : ""}
          </div>`,
          { maxWidth: 280 },
        )
        .addTo(lg);
    }
    return lg;
  },
  getLegend: () =>
    Object.values(TYPE).map((t) => ({ color: t.color, label: t.label })),
};
