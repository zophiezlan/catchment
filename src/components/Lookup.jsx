import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IDX,
  decode,
  searchPostcodes,
  getLocalities,
  ZONE_COLORS,
  ZONE_COLORS_LIGHT,
  ZONE_COLORS_TEXT,
} from "../utils/data";
import { Pill, EquityBar, FieldLabel, Card, EmptyState } from "./Shared";

function useDebounce(callback, delay) {
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  return useCallback(
    (...args) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => callback(...args), delay);
    },
    [callback, delay],
  );
}

export default function Lookup() {
  const [q, setQ] = useState("");
  const [res, setRes] = useState(null);
  const [sugg, setSugg] = useState([]);
  const [open, setOpen] = useState(false);
  const [si, setSi] = useState(-1);
  const [hint, setHint] = useState("");
  const iRef = useRef(null);

  const debouncedSearch = useDebounce((t) => {
    const m = searchPostcodes(t, 8);
    setSugg(m);
    setOpen(m.length > 0);
  }, 180);

  function doSearch(v) {
    setQ(v);
    setSi(-1);
    setHint("");
    const t = v.trim();

    // Validate: if it looks numeric but isn't a valid format, show hint
    if (/^\d+$/.test(t) && t.length > 4) {
      setHint("Australian postcodes are 3-4 digits");
      setSugg([]);
      setOpen(false);
      setRes(null);
      return;
    }

    // Exact postcode match — show card immediately
    const n = Number(t);
    if (/^\d{3,4}$/.test(t) && IDX[n]) {
      setRes(IDX[n]);
      setSugg([]);
      setOpen(false);
      return;
    }

    // Search by postcode prefix or place name (2+ chars) — debounced
    if (t.length >= 2) {
      debouncedSearch(t);
    } else {
      setSugg([]);
      setOpen(false);
    }
    setRes(null);
  }

  function pick(pc) {
    setQ(String(pc));
    setRes(IDX[pc]);
    setSugg([]);
    setOpen(false);
  }

  function handleKey(e) {
    if (!open || !sugg.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSi((i) => Math.min(i + 1, sugg.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSi((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && si >= 0) {
      e.preventDefault();
      pick(sugg[si].pc);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const d = res ? decode(res[0]) : null;
  const multiState = res && res.length > 1;

  // NSP enrichment — lazy-loaded so it doesn't bloat this chunk
  const [nspCounts, setNspCounts] = useState(null);
  const [nearestNSP, setNearestNSP] = useState(null);
  const [suburbDistances, setSuburbDistances] = useState(null);
  useEffect(() => {
    if (!d?.pc) { setNspCounts(null); setNearestNSP(null); setSuburbDistances(null); return; }
    Promise.all([
      import("../utils/nsp"),
      import("../data/suburb-centroids.json"),
      import("../utils/geo"),
    ]).then(([nspMod, salMod, geoMod]) => {
      const { NSP_PC, getNearestPrimaryNSP, NSP_ALL } = nspMod;
      setNspCounts(NSP_PC[d.pc] ?? null);
      const nearest = getNearestPrimaryNSP(d.pc);
      setNearestNSP(nearest);
      // Per-suburb distances to nearest NSP (any type)
      const salCentroids = salMod.default[d.pc];
      if (salCentroids) {
        const all = NSP_ALL;
        const dists = salCentroids.map(c => {
          if (!c) return null;
          const r = geoMod.nearestOutlet(c[0], c[1], all);
          return r ? r.distanceKm : null;
        });
        setSuburbDistances(dists);
      } else {
        setSuburbDistances(null);
      }
    });
  }, [d?.pc]);

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      {/* Search input */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <div style={{ position: "relative" }}>
          <svg
            style={{
              position: "absolute",
              left: 16,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--c-text3)"
            strokeWidth="2.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="10.5" cy="10.5" r="7" />
            <line x1="15.5" y1="15.5" x2="21" y2="21" />
          </svg>
          <input
            ref={iRef}
            type="text"
            placeholder="Search by postcode or place name..."
            aria-label="Search by postcode number or suburb/place name"
            aria-autocomplete="list"
            aria-expanded={open}
            value={q}
            onChange={(e) => doSearch(e.target.value)}
            onFocus={() => sugg.length > 0 && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 200)}
            onKeyDown={handleKey}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "14px 44px 14px 46px",
              fontSize: 17,
              fontFamily: "var(--font-mono)",
              fontWeight: 500,
              border: "2px solid var(--c-border)",
              borderRadius: "var(--radius)",
              background: "var(--c-surface)",
              color: "var(--c-text)",
              boxShadow: "var(--shadow-sm)",
              transition: "all 0.2s ease",
            }}
          />
          {q && (
            <button
              onClick={() => {
                setQ("");
                setRes(null);
                setSugg([]);
                setOpen(false);
                setHint("");
                iRef.current?.focus();
              }}
              aria-label="Clear search"
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "var(--c-bg3)",
                border: "none",
                borderRadius: 20,
                width: 26,
                height: 26,
                cursor: "pointer",
                color: "var(--c-text2)",
                fontSize: 15,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        <AnimatePresence>
          {open && sugg.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              role="listbox"
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                left: 0,
                right: 0,
                zIndex: 50,
                background: "var(--c-surface)",
                border: "1px solid var(--c-border2)",
                borderRadius: "var(--radius)",
                overflow: "hidden",
                boxShadow: "var(--shadow-lg)",
              }}
            >
              {sugg.map((item, i) => (
                <div
                  key={`${item.pc}_${i}`}
                  role="option"
                  aria-selected={i === si}
                  onClick={() => pick(item.pc)}
                  onMouseEnter={() => setSi(i)}
                  style={{
                    padding: "11px 16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: i === si ? "var(--c-bg2)" : "transparent",
                    borderBottom:
                      i < sugg.length - 1
                        ? "1px solid var(--c-border)"
                        : "none",
                    transition: "background 0.1s ease",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      fontSize: 15,
                      minWidth: 48,
                      color: "var(--c-text)",
                    }}
                  >
                    {item.pc}
                  </span>
                  <span
                    style={{ fontSize: 13, color: "var(--c-text2)", flex: 1 }}
                  >
                    {item.matchedLocality ? (
                      <>
                        <span style={{ color: "var(--c-text)" }}>{item.matchedLocality}</span>
                        <span style={{ fontSize: 11, color: "var(--c-text3)", marginLeft: 4 }}>
                          ({item.pl})
                        </span>
                      </>
                    ) : (
                      item.pl
                    )}
                  </span>
                  <Pill
                    size="small"
                    bg={ZONE_COLORS_LIGHT[item.z]}
                    color={ZONE_COLORS_TEXT[item.z]}
                    border={ZONE_COLORS[item.z]}
                  >
                    {item.zn}
                  </Pill>
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--c-text3)",
                      fontWeight: 500,
                      minWidth: 32,
                      textAlign: "right",
                    }}
                  >
                    {item.st}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Validation hint */}
        {hint && (
          <div
            style={{
              marginTop: 6,
              fontSize: 12,
              fontWeight: 500,
              color: "#d97706",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <circle cx="7" cy="7" r="5.5" />
              <path d="M7 4.5v3" />
              <circle cx="7" cy="10" r="0.5" fill="currentColor" />
            </svg>
            {hint}
          </div>
        )}
      </div>

      {/* Result card */}
      <AnimatePresence mode="wait">
        {d ? (
          <motion.div
            key={d.pc}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div
              style={{
                border: "1px solid var(--c-border)",
                borderRadius: "var(--radius-xl)",
                overflow: "hidden",
                background: "var(--c-surface)",
                boxShadow: "var(--shadow-md)",
              }}
            >
              {/* Header band with zone colour */}
              <div
                style={{
                  background: `linear-gradient(135deg, ${ZONE_COLORS[d.z]}18, ${ZONE_COLORS[d.z]}08)`,
                  borderBottom: `2px solid ${ZONE_COLORS[d.z]}30`,
                  padding: "20px 24px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "flex-start", gap: 16 }}
                >
                  {/* Big postcode */}
                  <div
                    style={{
                      fontSize: 40,
                      fontWeight: 800,
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "-0.03em",
                      color: "var(--c-text)",
                      lineHeight: 1,
                    }}
                  >
                    {d.pc}
                  </div>
                  <div style={{ flex: 1, paddingTop: 2 }}>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 17,
                        fontWeight: 600,
                        color: "var(--c-text)",
                        marginBottom: 6,
                        lineHeight: 1.3,
                      }}
                    >
                      {d.pl}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <Pill
                        bg={ZONE_COLORS_LIGHT[d.z]}
                        color={ZONE_COLORS_TEXT[d.z]}
                        border={ZONE_COLORS[d.z]}
                      >
                        {d.zn} — Zone {d.z}
                      </Pill>
                      <Pill>{d.st}</Pill>
                      {multiState && (
                        <Pill size="small">
                          +{res.length - 1} state{res.length > 2 ? "s" : ""}
                        </Pill>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Localities / suburbs covered by this postcode */}
              {(() => {
                const locs = getLocalities(d.pc);
                const hasDists = suburbDistances && suburbDistances.some(d => d != null);
                return locs.length > 1 ? (
                  <div
                    style={{
                      padding: "12px 24px",
                      borderBottom: "1px solid var(--c-border)",
                      background: "var(--c-bg2)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--c-text3)",
                        marginBottom: 6,
                      }}
                    >
                      Suburbs & localities ({locs.length})
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {locs.map((loc, i) => {
                        const dist = hasDists ? suburbDistances[i] : null;
                        const distColor = dist != null
                          ? dist > 50 ? "#ef4444" : dist > 20 ? "#d97706" : "#059669"
                          : null;
                        return (
                          <span
                            key={loc}
                            title={dist != null ? `${dist} km to nearest NSP outlet` : undefined}
                            style={{
                              fontSize: 12,
                              fontWeight: 500,
                              color: "var(--c-text2)",
                              padding: "2px 8px",
                              borderRadius: 6,
                              background: "var(--c-surface)",
                              border: "1px solid var(--c-border)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            {loc}
                            {dist != null && (
                              <span style={{
                                fontSize: 10,
                                fontWeight: 600,
                                color: distColor,
                                whiteSpace: "nowrap",
                              }}>
                                {dist < 1 ? "<1" : dist} km
                              </span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Classification fields */}
              <div style={{ padding: "20px 24px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "18px 32px",
                  }}
                >
                  <div>
                    <FieldLabel>Modified Monash</FieldLabel>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: "var(--c-text)",
                        fontFamily: "var(--font-display)",
                      }}
                    >
                      MMM {d.mmm}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--c-text3)",
                        marginTop: 2,
                      }}
                    >
                      {d.ml}
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Remoteness area</FieldLabel>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: "var(--c-text)",
                        fontFamily: "var(--font-display)",
                      }}
                    >
                      RA{d.ra}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--c-text3)",
                        marginTop: 2,
                      }}
                    >
                      {d.rl}
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Primary Health Network</FieldLabel>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: "var(--c-text)",
                        fontFamily: "var(--font-display)",
                      }}
                    >
                      {d.hn || "—"}
                    </div>
                    {d.hc && (
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--c-text3)",
                          marginTop: 2,
                        }}
                      >
                        {d.hc}
                      </div>
                    )}
                  </div>
                  {d.lhd && (
                    <div>
                      <FieldLabel>NSW Local Health District</FieldLabel>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          color: "var(--c-text)",
                          fontFamily: "var(--font-display)",
                        }}
                      >
                        {d.lhd}
                      </div>
                    </div>
                  )}
                  <div>
                    <FieldLabel>Population (ERP 2021)</FieldLabel>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: "var(--c-text)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {d.erp ? d.erp.toLocaleString() : "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Equity section */}
              <div
                style={{
                  margin: "0 24px",
                  padding: "20px 0",
                  borderTop: "1px solid var(--c-border)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 13,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--c-text3)",
                    marginBottom: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  >
                    <path d="M7 1v12M1 7h12" />
                    <circle cx="7" cy="7" r="6" />
                  </svg>
                  Equity indicators
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px 32px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--c-text2)",
                        marginBottom: 6,
                        fontWeight: 500,
                      }}
                    >
                      SEIFA disadvantage (IRSD)
                    </div>
                    <EquityBar decile={d.id} />
                    {d.id > 0 && d.id <= 2 && (
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          color: "var(--c-equity-flag)",
                          marginTop: 6,
                          padding: "3px 8px",
                          borderRadius: 6,
                          background: "var(--c-equity-flag-bg)",
                          border: "1px solid var(--c-equity-flag-border)",
                        }}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="currentColor"
                        >
                          <path d="M6 1L11 10H1L6 1Z" />
                        </svg>
                        Bottom 20% nationally
                      </div>
                    )}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--c-text2)",
                        marginBottom: 6,
                        fontWeight: 500,
                      }}
                    >
                      Indigenous population
                    </div>
                    <div
                      style={{
                        fontSize: 28,
                        fontWeight: 700,
                        fontFamily: "var(--font-mono)",
                        color: d.ip > 10 ? "var(--c-accent)" : "var(--c-text)",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {d.ip > 0 ? `${d.ip}%` : "—"}
                    </div>
                    {d.ip > 0 && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--c-text3)",
                          marginTop: 3,
                        }}
                      >
                        Census 2021 ·{" "}
                        {d.ip > 10
                          ? "Significant population"
                          : d.ip > 3
                            ? "Above national average"
                            : "Near national average"}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* NSP services in this postcode */}
              {nspCounts && (
                <div
                  style={{
                    margin: "0 24px",
                    padding: "16px 0 20px",
                    borderTop: "1px solid var(--c-border)",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 13,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "var(--c-text3)",
                      marginBottom: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="7" cy="5" r="2" />
                      <path d="M3 5a4 4 0 0 1 8 0c0 3-4 7-4 7S3 8 3 5z" />
                    </svg>
                    NSP services in this postcode
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {nspCounts.primary > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 16px", borderRadius: "var(--radius-sm)", background: "#ecfdf5", border: "1px solid rgba(5,150,105,0.2)" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: "#059669", lineHeight: 1 }}>{nspCounts.primary}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#065f46", marginTop: 3 }}>Primary NSP</span>
                      </div>
                    )}
                    {nspCounts.secondary > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 16px", borderRadius: "var(--radius-sm)", background: "#eff6ff", border: "1px solid rgba(59,130,246,0.2)" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: "#3b82f6", lineHeight: 1 }}>{nspCounts.secondary}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#1e40af", marginTop: 3 }}>Secondary</span>
                      </div>
                    )}
                    {nspCounts.pharmacy > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 16px", borderRadius: "var(--radius-sm)", background: "#fffbeb", border: "1px solid rgba(217,119,6,0.2)" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: "#d97706", lineHeight: 1 }}>{nspCounts.pharmacy}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#92400e", marginTop: 3 }}>Pharmacies</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Nearest primary NSP — shown for NSW postcodes */}
              {nearestNSP && (
                <div
                  style={{
                    margin: "0 24px",
                    padding: "14px 0 18px",
                    borderTop: "1px solid var(--c-border)",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 13,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "var(--c-text3)",
                      marginBottom: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 7h12M9 3l4 4-4 4" />
                    </svg>
                    Nearest primary NSP
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 14px",
                      borderRadius: "var(--radius-sm)",
                      background: nearestNSP.distanceKm > 50 ? "#fef2f2" : nearestNSP.distanceKm > 20 ? "#fffbeb" : "#ecfdf5",
                      border: `1px solid ${nearestNSP.distanceKm > 50 ? "rgba(239,68,68,0.2)" : nearestNSP.distanceKm > 20 ? "rgba(217,119,6,0.2)" : "rgba(5,150,105,0.2)"}`,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: 600,
                        color: "var(--c-text)", lineHeight: 1.3,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {nearestNSP.outlet.n}
                      </div>
                      {nearestNSP.outlet.s && (
                        <div style={{ fontSize: 11, color: "var(--c-text3)", marginTop: 2 }}>
                          {nearestNSP.outlet.s}{nearestNSP.outlet.p ? ` ${nearestNSP.outlet.p}` : ""}
                        </div>
                      )}
                    </div>
                    <div style={{
                      fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 700,
                      color: nearestNSP.distanceKm > 50 ? "#ef4444" : nearestNSP.distanceKm > 20 ? "#d97706" : "#059669",
                      whiteSpace: "nowrap",
                    }}>
                      {nearestNSP.distanceKm < 1
                        ? "< 1 km"
                        : `${nearestNSP.distanceKm} km`}
                    </div>
                  </div>
                  {nearestNSP.distanceKm > 50 && (
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      fontSize: 11, fontWeight: 600, color: "#991b1b",
                      marginTop: 6, padding: "3px 8px", borderRadius: 6,
                      background: "#fef2f2", border: "1px solid rgba(239,68,68,0.2)",
                    }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                        <path d="M6 1L11 10H1L6 1Z" />
                      </svg>
                      Service desert — over 50 km to nearest primary NSP
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ) : !q ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <EmptyState
              icon={
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <circle cx="10.5" cy="10.5" r="7" />
                  <line x1="15.5" y1="15.5" x2="21" y2="21" />
                </svg>
              }
              title="Look up any Australian postcode"
              description="Search by postcode number or suburb name to see shipping zone, health classifications, remoteness area, and equity indicators."
            />
          </motion.div>
        ) : q.trim().length >= 3 && !open ? (
          <motion.div
            key="not-found"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              style={{
                marginTop: 4,
                padding: "20px 24px",
                borderRadius: "var(--radius)",
                border: "1px dashed var(--c-border2)",
                background: "var(--c-bg2)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  color: "var(--c-text2)",
                  fontWeight: 500,
                }}
              >
                No results for{" "}
                <strong
                  style={{
                    fontFamily: /^\d+$/.test(q.trim())
                      ? "var(--font-mono)"
                      : "inherit",
                    color: "var(--c-text)",
                  }}
                >
                  {q.trim()}
                </strong>
              </div>
              <div
                style={{ fontSize: 12, color: "var(--c-text3)", marginTop: 4 }}
              >
                Try a different postcode or suburb name.
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
