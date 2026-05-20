import L from "leaflet";

const COLOR = "var(--c-acchs)";
const COLOR_HEX = "#7c3aed";

export const acchsLayer = {
  id: "acchs",
  label: "ACCHS",
  group: "Services",
  defaultOn: false,
  swatch: COLOR_HEX,
  load: () =>
    import("../../../utils/acchs").then((m) => ({
      services: m.ACCHS_NSW,
      regions: m.ACCHS_REGIONS,
    })),
  render: (_map, { services, regions }) => {
    const lg = L.layerGroup();
    for (const s of services) {
      if (s.lat == null || s.lon == null) continue;
      const region = s.r >= 0 ? regions[s.r] : "";
      L.circleMarker([s.lat, s.lon], {
        radius: 6,
        color: "white",
        fillColor: COLOR_HEX,
        fillOpacity: 0.85,
        weight: 1.5,
      })
        .bindPopup(
          `<div style="font-family:system-ui;font-size:13px;min-width:200px;line-height:1.5">
            <span style="display:inline-block;padding:1px 6px;background:#ede9fe;color:#6d28d9;border:1px solid #c4b5fd;border-radius:100px;font-size:10px;font-weight:600;margin-bottom:4px">ACCHS</span>
            <strong style="font-size:13px;display:block;margin:2px 0">${s.n}</strong>
            <span style="color:var(--c-text2);font-size:12px">${s.a}${s.s ? ", " + s.s : ""}${s.p ? " " + s.p : ""}</span>
            ${region ? `<div style="font-size:11px;color:var(--c-text3);margin-top:3px">${region} Region</div>` : ""}
            ${s.sv?.length ? `<div style="font-size:10px;color:var(--c-text3);margin-top:4px;border-top:1px solid var(--c-border);padding-top:4px">${s.sv.join(" · ")}</div>` : ""}
          </div>`,
          { maxWidth: 280 },
        )
        .addTo(lg);
    }
    return lg;
  },
  getLegend: () => [{ color: COLOR_HEX, label: "ACCHS" }],
};
