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
import { MetricCard, SectionLabel, Card, Pill, EmptyState } from "./Shared";

// ── Type config ──────────────────────────────────────────────────────────────
const TYPE = {
  primary:   { label: "Primary NSP",  color: "#059669", bg: "#ecfdf5", text: "#065f46", border: "rgba(5,150,105,0.3)" },
  secondary: { label: "Secondary NSP", color: "#3b82f6", bg: "#eff6ff", text: "#1e40af", border: "rgba(59,130,246,0.3)" },
  pharmacy:  { label: "Pharmacy",     color: "#d97706", bg: "#fffbeb", text: "#92400e", border: "rgba(217,119,6,0.3)" },
};

// ── Facility label normaliser ────────────────────────────────────────────────
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

function normFac(f) {
  return FAC_NORM[f.toLowerCase().trim()] ?? f;
}

// ── Leaflet map ──────────────────────────────────────────────────────────────
function NSPMap({ outlets }) {
  const elRef   = useRef(null);
  const mapRef  = useRef(null);
  const lgRef   = useRef(null);

  // Initialise once
  useEffect(() => {
    if (mapRef.current || !elRef.current) return;

    const map = L.map(elRef.current, {
      center: [-32.5, 147],
      zoom: 6,
      zoomControl: true,
    });

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
      mapRef.current = null;
      lgRef.current  = null;
    };
  }, []);

  // Re-populate markers when filtered list changes
  useEffect(() => {
    const lg = lgRef.current;
    const map = mapRef.current;
    if (!lg) return;

    lg.clearLayers();

    const validPts = [];
    outlets.forEach(o => {
      if (!o.lat || !o.lon) return;
      const { color } = TYPE[o.t] ?? TYPE.secondary;
      const isPrimary = o.t === "primary";
      validPts.push([o.lat, o.lon]);

      const facs = o.f.map(normFac).join(", ") || "—";
      const lhdName = o.l >= 0 ? NSP_LHDS[o.l] : "";

      L.circleMarker([o.lat, o.lon], {
        radius:      isPrimary ? 8 : 5,
        color:       "white",
        fillColor:   color,
        fillOpacity: isPrimary ? 0.9 : 0.75,
        weight:      isPrimary ? 2 : 1,
      })
        .bindPopup(
          `<div style="font-family:system-ui;font-size:13px;min-width:180px;line-height:1.5">
            <strong style="font-size:14px;display:block;margin-bottom:2px">${o.n}</strong>
            <span style="color:#666">${o.a}, ${o.s}${o.p ? " " + o.p : ""}</span>
            ${lhdName ? `<div style="margin-top:4px;font-size:11px;color:#888">${lhdName}</div>` : ""}
            ${o.h ? `<div style="margin-top:6px;white-space:pre-line;font-size:11px;color:#555;border-top:1px solid #eee;padding-top:5px">${o.h}</div>` : ""}
            ${facs !== "—" ? `<div style="margin-top:5px;font-size:11px;color:#777">${facs}</div>` : ""}
          </div>`,
          { maxWidth: 280 }
        )
        .addTo(lg);
    });

    if (validPts.length > 0 && map) {
      try {
        map.fitBounds(validPts, { padding: [40, 40], maxZoom: 13, animate: false });
      } catch (_) {}
    }
  }, [outlets]);

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
      {/* Legend */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          background: "var(--c-surface)",
          border: "1px solid var(--c-border)",
          borderRadius: "var(--radius-sm)",
          padding: "8px 12px",
          display: "flex",
          gap: 14,
          fontSize: 12,
          fontWeight: 500,
          boxShadow: "var(--shadow-sm)",
          zIndex: 1000,
          color: "var(--c-text2)",
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
      </div>
    </div>
  );
}

