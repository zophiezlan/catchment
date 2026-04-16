import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getLHDSummary,
  ZONE_NAMES,
  ZONE_COLORS,
  irsdColor,
  DATA,
  ZONE_MAP,
  STATES,
} from "../utils/data";
import {
  MetricCard,
  SectionLabel,
  HorizBar,
  Card,
  EquityBar,
  Pill,
} from "./Shared";

function LHDCard({ lhd, onSelect, selected }) {
  const isSelected = selected === lhd.name;
  return (
    <button
      onClick={() => onSelect(isSelected ? null : lhd.name)}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "14px 16px",
        borderRadius: "var(--radius)",
        border: `1.5px solid ${isSelected ? "var(--c-accent)" : "var(--c-border)"}`,
        background: isSelected ? "var(--c-accent-light)" : "var(--c-surface)",
        boxShadow: isSelected
          ? "0 0 0 3px var(--c-accent-muted)"
          : "var(--shadow-xs)",
        cursor: "pointer",
        transition: "all 0.2s ease",
        fontFamily: "var(--font-body)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 14,
            fontWeight: 600,
            color: "var(--c-text)",
            lineHeight: 1.3,
          }}
        >
          {lhd.name.replace(" LHD", "")}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 3,
              background: ZONE_COLORS[lhd.dominantZone],
              display: "inline-block",
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              color: "var(--c-text3)",
            }}
          >
            {lhd.postcodes}
          </span>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 8,
          fontSize: 11,
          color: "var(--c-text3)",
        }}
      >
        <span>
          Pop{" "}
          <strong
            style={{ color: "var(--c-text2)", fontFamily: "var(--font-mono)" }}
          >
            {lhd.pop > 0 ? `${(lhd.pop / 1e6).toFixed(2)}M` : "—"}
          </strong>
        </span>
        <span>
          Indig{" "}
          <strong
            style={{
              color: lhd.avgInd > 5 ? "var(--c-accent)" : "var(--c-text2)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {lhd.avgInd}%
          </strong>
        </span>
        <span>
          IRSD bot20{" "}
          <strong
            style={{
              color: lhd.bot20 > 30 ? "var(--c-equity-flag)" : "var(--c-text2)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {lhd.bot20}%
          </strong>
        </span>
      </div>
    </button>
  );
}

export default function LHDView() {
  const lhds = useMemo(() => getLHDSummary(), []);
  const [selected, setSelected] = useState(null);

  const totals = useMemo(() => {
    const nswCount = DATA.filter((r) => STATES[r[1]] === "NSW").length;
    let pop = 0,
      postcodes = 0;
    lhds.forEach((l) => {
      pop += l.pop;
      postcodes += l.postcodes;
    });
    return { nswCount, pop, postcodes, lhdCount: lhds.length };
  }, [lhds]);

  const sel = selected ? lhds.find((l) => l.name === selected) : null;

  return (
    <div>
      {/* Intro */}
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
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="2" width="12" height="12" rx="2" />
            <line x1="2" y1="6" x2="14" y2="6" />
            <line x1="6" y1="6" x2="6" y2="14" />
          </svg>
          NSW Local Health Districts
        </div>
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.7,
            color: "var(--c-text2)",
            margin: 0,
          }}
        >
          NSW is divided into{" "}
          <strong style={{ color: "var(--c-text)", fontWeight: 600 }}>
            {totals.lhdCount} Local Health Districts
          </strong>{" "}
          covering{" "}
          <strong style={{ color: "var(--c-text)", fontWeight: 600 }}>
            {totals.postcodes}
          </strong>{" "}
          postcodes and{" "}
          <strong style={{ color: "var(--c-text)", fontWeight: 600 }}>
            {(totals.pop / 1e6).toFixed(1)}M
          </strong>{" "}
          people. Select a district below to see its profile.
        </p>
      </Card>

      {/* Summary metrics */}
      <div
        className="grid-4"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <MetricCard
          label="LHDs"
          value={totals.lhdCount}
          sub="districts in NSW"
        />
        <MetricCard
          label="NSW postcodes"
          value={totals.postcodes}
          sub={`of ${totals.nswCount} total NSW`}
        />
        <MetricCard
          label="Population"
          value={`${(totals.pop / 1e6).toFixed(1)}M`}
          sub="ERP 2021"
        />
        <MetricCard
          label="Highest disadvantage"
          value={lhds
            .reduce((max, l) => (l.bot20 > max.bot20 ? l : max), lhds[0])
            .name.replace(" LHD", "")}
          sub={`${lhds.reduce((max, l) => (l.bot20 > max.bot20 ? l : max), lhds[0]).bot20}% bottom IRSD quintile`}
          accent="var(--c-equity-flag)"
        />
      </div>

      {/* LHD grid + detail panel */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: sel ? "1fr 1fr" : "1fr",
          gap: 20,
        }}
      >
        {/* LHD cards */}
        <div>
          <SectionLabel style={{ marginTop: 0 }}>All districts</SectionLabel>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 8,
            }}
          >
            {lhds.map((lhd) => (
              <LHDCard
                key={lhd.name}
                lhd={lhd}
                selected={selected}
                onSelect={setSelected}
              />
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <AnimatePresence mode="wait">
          {sel && (
            <motion.div
              key={sel.name}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
            >
              <SectionLabel style={{ marginTop: 0 }}>
                {sel.name.replace(" LHD", "")} — Detail
              </SectionLabel>
              <Card padding={false}>
                {/* Header */}
                <div
                  style={{
                    padding: "18px 20px",
                    borderBottom: "1px solid var(--c-border)",
                    background: "var(--c-bg2)",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 18,
                      fontWeight: 700,
                      color: "var(--c-text)",
                      marginBottom: 6,
                    }}
                  >
                    {sel.name}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Pill>{sel.postcodes} postcodes</Pill>
                    <Pill>
                      {sel.pop > 0
                        ? `${(sel.pop / 1e6).toFixed(2)}M pop`
                        : "No pop data"}
                    </Pill>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ padding: "16px 20px" }}>
                  <div
                    className="grid-2"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 16,
                      marginBottom: 16,
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
                        SEIFA disadvantage (median)
                      </div>
                      <EquityBar decile={sel.medianIrsd} />
                      {sel.bot20 > 30 && (
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
                          {sel.bot20}% in bottom quintile
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
                        Avg Indigenous population
                      </div>
                      <div
                        style={{
                          fontSize: 28,
                          fontWeight: 700,
                          fontFamily: "var(--font-mono)",
                          color:
                            sel.avgInd > 5
                              ? "var(--c-accent)"
                              : "var(--c-text)",
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {sel.avgInd > 0 ? `${sel.avgInd}%` : "—"}
                      </div>
                    </div>
                  </div>

                  {/* Zone breakdown */}
                  <SectionLabel>Zone breakdown</SectionLabel>
                  <HorizBar
                    items={[1, 2, 3, 4]
                      .filter((z) => sel.zones[z] > 0)
                      .map((z) => ({
                        name: ZONE_NAMES[z],
                        value: sel.zones[z],
                        color: ZONE_COLORS[z],
                      }))}
                    total={sel.postcodes}
                    compact
                  />

                  {/* IRSD breakdown */}
                  <SectionLabel>IRSD decile spread</SectionLabel>
                  <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
                    {sel.irsd.slice(1).map((v, i) => {
                      const pct =
                        sel.postcodes > 0 ? (v / sel.postcodes) * 100 : 0;
                      return (
                        <div
                          key={i}
                          title={`Decile ${i + 1}: ${v} postcodes`}
                          style={{
                            flex: Math.max(pct, 1),
                            height: 24,
                            borderRadius: 4,
                            background:
                              v > 0 ? irsdColor(i + 1) : "var(--c-border)",
                            opacity: v > 0 ? 1 : 0.2,
                            transition: "all 0.3s ease",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {pct > 8 && (
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 700,
                                color: "white",
                                textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                              }}
                            >
                              {v}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 10,
                      color: "var(--c-text3)",
                      fontWeight: 500,
                    }}
                  >
                    <span>Most disadvantaged</span>
                    <span>Least disadvantaged</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
