import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  DATA,
  STATES,
  PHN_CODES,
  ZONE_MAP,
  ZONE_NAMES,
  ZONE_COLORS,
  irsdColor,
} from "../utils/data";
import { MetricCard, SectionLabel, HorizBar, MiniBar, Card } from "./Shared";

/* ===== Custom donut tooltip ===== */
function DonutTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div
      style={{
        background: "var(--tooltip-bg)",
        color: "var(--tooltip-text)",
        padding: "8px 14px",
        borderRadius: "var(--radius-sm)",
        fontSize: 12,
        boxShadow: "var(--shadow-md)",
        border: "none",
      }}
    >
      <div style={{ fontWeight: 600 }}>{d.name}</div>
      <div style={{ fontFamily: "var(--font-mono)", marginTop: 2 }}>
        {d.value.toLocaleString()} postcodes
      </div>
    </div>
  );
}

/* ===== Donut label ===== */
function renderDonutLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name,
}) {
  if (percent < 0.06) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      style={{
        fontSize: 11,
        fontWeight: 700,
        fontFamily: "var(--font-body)",
        textShadow: "0 1px 2px rgba(0,0,0,0.3)",
      }}
    >
      {(percent * 100).toFixed(0)}%
    </text>
  );
}

export default function Overview() {
  const stats = useMemo(() => {
    const zones = { 1: 0, 2: 0, 3: 0, 4: 0 };
    const states = {};
    const phns = {};
    const irsd = Array(11).fill(0);
    let totalPop = 0,
      popCount = 0,
      indSum = 0,
      indCount = 0;

    DATA.forEach((r) => {
      const z = ZONE_MAP[r[3]] || 0;
      if (z) zones[z]++;
      const st = STATES[r[1]];
      states[st] = (states[st] || 0) + 1;
      const phn = r[5] >= 0 ? PHN_CODES[r[5]] : "";
      if (phn) phns[phn] = (phns[phn] || 0) + 1;
      if (r[9] > 0) irsd[r[9]]++;
      if (r[7] > 0) {
        totalPop += r[7];
        popCount++;
      }
      if (r[8] > 0) {
        indSum += r[8];
        indCount++;
      }
    });

    // Derived insights
    const outerRegionalPlus = (zones[3] || 0) + (zones[4] || 0);
    const outerPct = ((outerRegionalPlus / DATA.length) * 100).toFixed(0);
    const bot20 = irsd[1] + irsd[2];
    const withIrsd = irsd.slice(1).reduce((a, b) => a + b, 0);
    const bot20pct = withIrsd > 0 ? ((bot20 / withIrsd) * 100).toFixed(0) : "0";
    const nswCount = states["NSW"] || 0;

    return {
      zones,
      states,
      phns,
      irsd,
      totalPop,
      popCount,
      avgInd: indCount > 0 ? (indSum / indCount).toFixed(1) : "0",
      indCount,
      outerPct,
      outerRegionalPlus,
      bot20pct,
      bot20,
      withIrsd,
      nswCount,
      phnCount: Object.keys(phns).length,
      stateCount: Object.keys(states).length,
    };
  }, []);

  const zoneData = [1, 2, 3, 4].map((z) => ({
    name: ZONE_NAMES[z],
    value: stats.zones[z],
    color: ZONE_COLORS[z],
  }));

  const stateData = Object.entries(stats.states)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => ({ name: k, value: v, color: "#059669" }));

  const irsdData = stats.irsd.slice(1).map((v, i) => ({
    name: String(i + 1),
    value: v,
    color: irsdColor(i + 1),
  }));

  return (
    <div>
      {/* Quick facts banner */}
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
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="8" cy="8" r="6" />
            <line x1="8" y1="5" x2="8" y2="8.5" />
            <circle cx="8" cy="11" r="0.5" fill="currentColor" />
          </svg>
          At a glance
        </div>
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.7,
            color: "var(--c-text2)",
            margin: 0,
          }}
        >
          This dataset covers{" "}
          <strong style={{ color: "var(--c-text)", fontWeight: 600 }}>
            {DATA.length.toLocaleString()}
          </strong>{" "}
          postcode records across {stats.stateCount} states and territories,
          representing{" "}
          <strong style={{ color: "var(--c-text)", fontWeight: 600 }}>
            {(stats.totalPop / 1e6).toFixed(1)}M
          </strong>{" "}
          people.{" "}
          <strong style={{ color: "var(--c-text)", fontWeight: 600 }}>
            {stats.outerPct}%
          </strong>{" "}
          of postcodes are in rural or remote areas.{" "}
          <strong style={{ color: "var(--c-equity-flag)", fontWeight: 600 }}>
            {stats.bot20pct}%
          </strong>{" "}
          fall in the most disadvantaged IRSD quintile (decile 1–2), and the
          average Indigenous population across postcodes with data is{" "}
          <strong style={{ color: "var(--c-text)", fontWeight: 600 }}>
            {stats.avgInd}%
          </strong>
          .
        </p>
      </Card>

      {/* Metric cards */}
      <div
        className="grid-4"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <MetricCard
          label="Postcodes"
          value={DATA.length.toLocaleString()}
          sub="unique postcode records"
        />
        <MetricCard
          label="PHN regions"
          value={stats.phnCount}
          sub={`across ${stats.stateCount} states`}
        />
        <MetricCard
          label="Coverage population"
          value={`${(stats.totalPop / 1e6).toFixed(1)}M`}
          sub={`${stats.popCount.toLocaleString()} postcodes with ERP`}
        />
        <MetricCard
          label="Avg Indigenous %"
          value={`${stats.avgInd}%`}
          sub={`${stats.indCount.toLocaleString()} postcodes with data`}
        />
      </div>

      {/* Zone donut + Remoteness area */}
      <div
        className="grid-2"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 8,
        }}
      >
        <Card padding={false}>
          <div style={{ padding: "20px 20px 0" }}>
            <SectionLabel style={{ marginTop: 0 }}>
              Shipping zone distribution
            </SectionLabel>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0 20px 20px",
              gap: 16,
            }}
          >
            <div style={{ width: 160, height: 160, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={zoneData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={72}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="var(--c-surface)"
                    labelLine={false}
                    label={renderDonutLabel}
                    animationDuration={700}
                    animationEasing="ease-out"
                  >
                    {zoneData.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1 }}>
              {zoneData.map((z) => (
                <div
                  key={z.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                    fontSize: 13,
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 3,
                      background: z.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      flex: 1,
                      color: "var(--c-text2)",
                      fontWeight: 500,
                    }}
                  >
                    {z.name}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontWeight: 600,
                      fontSize: 12,
                    }}
                  >
                    {z.value.toLocaleString()}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--c-text3)",
                      minWidth: 36,
                      textAlign: "right",
                    }}
                  >
                    {((z.value / DATA.length) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card padding={false}>
          <div style={{ padding: "20px 20px 16px" }}>
            <SectionLabel style={{ marginTop: 0 }}>
              Top PHN regions by postcode count
            </SectionLabel>
            <HorizBar
              items={Object.entries(stats.phns)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([k, v]) => ({
                  name: k,
                  value: v,
                  color: "var(--c-accent)",
                }))}
              total={DATA.length}
              compact
            />
          </div>
        </Card>
      </div>

      {/* State + IRSD charts */}
      <div
        className="grid-2"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
      >
        <Card padding={false}>
          <div style={{ padding: "20px 20px 4px" }}>
            <SectionLabel style={{ marginTop: 0 }}>
              Postcodes by state
            </SectionLabel>
          </div>
          <div style={{ padding: "0 12px 16px" }}>
            <MiniBar
              data={stateData}
              dataKey="value"
              nameKey="name"
              colors={stateData.map(() => "#059669")}
            />
          </div>
        </Card>

        <Card padding={false}>
          <div style={{ padding: "20px 20px 4px" }}>
            <SectionLabel style={{ marginTop: 0 }}>
              IRSD decile distribution
            </SectionLabel>
          </div>
          <div style={{ padding: "0 12px 8px" }}>
            <MiniBar
              data={irsdData}
              dataKey="value"
              nameKey="name"
              colors={irsdData.map((d) => d.color)}
              height={180}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 10,
              color: "var(--c-text3)",
              padding: "0 20px 16px",
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
    </div>
  );
}
