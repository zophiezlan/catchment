import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  NSP_LHDS,
  NSP_ALL,
  NSP_PRIMARY,
  NSP_SECONDARY,
  NSP_PHARMACIES,
} from "../utils/nsp";
import { MetricCard, Card, Pill, EmptyState } from "./Shared";

// ── Type config ──────────────────────────────────────────────────────────────
const TYPE = {
  primary:   { label: "Primary NSP",   color: "#059669", bg: "var(--c-zone2-bg)", text: "var(--c-zone2-text)", border: "rgba(5,150,105,0.3)" },
  secondary: { label: "Secondary NSP", color: "#3b82f6", bg: "var(--c-info-bg)",  text: "var(--c-info-text)",  border: "var(--c-info-border)" },
  pharmacy:  { label: "Pharmacy",      color: "#d97706", bg: "var(--c-warning-bg)", text: "var(--c-warning-text)", border: "var(--c-warning-border)" },
};

// ── Facility normaliser ───────────────────────────────────────────────────────
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
const normFac = f => FAC_NORM[f.toLowerCase().trim()] ?? f;

// ── Leaflet map ──────────────────────────────────────────────────────────────
function NSPMap({ outlets }) {
  const elRef       = useRef(null);
  const mapRef      = useRef(null);
  const lgRef       = useRef(null);
  const geoRef      = useRef(null);
  const acchsLgRef  = useRef(null);
  const otpLgRef    = useRef(null);
  const [showLHDs,  setShowLHDs]  = useState(false);
  const [showACCHS, setShowACCHS] = useState(false);
  const [showOTP,   setShowOTP]   = useState(false);

  // Initialise Leaflet once
  useEffect(() => {
    if (mapRef.current || !elRef.current) return;
    const map = L.map(elRef.current, { center: [-32.5, 147], zoom: 6 });
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
      }
    ).addTo(map);
    lgRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current     = null;
      lgRef.current      = null;
      geoRef.current     = null;
      acchsLgRef.current = null;
      otpLgRef.current   = null;
    };
  }, []);

  // Update outlet markers
  useEffect(() => {
    const lg = lgRef.current;
    const map = mapRef.current;
    if (!lg) return;
    lg.clearLayers();
    const pts = [];
    outlets.forEach(o => {
      if (!o.lat || !o.lon) return;
      const { color } = TYPE[o.t] ?? TYPE.secondary;
      pts.push([o.lat, o.lon]);
      const lhdName = o.l >= 0 ? NSP_LHDS[o.l] : "";
      const facs    = o.f.map(normFac).join(", ") || "—";
      L.circleMarker([o.lat, o.lon], {
        radius:      o.t === "primary" ? 8 : 5,
        color:       "white",
        fillColor:   color,
        fillOpacity: o.t === "primary" ? 0.9 : 0.75,
        weight:      o.t === "primary" ? 2 : 1,
      })
        .bindPopup(
          `<div style="font-family:system-ui;font-size:13px;min-width:180px;line-height:1.5">
            <strong style="font-size:14px;display:block;margin-bottom:2px">${o.n}</strong>
            <span style="color:var(--c-text2)">${o.a}, ${o.s}${o.p ? " " + o.p : ""}</span>
            ${lhdName ? `<div style="font-size:11px;color:var(--c-text3);margin-top:3px">${lhdName}</div>` : ""}
            ${o.h ? `<div style="margin-top:6px;white-space:pre-line;font-size:11px;color:var(--c-text2);border-top:1px solid var(--c-border);padding-top:5px">${o.h}</div>` : ""}
            ${facs !== "—" ? `<div style="margin-top:5px;font-size:11px;color:var(--c-text3)">${facs}</div>` : ""}
          </div>`,
          { maxWidth: 280 }
        )
        .addTo(lg);
    });
    if (pts.length && map) {
      try { map.fitBounds(pts, { padding: [40, 40], maxZoom: 13, animate: false }); }
      catch (_) {}
    }
  }, [outlets]);

  // Load / unload LHD boundary overlay
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (showLHDs) {
      import("../data/lhd-geo.json").then(m => {
        if (geoRef.current) geoRef.current.remove();
        geoRef.current = L.geoJSON(m.default, {
          style: { color: "#475569", weight: 1.5, opacity: 0.55, fill: false },
        }).addTo(map);
      });
    } else {
      geoRef.current?.remove();
      geoRef.current = null;
    }
  }, [showLHDs]);

  // Load / unload ACCHS overlay (Aboriginal Community Controlled Health Services)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (showACCHS) {
      import("../utils/acchs").then(({ ACCHS_NSW, ACCHS_REGIONS }) => {
        if (acchsLgRef.current) acchsLgRef.current.remove();
        const lg = L.layerGroup();
        ACCHS_NSW.forEach(s => {
          if (s.lat == null || s.lon == null) return;
          const region = s.r >= 0 ? ACCHS_REGIONS[s.r] : "";
          L.circleMarker([s.lat, s.lon], {
            radius: 6,
            color: "white",
            fillColor: "#7c3aed",
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
              { maxWidth: 280 }
            )
            .addTo(lg);
        });
        lg.addTo(map);
        acchsLgRef.current = lg;
      });
    } else {
      acchsLgRef.current?.remove();
      acchsLgRef.current = null;
    }
  }, [showACCHS]);

  // Load / unload OTP overlay (pharmacies + public clinics)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (showOTP) {
      import("../utils/otp").then(({ OTP_ALL, OTP_LHDS, OTP_SOURCES }) => {
        if (otpLgRef.current) otpLgRef.current.remove();
        const lg = L.layerGroup();
        OTP_ALL.forEach((s) => {
          if (s.lat == null || s.lon == null) return;
          const isClinic = s.t === "public-clinic";
          const hasLaib = s.sv?.includes("laib");
          const lhdName = s.l >= 0 ? OTP_LHDS[s.l] : "";
          const src = OTP_SOURCES[s.src];
          L.circleMarker([s.lat, s.lon], {
            radius: isClinic ? 7 : 4,
            color: "white",
            fillColor: isClinic ? "#9a3412" : "#ea580c",
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
        });
        lg.addTo(map);
        otpLgRef.current = lg;
      });
    } else {
      otpLgRef.current?.remove();
      otpLgRef.current = null;
    }
  }, [showOTP]);

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={elRef}
        style={{
          height: 480,
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          border: "1px solid var(--c-border)",
          boxShadow: "var(--shadow-sm)",
        }}
      />

      {/* Overlay toggles */}
      <div style={{
        position: "absolute", top: 12, right: 12, zIndex: 1000,
        display: "flex", flexDirection: "column", gap: 6,
      }}>
        <button
          onClick={() => setShowLHDs(v => !v)}
          title="Toggle LHD district boundaries"
          style={{
            padding: "5px 11px",
            fontSize: 11, fontWeight: 600, fontFamily: "var(--font-body)",
            borderRadius: "var(--radius-sm)",
            border: `1.5px solid ${showLHDs ? "var(--c-accent)" : "var(--c-border2)"}`,
            background: showLHDs ? "var(--c-accent-light)" : "var(--c-surface)",
            color: showLHDs ? "var(--c-accent)" : "var(--c-text2)",
            cursor: "pointer", boxShadow: "var(--shadow-sm)",
            transition: "all 0.15s ease",
            display: "flex", alignItems: "center", gap: 5,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="1" width="10" height="10" rx="2" />
            <line x1="1" y1="4.5" x2="11" y2="4.5" />
            <line x1="4.5" y1="4.5" x2="4.5" y2="11" />
          </svg>
          LHD boundaries
        </button>
        <button
          onClick={() => setShowACCHS(v => !v)}
          title="Aboriginal Community Controlled Health Services (AHMRC member directory)"
          style={{
            padding: "5px 11px",
            fontSize: 11, fontWeight: 600, fontFamily: "var(--font-body)",
            borderRadius: "var(--radius-sm)",
            border: `1.5px solid ${showACCHS ? "#7c3aed" : "var(--c-border2)"}`,
            background: showACCHS ? "#ede9fe" : "var(--c-surface)",
            color: showACCHS ? "#6d28d9" : "var(--c-text2)",
            cursor: "pointer", boxShadow: "var(--shadow-sm)",
            transition: "all 0.15s ease",
            display: "flex", alignItems: "center", gap: 5,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="6" r="4.5" />
            <circle cx="6" cy="6" r="1.5" fill="currentColor" stroke="none" />
          </svg>
          ACCHS
        </button>
        <button
          onClick={() => setShowOTP(v => !v)}
          title="Opioid Treatment Program — community pharmacies + public clinics dispensing methadone, buprenorphine, or LAIB"
          style={{
            padding: "5px 11px",
            fontSize: 11, fontWeight: 600, fontFamily: "var(--font-body)",
            borderRadius: "var(--radius-sm)",
            border: `1.5px solid ${showOTP ? "#ea580c" : "var(--c-border2)"}`,
            background: showOTP ? "#fff7ed" : "var(--c-surface)",
            color: showOTP ? "#9a3412" : "var(--c-text2)",
            cursor: "pointer", boxShadow: "var(--shadow-sm)",
            transition: "all 0.15s ease",
            display: "flex", alignItems: "center", gap: 5,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2.5" y="2" width="7" height="8.5" rx="1.2" />
            <path d="M4.5 5h3M4.5 7h3M4.5 9h2" />
          </svg>
          OTP
        </button>
      </div>

      {/* Legend */}
      <div
        style={{
          position: "absolute", bottom: 16, left: 16, zIndex: 1000,
          background: "var(--c-surface)", border: "1px solid var(--c-border)",
          borderRadius: "var(--radius-sm)", padding: "7px 12px",
          display: "flex", gap: 14, fontSize: 11, fontWeight: 500,
          boxShadow: "var(--shadow-sm)", color: "var(--c-text2)",
          fontFamily: "var(--font-body)",
        }}
      >
        {Object.entries(TYPE).map(([key, t]) => (
          <span key={key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="10" height="10" viewBox="0 0 10 10">
              <circle cx="5" cy="5" r="4" fill={t.color} />
            </svg>
            {t.label}
          </span>
        ))}
        {showACCHS && (
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="10" height="10" viewBox="0 0 10 10">
              <circle cx="5" cy="5" r="4" fill="#7c3aed" />
            </svg>
            ACCHS
          </span>
        )}
        {showOTP && (
          <>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <svg width="10" height="10" viewBox="0 0 10 10">
                <circle cx="5" cy="5" r="4" fill="#ea580c" />
              </svg>
              OTP pharmacy
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <svg width="10" height="10" viewBox="0 0 10 10">
                <circle cx="5" cy="5" r="4" fill="#9a3412" />
              </svg>
              OTP clinic
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// ── Outlet card ───────────────────────────────────────────────────────────────
function OutletCard({ outlet }) {
  const [open, setOpen] = useState(false);
  const t = TYPE[outlet.t] ?? TYPE.secondary;
  const lhdName = outlet.l >= 0 ? NSP_LHDS[outlet.l] : null;
  return (
    <div style={{
      border: "1px solid var(--c-border)", borderRadius: "var(--radius)",
      background: "var(--c-surface)", boxShadow: "var(--shadow-xs)",
      padding: "14px 16px", display: "flex", flexDirection: "column", gap: 6,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <Pill bg={t.bg} color={t.text} border={t.border} size="small">{t.label}</Pill>
        <span style={{
          fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 600,
          color: "var(--c-text)", lineHeight: 1.4, flex: 1,
        }}>
          {outlet.n}
        </span>
      </div>
      <div style={{ fontSize: 12, color: "var(--c-text3)", lineHeight: 1.4 }}>
        {[outlet.a, outlet.s, outlet.p || null].filter(Boolean).join(", ")}
      </div>
      {lhdName && (
        <div style={{ fontSize: 11, color: "var(--c-text3)", fontStyle: "italic" }}>{lhdName}</div>
      )}
      {outlet.h && (
        <>
          <button
            onClick={() => setOpen(v => !v)}
            style={{
              background: "none", border: "none", padding: 0, cursor: "pointer",
              fontSize: 11, fontWeight: 600, color: "var(--c-text3)", textAlign: "left",
              display: "flex", alignItems: "center", gap: 4, fontFamily: "var(--font-body)",
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
              style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s ease", flexShrink: 0 }}>
              <path d="M3 2l4 3-4 3" />
            </svg>
            Hours &amp; contact
          </button>
          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }}
                style={{ overflow: "hidden" }}
              >
                <div style={{
                  fontSize: 11, color: "var(--c-text2)", whiteSpace: "pre-line",
                  lineHeight: 1.6, borderTop: "1px solid var(--c-border)", paddingTop: 6,
                }}>
                  {outlet.h}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
      {outlet.f.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 2 }}>
          {outlet.f.map((fac, i) => <Pill key={i} size="small">{normFac(fac)}</Pill>)}
        </div>
      )}
    </div>
  );
}


// ── Filter / toggle primitives ────────────────────────────────────────────────
function TypeChip({ active, color, bg, border, label, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 14px", fontSize: 12, fontWeight: active ? 600 : 500,
      fontFamily: "var(--font-body)", borderRadius: 100,
      border: `1.5px solid ${active ? border : "var(--c-border)"}`,
      background: active ? bg : "var(--c-surface)",
      color: active ? color : "var(--c-text3)",
      cursor: "pointer", transition: "all 0.15s ease", whiteSpace: "nowrap",
    }}>
      {label}
    </button>
  );
}

function ViewToggle({ view, onChange }) {
  const btn = (id, icon, title) => (
    <button key={id} title={title} onClick={() => onChange(id)} style={{
      height: 32, padding: "0 12px",
      borderRadius: "var(--radius-sm)",
      border: `1.5px solid ${view === id ? "var(--c-accent)" : "var(--c-border)"}`,
      background: view === id ? "var(--c-accent-light)" : "var(--c-surface)",
      color: view === id ? "var(--c-accent)" : "var(--c-text3)",
      cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
      fontSize: 11, fontWeight: 600, fontFamily: "var(--font-body)",
      transition: "all 0.15s ease", whiteSpace: "nowrap",
    }}>
      {icon}
    </button>
  );
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {btn("map",
        <><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="1,11 4,4 8,7 11,3 13,11" /></svg>Map</>,
        "Map view"
      )}
      {btn("list",
        <><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="2" y1="4" x2="12" y2="4" /><line x1="2" y1="7" x2="12" y2="7" /><line x1="2" y1="10" x2="9" y2="10" /></svg>List</>,
        "List view"
      )}
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 24;

export default function NSPView() {
  const [view,   setView]   = useState("map");
  const [typeF,  setTypeF]  = useState("all");
  const [lhdF,   setLhdF]   = useState("");
  const [search, setSearch] = useState("");
  const [page,   setPage]   = useState(0);

  const resetPage = useCallback(() => setPage(0), []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return NSP_ALL.filter(o => {
      if (typeF !== "all" && o.t !== typeF) return false;
      if (lhdF  !== ""   && o.l !== Number(lhdF)) return false;
      if (q && !o.n.toLowerCase().includes(q) &&
               !o.s.toLowerCase().includes(q) &&
               !String(o.p).startsWith(q)) return false;
      return true;
    });
  }, [typeF, lhdF, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const setType = v => { setTypeF(v); resetPage(); };
  const setLhd  = v => { setLhdF(v);  resetPage(); };
  const setQ    = v => { setSearch(v); resetPage(); };

  const showFilters = true;

  return (
    <div>
      {/* Intro */}
      <Card style={{ marginBottom: 20, padding: "20px 24px", background: "var(--c-accent-light)", borderColor: "rgba(5,150,105,0.15)" }}>
        <div style={{
          fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600,
          color: "var(--c-accent)", marginBottom: 8,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="6" r="2.5" />
            <path d="M3 6a5 5 0 0 1 10 0c0 3.5-5 7.5-5 7.5S3 9.5 3 6z" />
          </svg>
          NSW Needle &amp; Syringe Program Outlets
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--c-text2)", margin: 0 }}>
          <strong style={{ color: "var(--c-text)", fontWeight: 600 }}>{NSP_ALL.length} NSP services</strong>{" "}
          across{" "}
          <strong style={{ color: "var(--c-text)", fontWeight: 600 }}>15 NSW Local Health Districts</strong> —
          dedicated primary outlets, secondary health services, and participating pharmacies.
          See the <strong style={{ color: "var(--c-text)" }}>Gap Analysis</strong> tab for high-need postcodes without exact-match coverage.
        </p>
      </Card>

      {/* Summary metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }} className="grid-4">
        <MetricCard label="Total outlets" value={NSP_ALL.length.toLocaleString()} sub="across NSW" />
        <MetricCard label="Primary NSP"   value={NSP_PRIMARY.length}    sub="dedicated services"  accent={TYPE.primary.color} />
        <MetricCard label="Secondary NSP" value={NSP_SECONDARY.length}  sub="health & community"  accent={TYPE.secondary.color} />
        <MetricCard label="Pharmacies"    value={NSP_PHARMACIES.length} sub="participating"        accent={TYPE.pharmacy.color} />
      </div>

      {/* Filter bar — hidden in gaps mode */}
      <AnimatePresence initial={false}>
        {showFilters && (
          <motion.div
            key="filterbar"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center",
              marginBottom: 16, padding: "14px 16px",
              background: "var(--c-surface)", border: "1px solid var(--c-border)",
              borderRadius: "var(--radius)", boxShadow: "var(--shadow-xs)",
            }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <TypeChip active={typeF === "all"} color="var(--c-text2)" bg="var(--c-bg3)" border="var(--c-border2)" label="All types" onClick={() => setType("all")} />
                {Object.entries(TYPE).map(([key, t]) => (
                  <TypeChip key={key} active={typeF === key} color={t.text} bg={t.bg} border={t.border} label={t.label} onClick={() => setType(key)} />
                ))}
              </div>
              <div style={{ height: 20, width: 1, background: "var(--c-border)", flexShrink: 0 }} />
              <select value={lhdF} onChange={e => setLhd(e.target.value)} style={{
                padding: "6px 28px 6px 10px", fontSize: 12, fontWeight: 500, fontFamily: "var(--font-body)",
                border: "1.5px solid var(--c-border)", borderRadius: "var(--radius-sm)",
                background: "var(--c-surface)", color: lhdF ? "var(--c-text)" : "var(--c-text3)",
                cursor: "pointer", minWidth: 160,
              }}>
                <option value="">All LHDs</option>
                {NSP_LHDS.map((name, i) => <option key={i} value={i}>{name}</option>)}
              </select>
              <div style={{ position: "relative", flex: 1, minWidth: 140 }}>
                <svg style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                  width="13" height="13" viewBox="0 0 14 14" fill="none"
                  stroke="var(--c-text3)" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="6" cy="6" r="4.5" /><line x1="9.2" y1="9.2" x2="13" y2="13" />
                </svg>
                <input type="text" placeholder="Name, suburb or postcode…" value={search}
                  onChange={e => setQ(e.target.value)}
                  style={{
                    width: "100%", boxSizing: "border-box", padding: "7px 10px 7px 28px",
                    fontSize: 12, fontFamily: "var(--font-body)",
                    border: "1.5px solid var(--c-border)", borderRadius: "var(--radius-sm)",
                    background: "var(--c-surface)", color: "var(--c-text)",
                  }}
                />
              </div>
              <div style={{ marginLeft: "auto" }}>
                <ViewToggle view={view} onChange={setView} />
              </div>
            </div>

            {/* Result count */}
            <div style={{ fontSize: 12, fontWeight: 500, color: "var(--c-text3)", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: "var(--c-text2)" }}>{filtered.length.toLocaleString()}</span>
              {" "}outlet{filtered.length !== 1 ? "s" : ""} shown
              {(typeF !== "all" || lhdF || search) && (
                <button onClick={() => { setTypeF("all"); setLhdF(""); setSearch(""); setPage(0); }}
                  style={{ marginLeft: 6, fontSize: 11, fontWeight: 600, color: "var(--c-accent)", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "var(--font-body)", textDecoration: "underline", textDecorationStyle: "dotted" }}>
                  Clear filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content — map stays mounted (Leaflet can't animate out), other views use AnimatePresence */}
      <div style={{ display: view === "map" ? "block" : "none" }}>
        {filtered.length === 0
          ? <EmptyState title="No outlets match" description="Adjust the type, LHD, or search to find outlets." />
          : <NSPMap outlets={filtered} />
        }
      </div>

      <AnimatePresence initial={false}>
        {view === "list" && (
          <motion.div key="list" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {filtered.length === 0
              ? <EmptyState title="No outlets match" description="Adjust the type, LHD, or search to find outlets." />
              : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 10, marginBottom: 20 }}>
                    {paginated.map((o, i) => <OutletCard key={`${o.t}-${o.n}-${i}`} outlet={o} />)}
                  </div>
                  {totalPages > 1 && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                        style={{ padding: "7px 16px", fontSize: 12, fontWeight: 600, fontFamily: "var(--font-body)", border: "1.5px solid var(--c-border)", borderRadius: "var(--radius-sm)", background: "var(--c-surface)", cursor: page === 0 ? "default" : "pointer", color: page === 0 ? "var(--c-text3)" : "var(--c-text2)", opacity: page === 0 ? 0.4 : 1 }}>← Prev</button>
                      <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--c-text3)", minWidth: 80, textAlign: "center" }}>{page + 1} / {totalPages}</span>
                      <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                        style={{ padding: "7px 16px", fontSize: 12, fontWeight: 600, fontFamily: "var(--font-body)", border: "1.5px solid var(--c-border)", borderRadius: "var(--radius-sm)", background: "var(--c-surface)", cursor: page >= totalPages - 1 ? "default" : "pointer", color: page >= totalPages - 1 ? "var(--c-text3)" : "var(--c-text2)", opacity: page >= totalPages - 1 ? 0.4 : 1 }}>Next →</button>
                    </div>
                  )}
                </>
              )
            }
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
