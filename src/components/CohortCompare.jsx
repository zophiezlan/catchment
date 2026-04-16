import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ZONE_NAMES, ZONE_COLORS, irsdColor } from "../utils/data";
import { Card, SectionLabel, Pill } from "./Shared";

function Delta({ a, b, suffix = "", flip = false, mono = true }) {
  if (a == null || b == null) return null;
  const diff = b - a;
  if (diff === 0)
    return (
      <span
        style={{
          fontSize: 11,
          color: "var(--c-text3)",
          fontFamily: mono ? "var(--font-mono)" : "inherit",
        }}
      >
        —
      </span>
    );
  const positive = flip ? diff < 0 : diff > 0;
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        fontFamily: "var(--font-mono)",
        color: positive ? "#059669" : "#dc2626",
      }}
    >
      {diff > 0 ? "+" : ""}
      {typeof a === "number" && !Number.isInteger(diff)
        ? diff.toFixed(1)
        : diff}
      {suffix}
    </span>
  );
}

function CompareMetric({ label, aVal, bVal, suffix = "", note }) {
  return (
    <div
      style={{
        padding: "14px 0",
        borderBottom: "1px solid var(--c-border)",
        display: "grid",
        gridTemplateColumns: "1fr 90px 90px 70px",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--c-text2)" }}>
          {label}
        </div>
        {note && (
          <div style={{ fontSize: 11, color: "var(--c-text3)", marginTop: 1 }}>
            {note}
          </div>
        )}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontWeight: 600,
          fontSize: 14,
          textAlign: "center",
          color: "var(--c-text)",
        }}
      >
        {aVal}
        {suffix}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontWeight: 600,
          fontSize: 14,
          textAlign: "center",
          color: "var(--c-text)",
        }}
      >
        {bVal}
        {suffix}
      </div>
      <div style={{ textAlign: "center" }}>
        <Delta a={Number(aVal)} b={Number(bVal)} suffix={suffix} />
      </div>
    </div>
  );
}

function ZoneCompareBar({ zone, aVal, aTotal, bVal, bTotal }) {
  const aPct = aTotal > 0 ? (aVal / aTotal) * 100 : 0;
  const bPct = bTotal > 0 ? (bVal / bTotal) * 100 : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 4,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: 3,
            background: ZONE_COLORS[zone],
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "var(--c-text2)",
            flex: 1,
          }}
        >
          {ZONE_NAMES[zone]}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--c-text3)",
            minWidth: 50,
            textAlign: "right",
          }}
        >
          {aPct.toFixed(0)}%
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--c-text3)",
            minWidth: 50,
            textAlign: "right",
          }}
        >
          {bPct.toFixed(0)}%
        </span>
        <Delta a={Math.round(aPct)} b={Math.round(bPct)} suffix="pp" />
      </div>
      <div style={{ display: "flex", gap: 4, height: 6 }}>
        <div
          style={{
            flex: 1,
            background: "var(--c-bg3)",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${aPct}%`,
              height: "100%",
              background: ZONE_COLORS[zone],
              borderRadius: 3,
              opacity: 0.7,
              transition: "width 0.4s ease",
            }}
          />
        </div>
        <div
          style={{
            flex: 1,
            background: "var(--c-bg3)",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${bPct}%`,
              height: "100%",
              background: ZONE_COLORS[zone],
              borderRadius: 3,
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function IRSDCompareStrip({ label, irsd, total }) {
  const counts = irsd.slice(1);
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--c-text3)",
          marginBottom: 4,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          height: 16,
          borderRadius: 4,
          overflow: "hidden",
          gap: 1,
        }}
      >
        {counts.map((v, i) => {
          const pct = total > 0 ? (v / total) * 100 : 0;
          return pct > 0 ? (
            <div
              key={i}
              style={{
                width: `${pct}%`,
                background: irsdColor(i + 1),
                minWidth: pct > 0 ? 2 : 0,
                transition: "width 0.4s ease",
              }}
              title={`Decile ${i + 1}: ${v} (${pct.toFixed(0)}%)`}
            />
          ) : null;
        })}
      </div>
    </div>
  );
}

