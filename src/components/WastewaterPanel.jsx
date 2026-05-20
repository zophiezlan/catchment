import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, SectionLabel } from "./Shared";
import {
  WW_SOURCE,
  WW_DRUG_COLORS,
  WW_DRUG_LABELS,
  WW_SITE_HIGHLIGHTS,
  WW_NATIONAL,
  buildTrendSeries,
  getNswSummary,
} from "../utils/wastewater";

function ChangePill({ pct }) {
  const up = pct >= 0;
  const color = pct >= 40
    ? "var(--c-negative)"
    : pct >= 20
      ? "var(--c-warning)"
      : pct >= 0
        ? "var(--c-text2)"
        : "var(--c-positive)";
  return (
    <span style={{
      fontFamily: "var(--font-mono)",
      fontSize: 12,
      fontWeight: 700,
      color,
      whiteSpace: "nowrap",
    }}>
      {up ? "▲" : "▼"} {Math.abs(pct)}%
    </span>
  );
}

function DrugCard({ d }) {
  return (
    <div style={{
      padding: "14px 16px",
      borderRadius: "var(--radius)",
      border: "1px solid var(--c-border)",
      background: "var(--c-surface)",
      boxShadow: "var(--shadow-xs)",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: 2, background: d.color,
      }} />
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        marginBottom: 6,
      }}>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
          textTransform: "uppercase", color: "var(--c-text3)",
        }}>
          {d.label}
        </span>
        <ChangePill pct={d.pctChange} />
      </div>
      <div style={{
        fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700,
        color: "var(--c-text)", letterSpacing: "-0.02em",
      }}>
        {d.y9Kg.toLocaleString()} <span style={{ fontSize: 12, fontWeight: 500, color: "var(--c-text3)" }}>kg/yr</span>
      </div>
      <div style={{ fontSize: 11, color: "var(--c-text3)", marginTop: 4 }}>
        {d.nationalShare}% of national consumption
      </div>
    </div>
  );
}

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--tooltip-bg)",
      color: "var(--tooltip-text)",
      padding: "10px 14px",
      borderRadius: "var(--radius-sm)",
      fontSize: 12,
      boxShadow: "var(--shadow-md)",
      border: "none",
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6, fontFamily: "var(--font-mono)" }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{
          display: "flex", justifyContent: "space-between", gap: 16,
          fontFamily: "var(--font-mono)", marginTop: 2,
        }}>
          <span style={{ color: p.color }}>{WW_DRUG_LABELS[p.dataKey]}</span>
          <span>{p.value.toLocaleString()} kg</span>
        </div>
      ))}
    </div>
  );
}

export default function WastewaterPanel() {
  const summary = useMemo(getNswSummary, []);
  const trend = useMemo(buildTrendSeries, []);

  return (
    <Card padding={false} style={{ marginBottom: 24 }}>
      <div style={{ padding: "18px 22px 4px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 4 }}>
          <SectionLabel style={{ marginTop: 0, flex: 1 }}>
            NSW demand signal — wastewater drug consumption
          </SectionLabel>
          <span style={{
            fontSize: 10, fontWeight: 600, color: "var(--c-text3)",
            fontFamily: "var(--font-body)", whiteSpace: "nowrap",
            padding: "2px 8px", borderRadius: 100,
            background: "var(--c-bg3)", border: "1px solid var(--c-border)",
          }}>
            {WW_SOURCE.report} · {WW_SOURCE.samplingPeriod}
          </span>
        </div>
        <div style={{
          fontSize: 12, color: "var(--c-text3)", lineHeight: 1.5,
          marginBottom: 14, maxWidth: 720,
        }}>
          NSW share of national consumption for each drug, latest reporting year. Direction is Year 8 → Year 9.
        </div>
      </div>

      {/* Drug cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 10,
        padding: "0 20px 16px",
      }} className="grid-4">
        {summary.map(d => <DrugCard key={d.drug} d={d} />)}
      </div>

      {/* Trend chart */}
      <div style={{
        padding: "14px 16px 6px",
        borderTop: "1px solid var(--c-border)",
        background: "var(--c-bg2)",
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.06em", color: "var(--c-text3)",
          marginBottom: 6, padding: "0 6px",
        }}>
          NSW consumption (kg/year), 2016–17 to 2024–25
        </div>
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            <LineChart data={trend} margin={{ top: 8, right: 16, left: -8, bottom: 4 }}>
              <CartesianGrid stroke="var(--c-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="yearLabel"
                tick={{ fontSize: 10, fill: "var(--c-text3)", fontFamily: "var(--font-mono)" }}
                stroke="var(--c-border2)"
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--c-text3)", fontFamily: "var(--font-mono)" }}
                stroke="var(--c-border2)"
                tickLine={false}
                tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}t` : v}
              />
              <Tooltip content={<TrendTooltip />} />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-body)", paddingTop: 4 }}
                formatter={(v) => WW_DRUG_LABELS[v]}
              />
              {Object.entries(WW_DRUG_COLORS).map(([drug, color]) => (
                <Line
                  key={drug}
                  type="monotone"
                  dataKey={drug}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: color }}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer — qualitative findings + source */}
      <div style={{
        padding: "12px 22px 14px",
        borderTop: "1px solid var(--c-border)",
        fontSize: 11, color: "var(--c-text3)", lineHeight: 1.55,
      }}>
        <div style={{ marginBottom: 6 }}>
          <strong style={{ color: "var(--c-text2)" }}>NSW-specific findings:</strong>{" "}
          {WW_SITE_HIGHLIGHTS.fentanyl}
        </div>
        <div style={{ marginBottom: 6 }}>
          National Y9 totals: methylamphetamine{" "}
          <strong style={{ fontFamily: "var(--font-mono)", color: "var(--c-text2)" }}>
            {(WW_NATIONAL.y9TotalKg.methylamphetamine/1000).toFixed(1)}t
          </strong>{" "}
          (+{WW_NATIONAL.y9PctChange.methylamphetamine}%), cocaine{" "}
          <strong style={{ fontFamily: "var(--font-mono)", color: "var(--c-text2)" }}>
            {(WW_NATIONAL.y9TotalKg.cocaine/1000).toFixed(1)}t
          </strong>{" "}
          (+{WW_NATIONAL.y9PctChange.cocaine}%), MDMA{" "}
          <strong style={{ fontFamily: "var(--font-mono)", color: "var(--c-text2)" }}>
            {(WW_NATIONAL.y9TotalKg.mdma/1000).toFixed(1)}t
          </strong>{" "}
          (+{WW_NATIONAL.y9PctChange.mdma}%), heroin{" "}
          <strong style={{ fontFamily: "var(--font-mono)", color: "var(--c-text2)" }}>
            {(WW_NATIONAL.y9TotalKg.heroin/1000).toFixed(1)}t
          </strong>{" "}
          (+{WW_NATIONAL.y9PctChange.heroin}%).
        </div>
        <div>
          Source:{" "}
          <a href={WW_SOURCE.url}
            target="_blank" rel="noreferrer"
            style={{ color: "var(--c-accent)", textDecoration: "none" }}>
            {WW_SOURCE.issuer} — {WW_SOURCE.name}, {WW_SOURCE.report}
          </a>
        </div>
      </div>
    </Card>
  );
}
