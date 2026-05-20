import L from "leaflet";

const COLOR_PHARMACY = "#ea580c";
const COLOR_CLINIC = "#9a3412";

export const otpLayer = {
  id: "otp",
  label: "OTP sites",
  group: "Services",
  defaultOn: false,
  swatch: COLOR_PHARMACY,
  load: () =>
    import("../../../utils/otp").then((m) => ({
      sites: m.OTP_ALL,
      lhds: m.OTP_LHDS,
      sources: m.OTP_SOURCES,
    })),
  render: (_map, { sites, lhds, sources }) => {
    const lg = L.layerGroup();
    for (const s of sites) {
      if (s.lat == null || s.lon == null) continue;
      const isClinic = s.t === "public-clinic";
      const hasLaib = s.sv?.includes("laib");
      const lhdName = s.l >= 0 ? lhds[s.l] : "";
      const src = sources[s.src];
      L.circleMarker([s.lat, s.lon], {
        radius: isClinic ? 7 : 4,
        color: "white",
        fillColor: isClinic ? COLOR_CLINIC : COLOR_PHARMACY,
        fillOpacity: isClinic ? 0.9 : 0.75,
        weight: isClinic ? 2 : 1,
      })
        .bindPopup(
          `<div style="font-family:system-ui;font-size:13px;min-width:200px;line-height:1.5">
            <span style="display:inline-block;padding:1px 6px;background:#fff7ed;color:#9a3412;border:1px solid #fdba74;border-radius:100px;font-size:10px;font-weight:600;margin-bottom:4px">${isClinic ? "OTP CLINIC" : "OTP PHARMACY"}</span>
            ${hasLaib ? `<span style="display:inline-block;padding:1px 6px;background:#fffbeb;color:#a16207;border:1px solid #fde68a;border-radius:100px;font-size:10px;font-weight:600;margin-left:4px;margin-bottom:4px">LAIB</span>` : ""}
            <strong style="font-size:13px;display:block;margin:2px 0">${s.n}</strong>
            <span style="color:var(--c-text2);font-size:12px">${s.a}${s.s ? ", " + s.s : ""}${s.p ? " " + s.p : ""}</span>
            ${lhdName ? `<div style="font-size:11px;color:var(--c-text3);margin-top:3px">${lhdName}</div>` : ""}
            ${src ? `<div style="font-size:10px;color:var(--c-text3);margin-top:4px;border-top:1px solid var(--c-border);padding-top:4px">Source: ${src.label}${src.updated ? ` · ${src.updated}` : ""}</div>` : ""}
          </div>`,
          { maxWidth: 280 },
        )
        .addTo(lg);
    }
    return lg;
  },
  getLegend: () => [
    { color: COLOR_PHARMACY, label: "OTP pharmacy" },
    { color: COLOR_CLINIC, label: "OTP clinic" },
  ],
};