// ── Outlet card ──────────────────────────────────────────────────────────────
function OutletCard({ outlet }) {
  const [open, setOpen] = useState(false);
  const t = TYPE[outlet.t] ?? TYPE.secondary;
  const lhdName = outlet.l >= 0 ? NSP_LHDS[outlet.l] : null;

  return (
    <div
      style={{
        border: "1px solid var(--c-border)",
        borderRadius: "var(--radius)",
        background: "var(--c-surface)",
        boxShadow: "var(--shadow-xs)",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <Pill
          bg={t.bg}
          color={t.text}
          border={t.border}
          size="small"
        >
          {t.label}
        </Pill>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--c-text)",
            lineHeight: 1.4,
            flex: 1,
          }}
        >
          {outlet.n}
        </span>
      </div>

      {/* Address */}
      <div style={{ fontSize: 12, color: "var(--c-text3)", lineHeight: 1.4 }}>
        {[outlet.a, outlet.s, outlet.p || null].filter(Boolean).join(", ")}
      </div>

      {/* LHD */}
      {lhdName && (
        <div style={{ fontSize: 11, color: "var(--c-text3)", fontStyle: "italic" }}>
          {lhdName}
        </div>
      )}

      {/* Hours toggle */}
      {outlet.h && (
        <>
          <button
            onClick={() => setOpen(v => !v)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 600,
              color: "var(--c-text3)",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontFamily: "var(--font-body)",
              letterSpacing: "0.02em",
            }}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              style={{
                transform: open ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform 0.15s ease",
                flexShrink: 0,
              }}
            >
              <path d="M3 2l4 3-4 3" />
            </svg>
            Hours &amp; contact
          </button>
          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{ overflow: "hidden" }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--c-text2)",
                    whiteSpace: "pre-line",
                    lineHeight: 1.6,
                    paddingTop: 2,
                    borderTop: "1px solid var(--c-border)",
                    paddingTop: 6,
                    marginTop: 2,
                  }}
                >
                  {outlet.h}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Facility pills */}
      {outlet.f.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 2 }}>
          {outlet.f.map((fac, i) => (
            <Pill key={i} size="small">
              {normFac(fac)}
            </Pill>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Filter / toggle button primitives ────────────────────────────────────────
function TypeChip({ active, color, bg, border, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 14px",
        fontSize: 12,
        fontWeight: active ? 600 : 500,
        fontFamily: "var(--font-body)",
        borderRadius: 100,
        border: `1.5px solid ${active ? border : "var(--c-border)"}`,
        background: active ? bg : "var(--c-surface)",
        color: active ? color : "var(--c-text3)",
        cursor: "pointer",
        transition: "all 0.15s ease",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function ViewToggle({ view, onChange }) {
  const btn = (id, icon, title) => (
    <button
      title={title}
      onClick={() => onChange(id)}
      style={{
        width: 32,
        height: 32,
        borderRadius: "var(--radius-sm)",
        border: `1.5px solid ${view === id ? "var(--c-accent)" : "var(--c-border)"}`,
        background: view === id ? "var(--c-accent-light)" : "var(--c-surface)",
        color: view === id ? "var(--c-accent)" : "var(--c-text3)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.15s ease",
      }}
    >
      {icon}
    </button>
  );
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {btn(
        "map",
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="1,12 5,4 9,8 13,3 15,12" />
        </svg>,
        "Map view"
      )}
      {btn(
        "list",
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="2" y1="4" x2="14" y2="4" />
          <line x1="2" y1="8" x2="14" y2="8" />
          <line x1="2" y1="12" x2="10" y2="12" />
        </svg>,
        "List view"
      )}
    </div>
  );
}

// ── Main view ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 24;

export default function NSPView() {
  const [view,      setView]      = useState("map");
  const [typeF,     setTypeF]     = useState("all");
  const [lhdF,      setLhdF]      = useState("");
  const [search,    setSearch]    = useState("");
  const [page,      setPage]      = useState(0);

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

  const setType = v  => { setTypeF(v); resetPage(); };
  const setLhd  = v  => { setLhdF(v);  resetPage(); };
  const setQ    = v  => { setSearch(v); resetPage(); };

  return (
    <div>
      {/* Intro card */}
      <Card
        style={{
          marginBottom: 20,
          padding: "20px 24px",
          background: "var(--c-accent-light)",
          borderColor: "rgba(5, 150, 105, 0.15)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 14,
            fontWeight: 600,
            color: "var(--c-accent)",
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="6" r="3" />
            <path d="M8 9v6M5 14h6" />
            <path d="M3 6a5 5 0 0 1 10 0c0 4-5 8-5 8S3 10 3 6z" />
          </svg>
          NSW Needle &amp; Syringe Program Outlets
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--c-text2)", margin: 0 }}>
          <strong style={{ color: "var(--c-text)", fontWeight: 600 }}>{NSP_ALL.length} NSP services</strong>{" "}
          across <strong style={{ color: "var(--c-text)", fontWeight: 600 }}>15 NSW Local Health Districts</strong> —
          including dedicated primary outlets, secondary health services, and participating pharmacies.
        </p>
      </Card>

      {/* Summary metrics */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 24,
        }}
        className="grid-4"
      >
        <MetricCard
          label="Total outlets"
          value={NSP_ALL.length.toLocaleString()}
          sub="across NSW"
        />
        <MetricCard
          label="Primary NSP"
          value={NSP_PRIMARY.length}
          sub="dedicated services"
          accent={TYPE.primary.color}
        />
        <MetricCard
          label="Secondary NSP"
          value={NSP_SECONDARY.length}
          sub="health & community"
          accent={TYPE.secondary.color}
        />
        <MetricCard
          label="Pharmacies"
          value={NSP_PHARMACIES.length}
          sub="participating"
          accent={TYPE.pharmacy.color}
        />
      </div>

      {/* Filter + view bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
          marginBottom: 16,
          padding: "14px 16px",
          background: "var(--c-surface)",
          border: "1px solid var(--c-border)",
          borderRadius: "var(--radius)",
          boxShadow: "var(--shadow-xs)",
        }}
      >
        {/* Type chips */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <TypeChip
            active={typeF === "all"}
            color="var(--c-text2)"
            bg="var(--c-bg3)"
            border="var(--c-border2)"
            label="All types"
            onClick={() => setType("all")}
          />
          {Object.entries(TYPE).map(([key, t]) => (
            <TypeChip
              key={key}
              active={typeF === key}
              color={t.text}
              bg={t.bg}
              border={t.border}
              label={t.label}
              onClick={() => setType(key)}
            />
          ))}
        </div>

        <div style={{ height: 20, width: 1, background: "var(--c-border)", flexShrink: 0 }} />

        {/* LHD select */}
        <select
          value={lhdF}
          onChange={e => setLhd(e.target.value)}
          style={{
            padding: "6px 28px 6px 10px",
            fontSize: 12,
            fontWeight: 500,
            fontFamily: "var(--font-body)",
            border: "1.5px solid var(--c-border)",
            borderRadius: "var(--radius-sm)",
            background: "var(--c-surface)",
            color: lhdF ? "var(--c-text)" : "var(--c-text3)",
            cursor: "pointer",
            minWidth: 160,
          }}
        >
          <option value="">All LHDs</option>
          {NSP_LHDS.map((name, i) => (
            <option key={i} value={i}>{name}</option>
          ))}
        </select>

        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 140 }}>
          <svg
            style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
            width="13" height="13" viewBox="0 0 14 14" fill="none"
            stroke="var(--c-text3)" strokeWidth="1.8" strokeLinecap="round"
          >
            <circle cx="6" cy="6" r="4.5" />
            <line x1="9.2" y1="9.2" x2="13" y2="13" />
          </svg>
          <input
            type="text"
            placeholder="Name, suburb or postcode…"
            value={search}
            onChange={e => setQ(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "7px 10px 7px 28px",
              fontSize: 12,
              fontFamily: "var(--font-body)",
              border: "1.5px solid var(--c-border)",
              borderRadius: "var(--radius-sm)",
              background: "var(--c-surface)",
              color: "var(--c-text)",
              transition: "border-color 0.15s ease",
            }}
          />
        </div>

        <div style={{ marginLeft: "auto" }}>
          <ViewToggle view={view} onChange={setView} />
        </div>
      </div>

      {/* Result count */}
      <div
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "var(--c-text3)",
          marginBottom: 14,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            fontSize: 13,
            color: "var(--c-text2)",
          }}
        >
          {filtered.length.toLocaleString()}
        </span>
        {" "}outlet{filtered.length !== 1 ? "s" : ""} shown
        {(typeF !== "all" || lhdF || search) && (
          <button
            onClick={() => { setTypeF("all"); setLhdF(""); setSearch(""); setPage(0); }}
            style={{
              marginLeft: 6,
              fontSize: 11,
              fontWeight: 600,
              color: "var(--c-accent)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              fontFamily: "var(--font-body)",
              textDecoration: "underline",
              textDecorationStyle: "dotted",
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Map or List */}
      <AnimatePresence mode="wait" initial={false}>
        {view === "map" ? (
          <motion.div
            key="map"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {filtered.length === 0 ? (
              <EmptyState
                icon={
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <circle cx="11" cy="11" r="7" />
                    <line x1="16" y1="16" x2="22" y2="22" />
                  </svg>
                }
                title="No outlets match your filters"
                description="Try adjusting the type, LHD, or search to find outlets."
              />
            ) : (
              <NSPMap outlets={filtered} />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {filtered.length === 0 ? (
              <EmptyState
                icon={
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <circle cx="11" cy="11" r="7" />
                    <line x1="16" y1="16" x2="22" y2="22" />
                  </svg>
                }
                title="No outlets match your filters"
                description="Try adjusting the type, LHD, or search to find outlets."
              />
            ) : (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: 10,
                    marginBottom: 20,
                  }}
                >
                  {paginated.map((o, i) => (
                    <OutletCard key={`${o.t}-${o.n}-${i}`} outlet={o} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      paddingTop: 8,
                    }}
                  >
                    <button
                      disabled={page === 0}
                      onClick={() => setPage(p => p - 1)}
                      style={{
                        padding: "7px 16px",
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: "var(--font-body)",
                        border: "1.5px solid var(--c-border)",
                        borderRadius: "var(--radius-sm)",
                        background: "var(--c-surface)",
                        color: page === 0 ? "var(--c-text3)" : "var(--c-text2)",
                        cursor: page === 0 ? "default" : "pointer",
                        opacity: page === 0 ? 0.4 : 1,
                        transition: "all 0.15s ease",
                      }}
                    >
                      ← Prev
                    </button>
                    <span
                      style={{
                        fontSize: 12,
                        fontFamily: "var(--font-mono)",
                        fontWeight: 600,
                        color: "var(--c-text3)",
                        minWidth: 80,
                        textAlign: "center",
                      }}
                    >
                      {page + 1} / {totalPages}
                    </span>
                    <button
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage(p => p + 1)}
                      style={{
                        padding: "7px 16px",
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: "var(--font-body)",
                        border: "1.5px solid var(--c-border)",
                        borderRadius: "var(--radius-sm)",
                        background: "var(--c-surface)",
                        color: page >= totalPages - 1 ? "var(--c-text3)" : "var(--c-text2)",
                        cursor: page >= totalPages - 1 ? "default" : "pointer",
                        opacity: page >= totalPages - 1 ? 0.4 : 1,
                        transition: "all 0.15s ease",
                      }}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
