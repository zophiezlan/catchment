import { motion, AnimatePresence } from "framer-motion";
import {
  getLocalities,
  ZONE_COLORS,
  ZONE_COLORS_LIGHT,
  ZONE_COLORS_TEXT,
} from "../utils/data";
import { Pill, EquityBar, FieldLabel, Card, EmptyState } from "./Shared";
import { useLookupState } from "./useLookupState";

export default function Lookup() {
  const {
    q,
    res,
    sugg,
    open,
    si,
    hint,
    iRef,
    d,
    multiState,
    nspCounts,
    nearestNSP,
    nearestOTP,
    nearestACCHS,
    suburbDistances,
    acchsHere,
    otpHere,
    seifa,
    doSearch,
    pick,
    clearSearch,
    handleKey,
    setOpen,
    setSi,
  } = useLookupState();

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
              onClick={clearSearch}
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
              color: "var(--c-warning)",
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
                          ? dist > 50 ? "var(--c-negative)" : dist > 20 ? "var(--c-warning)" : "var(--c-positive)"
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
                    {seifa && (
                      <div style={{
                        marginTop: 10,
                        paddingTop: 10,
                        borderTop: "1px dashed var(--c-border)",
                        display: "flex", flexDirection: "column", gap: 6,
                      }}>
                        {[
                          { key: "irsad", label: "IRSAD" },
                          { key: "ier",   label: "IER" },
                          { key: "ieo",   label: "IEO" },
                        ].map(({ key, label }) => {
                          const dec = seifa[key];
                          return (
                            <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span
                                title={key.toUpperCase() === "IRSAD"
                                  ? "Relative Socio-economic Advantage and Disadvantage"
                                  : key.toUpperCase() === "IER"
                                    ? "Index of Economic Resources"
                                    : "Index of Education and Occupation"}
                                style={{
                                  fontSize: 10, fontWeight: 700, letterSpacing: "0.05em",
                                  color: "var(--c-text3)", minWidth: 42,
                                  fontFamily: "var(--font-body)",
                                  cursor: "help",
                                }}>
                                {label}
                              </span>
                              <div style={{ flex: 1 }}>
                                <EquityBar decile={dec > 0 ? dec : null} compact />
                              </div>
                            </div>
                          );
                        })}
                        {seifa.caution && (
                          <div style={{
                            fontSize: 10, color: "var(--c-text3)",
                            fontStyle: "italic", marginTop: 2,
                          }}>
                            ABS: use with caution — area not well represented by SA1s
                          </div>
                        )}
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
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 16px", borderRadius: "var(--radius-sm)", background: "var(--c-zone2-bg)", border: "1px solid rgba(5,150,105,0.2)" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: "var(--c-accent)", lineHeight: 1 }}>{nspCounts.primary}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--c-zone2-text)", marginTop: 3 }}>Primary NSP</span>
                      </div>
                    )}
                    {nspCounts.secondary > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 16px", borderRadius: "var(--radius-sm)", background: "var(--c-info-bg)", border: "1px solid var(--c-info-border)" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: "var(--c-info)", lineHeight: 1 }}>{nspCounts.secondary}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--c-info-text)", marginTop: 3 }}>Secondary</span>
                      </div>
                    )}
                    {nspCounts.pharmacy > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 16px", borderRadius: "var(--radius-sm)", background: "var(--c-warning-bg)", border: "1px solid var(--c-warning-border)" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: "var(--c-warning)", lineHeight: 1 }}>{nspCounts.pharmacy}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--c-warning-text)", marginTop: 3 }}>Pharmacies</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* OTP sites in this postcode (pharmacies + public clinics) */}
              {otpHere && (
                <div
                  style={{
                    margin: "0 24px",
                    padding: "14px 0 16px",
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
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#c2410c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="2" width="8" height="10" rx="1.5" />
                      <path d="M5 5h4M5 7h4M5 9h2" />
                    </svg>
                    Opioid Treatment Program sites
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: otpHere.sites.length > 0 ? 10 : 0 }}>
                    {otpHere.pharmacy > 0 && (
                      <div style={{
                        display: "flex", flexDirection: "column", alignItems: "center",
                        padding: "8px 14px", borderRadius: "var(--radius-sm)",
                        background: "#fff7ed", border: "1px solid #fed7aa",
                      }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 700, color: "#c2410c", lineHeight: 1 }}>
                          {otpHere.pharmacy}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#9a3412", marginTop: 3 }}>
                          {otpHere.pharmacy === 1 ? "Pharmacy" : "Pharmacies"}
                        </span>
                      </div>
                    )}
                    {otpHere.clinic > 0 && (
                      <div style={{
                        display: "flex", flexDirection: "column", alignItems: "center",
                        padding: "8px 14px", borderRadius: "var(--radius-sm)",
                        background: "#fff7ed", border: "1px solid #fdba74",
                      }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 700, color: "#9a3412", lineHeight: 1 }}>
                          {otpHere.clinic}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#7c2d12", marginTop: 3 }}>
                          Public clinic{otpHere.clinic === 1 ? "" : "s"}
                        </span>
                      </div>
                    )}
                    {otpHere.laib > 0 && (
                      <div
                        title="Long-acting injectable buprenorphine — monthly injection alternative to daily dosing"
                        style={{
                          display: "flex", flexDirection: "column", alignItems: "center",
                          padding: "8px 14px", borderRadius: "var(--radius-sm)",
                          background: "#fffbeb", border: "1px solid #fde68a",
                          cursor: "help",
                        }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 700, color: "#a16207", lineHeight: 1 }}>
                          {otpHere.laib}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#854d0e", marginTop: 3 }}>
                          LAIB
                        </span>
                      </div>
                    )}
                  </div>
                  {otpHere.sites.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {otpHere.sites.slice(0, 4).map((s, i) => (
                        <div
                          key={i}
                          style={{
                            padding: "6px 10px",
                            borderRadius: "var(--radius-sm)",
                            background: "#fff7ed",
                            border: "1px solid #fed7aa",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 12, fontWeight: 600, color: "var(--c-text)",
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>
                              {s.n}
                            </div>
                            {s.a && s.a !== s.n && (
                              <div style={{ fontSize: 10, color: "var(--c-text3)", marginTop: 1 }}>
                                {s.a}
                              </div>
                            )}
                          </div>
                          {s.sv?.includes("laib") && (
                            <span
                              title="Also offers long-acting injectable buprenorphine"
                              style={{
                                fontSize: 9, fontWeight: 700, letterSpacing: "0.05em",
                                padding: "2px 5px", borderRadius: 4,
                                background: "#fffbeb", color: "#a16207",
                                border: "1px solid #fde68a",
                              }}
                            >
                              LAIB
                            </span>
                          )}
                          {s.t === "public-clinic" && (
                            <span style={{
                              fontSize: 9, fontWeight: 700, letterSpacing: "0.05em",
                              padding: "2px 5px", borderRadius: 4,
                              background: "#fff7ed", color: "#9a3412",
                              border: "1px solid #fdba74",
                            }}>
                              CLINIC
                            </span>
                          )}
                        </div>
                      ))}
                      {otpHere.sites.length > 4 && (
                        <div style={{ fontSize: 11, color: "var(--c-text3)", marginTop: 2, fontStyle: "italic" }}>
                          + {otpHere.sites.length - 4} more in this postcode — see Map tab for full view
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ACCHS in this postcode */}
              {acchsHere && (
                <div
                  style={{
                    margin: "0 24px",
                    padding: "14px 0 16px",
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
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#7c3aed" strokeWidth="1.5">
                      <circle cx="7" cy="7" r="5.5" />
                      <circle cx="7" cy="7" r="2" fill="#7c3aed" stroke="none" />
                    </svg>
                    Aboriginal community controlled health services
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {acchsHere.map((s, i) => (
                      <div key={i} style={{
                        padding: "8px 12px",
                        borderRadius: "var(--radius-sm)",
                        background: "#faf5ff",
                        border: "1px solid #e9d5ff",
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text)", lineHeight: 1.3 }}>
                          {s.n}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--c-text3)", marginTop: 2 }}>
                          {[s.a, s.s].filter(Boolean).join(", ")}
                        </div>
                        {s.sv?.length > 0 && (
                          <div style={{ fontSize: 10, color: "#7c3aed", marginTop: 3, fontWeight: 500 }}>
                            {s.sv.slice(0, 4).join(" · ")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nearest services — primary NSP / OTP / ACCHS for NSW postcodes */}
              {(nearestNSP || nearestOTP || nearestACCHS) && (
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
                    Nearest services
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {[
                      { key: "nsp",   label: "Primary NSP", swatch: "#059669", result: nearestNSP },
                      { key: "otp",   label: "OTP site",    swatch: "#ea580c", result: nearestOTP },
                      { key: "acchs", label: "ACCHS",       swatch: "#7c3aed", result: nearestACCHS },
                    ].filter(r => r.result).map(({ key, label, swatch, result }) => {
                      const km = result.distanceKm;
                      const far = km > 50;
                      const warn = km > 20 && !far;
                      return (
                        <div key={key}
                          style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "10px 14px",
                            borderRadius: "var(--radius-sm)",
                            background: far ? "var(--c-error-bg)" : warn ? "var(--c-warning-bg)" : "var(--c-zone2-bg)",
                            border: `1px solid ${far ? "var(--c-error-border)" : warn ? "var(--c-warning-border)" : "rgba(5,150,105,0.2)"}`,
                          }}
                        >
                          <span aria-hidden style={{
                            width: 8, height: 8, borderRadius: "50%",
                            background: swatch, flexShrink: 0,
                          }} />
                          <div style={{ width: 78, flexShrink: 0, fontSize: 11, fontWeight: 600, color: "var(--c-text3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            {label}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 13, fontWeight: 600,
                              color: "var(--c-text)", lineHeight: 1.3,
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>
                              {result.outlet.n}
                            </div>
                            {result.outlet.s && (
                              <div style={{ fontSize: 11, color: "var(--c-text3)", marginTop: 2 }}>
                                {result.outlet.s}{result.outlet.p ? ` ${result.outlet.p}` : ""}
                              </div>
                            )}
                          </div>
                          <div style={{
                            fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 700,
                            color: far ? "var(--c-negative)" : warn ? "var(--c-warning)" : "var(--c-positive)",
                            whiteSpace: "nowrap",
                          }}>
                            {km < 1 ? "< 1 km" : `${km} km`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {nearestNSP && nearestNSP.distanceKm > 50 && (
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      fontSize: 11, fontWeight: 600, color: "var(--c-error-text)",
                      marginTop: 8, padding: "3px 8px", borderRadius: 6,
                      background: "var(--c-error-bg)", border: "1px solid var(--c-error-border)",
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