export default function CohortCompare({ cohortA, cohortB, onClose }) {
  const a = cohortA?.results;
  const b = cohortB?.results;

  if (!a || !b) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Header */}
      <Card
        style={{
          marginBottom: 16,
          padding: "16px 20px",
          background:
            "linear-gradient(135deg, rgba(59, 130, 246, 0.06), rgba(5, 150, 105, 0.06))",
          borderColor: "rgba(59, 130, 246, 0.15)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 14,
                fontWeight: 700,
                color: "var(--c-text)",
                marginBottom: 4,
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
                <rect x="1" y="2" width="5.5" height="12" rx="1" />
                <rect x="9.5" y="2" width="5.5" height="12" rx="1" />
                <path d="M6.5 8H9.5" strokeDasharray="2 2" />
              </svg>
              Cohort comparison
            </div>
            <div style={{ fontSize: 12, color: "var(--c-text3)" }}>
              Comparing{" "}
              <strong style={{ color: "var(--c-text2)" }}>
                {cohortA.name}
              </strong>{" "}
              vs{" "}
              <strong style={{ color: "var(--c-text2)" }}>
                {cohortB.name}
              </strong>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: "8px 14px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--c-border)",
              background: "var(--c-surface)",
              color: "var(--c-text2)",
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "var(--font-body)",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M2 2l8 8M10 2l-8 8" />
            </svg>
            Close
          </button>
        </div>
      </Card>

      {/* Key metrics table */}
      <Card style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 90px 90px 70px",
            gap: 8,
            paddingBottom: 10,
            borderBottom: "2px solid var(--c-border)",
            marginBottom: 2,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--c-text3)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Metric
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--c-text3)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              textAlign: "center",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={cohortA.name}
          >
            {cohortA.name.length > 10
              ? cohortA.name.slice(0, 9) + "..."
              : cohortA.name}
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--c-text3)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              textAlign: "center",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={cohortB.name}
          >
            {cohortB.name.length > 10
              ? cohortB.name.slice(0, 9) + "..."
              : cohortB.name}
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--c-text3)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              textAlign: "center",
            }}
          >
            Delta
          </div>
        </div>

        <CompareMetric
          label="Postcodes matched"
          aVal={a.matchCount}
          bVal={b.matchCount}
        />
        <CompareMetric
          label="PHN regions"
          aVal={Object.keys(a.phns).length}
          bVal={Object.keys(b.phns).length}
        />
        <CompareMetric
          label="States"
          aVal={Object.keys(a.states).length}
          bVal={Object.keys(b.states).length}
        />
        <CompareMetric
          label="Bottom 20% IRSD"
          aVal={a.bot20pct}
          bVal={b.bot20pct}
          suffix="%"
          note="Decile 1-2 share"
        />
        <CompareMetric
          label="Avg Indigenous %"
          aVal={a.avgInd}
          bVal={b.avgInd}
          suffix="%"
        />
        <CompareMetric
          label="Population coverage"
          aVal={a.popTot > 0 ? (a.popTot / 1e6).toFixed(2) : "0"}
          bVal={b.popTot > 0 ? (b.popTot / 1e6).toFixed(2) : "0"}
          suffix="M"
        />
      </Card>

      {/* Zone comparison */}
      <div
        className="grid-2"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <Card>
          <SectionLabel style={{ marginTop: 0 }}>
            Zone distribution
          </SectionLabel>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr 50px 50px 50px",
              gap: "4px 8px",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <div />
            <div />
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--c-text3)",
                textAlign: "right",
              }}
            >
              A
            </div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--c-text3)",
                textAlign: "right",
              }}
            >
              B
            </div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--c-text3)",
                textAlign: "center",
              }}
            ></div>
          </div>
          {[1, 2, 3, 4].map((z) => {
            const aPct = a.total > 0 ? ((a.zones[z] || 0) / a.total) * 100 : 0;
            const bPct = b.total > 0 ? ((b.zones[z] || 0) / b.total) * 100 : 0;
            return (
              <div
                key={z}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr 50px 50px 50px",
                  gap: "0 8px",
                  alignItems: "center",
                  padding: "6px 0",
                  borderBottom: z < 4 ? "1px solid var(--c-border)" : "none",
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 3,
                    background: ZONE_COLORS[z],
                  }}
                />
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--c-text2)",
                  }}
                >
                  {ZONE_NAMES[z]}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    textAlign: "right",
                    color: "var(--c-text)",
                  }}
                >
                  {aPct.toFixed(0)}%
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    textAlign: "right",
                    color: "var(--c-text)",
                  }}
                >
                  {bPct.toFixed(0)}%
                </div>
                <div style={{ textAlign: "center" }}>
                  <Delta
                    a={Math.round(aPct)}
                    b={Math.round(bPct)}
                    suffix="pp"
                  />
                </div>
              </div>
            );
          })}
        </Card>

        {/* IRSD comparison */}
        <Card>
          <SectionLabel style={{ marginTop: 0 }}>IRSD profile</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <IRSDCompareStrip
              label={cohortA.name}
              irsd={a.irsd}
              total={a.total}
            />
            <IRSDCompareStrip
              label={cohortB.name}
              irsd={b.irsd}
              total={b.total}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 10,
              color: "var(--c-text3)",
              marginTop: 10,
              fontWeight: 500,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: irsdColor(1),
                }}
              />
              Most disadvantaged
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              Least disadvantaged
              <span
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: irsdColor(10),
                }}
              />
            </span>
          </div>
        </Card>
      </div>

      {/* States comparison */}
      <Card style={{ marginBottom: 16 }}>
        <SectionLabel style={{ marginTop: 0 }}>States represented</SectionLabel>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(() => {
            const allStates = new Set([
              ...Object.keys(a.states),
              ...Object.keys(b.states),
            ]);
            return [...allStates].sort().map((st) => {
              const inA = st in a.states;
              const inB = st in b.states;
              return (
                <Pill
                  key={st}
                  bg={
                    inA && inB
                      ? "var(--c-bg3)"
                      : inA
                        ? "rgba(59, 130, 246, 0.1)"
                        : "rgba(5, 150, 105, 0.1)"
                  }
                >
                  <span style={{ fontWeight: 700 }}>{st}</span>
                  <span
                    style={{
                      marginLeft: 5,
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      opacity: 0.7,
                    }}
                  >
                    {inA ? a.states[st] : "—"} / {inB ? b.states[st] : "—"}
                  </span>
                </Pill>
              );
            });
          })()}
        </div>
        <div style={{ fontSize: 10, color: "var(--c-text3)", marginTop: 8 }}>
          Counts shown as A / B
        </div>
      </Card>

      {/* PHN comparison */}
      <Card>
        <SectionLabel style={{ marginTop: 0 }}>PHN regions</SectionLabel>
        <div style={{ fontSize: 12 }}>
          {(() => {
            const allPHNs = new Set([
              ...Object.keys(a.phns),
              ...Object.keys(b.phns),
            ]);
            const sorted = [...allPHNs].sort((x, y) => {
              const total = (v) => (a.phns[v] || 0) + (b.phns[v] || 0);
              return total(y) - total(x);
            });
            return sorted.slice(0, 12).map((phn) => {
              const aV = a.phns[phn] || 0;
              const bV = b.phns[phn] || 0;
              const aPct = a.total > 0 ? (aV / a.total) * 100 : 0;
              const bPct = b.total > 0 ? (bV / b.total) * 100 : 0;
              return (
                <div
                  key={phn}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 60px 60px 50px",
                    gap: 8,
                    alignItems: "center",
                    padding: "7px 0",
                    borderBottom: "1px solid var(--c-border)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "var(--c-text2)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {phn}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      textAlign: "right",
                      color: "var(--c-text)",
                    }}
                  >
                    {aV}{" "}
                    <span style={{ color: "var(--c-text3)" }}>
                      ({aPct.toFixed(0)}%)
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      textAlign: "right",
                      color: "var(--c-text)",
                    }}
                  >
                    {bV}{" "}
                    <span style={{ color: "var(--c-text3)" }}>
                      ({bPct.toFixed(0)}%)
                    </span>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <Delta a={aV} b={bV} />
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </Card>
    </motion.div>
  );
}
