import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  DATA,
  STATES,
  PHN_CODES,
  ZONE_MAP,
  ZONE_NAMES,
  ZONE_COLORS,
  RA_LABELS,
  irsdColor,
} from "../utils/data";
import { MetricCard, SectionLabel, HorizBar, MiniBar, Card } from "./Shared";

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

function renderDonutLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
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

function EquityRow({ zone, color, label, postcodes, bot20, total }) {
  const rate = total > 0 ? ((bot20 / total) * 100).toFixed(0) : "—";
  const barW = total > 0 ? (bot20 / total) * 100 : 0;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr 58px 48px 1fr",
        gap: 10,
        alignItems: "center",
        padding: "9px 0",
        borderBottom: "1px solid var(--c-border)",
      }}
    >
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: 3,
          background: color,
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: 12, fontWeight: 500, color: "var(--c-text2)" }}>
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--c-text3)",
          textAlign: "right",
        }}
      >
        {bot20}/{total}
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          fontWeight: 700,
          textAlign: "right",
          color:
            Number(rate) >= 30
              ? "var(--c-negative)"
              : Number(rate) >= 20
                ? "var(--c-warning)"
                : "var(--c-text)",
        }}
      >
        {rate}%
      </span>
      <div
        style={{
          height: 8,
          background: "var(--c-bg3)",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${barW}%`,
            height: "100%",
            borderRadius: 4,
            background:
              Number(rate) >= 30
                ? "var(--c-negative)"
                : Number(rate) >= 20
                  ? "var(--c-warning)"
                  : "var(--c-accent)",
            transition: "width 0.5s ease",
          }}
        />
      </div>
    </div>
  );
}

function IndBucket({ label, count, total, color }) {
  const pct = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 0",
        borderBottom: "1px solid var(--c-border)",
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "var(--c-text2)",
          flex: 1,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          fontWeight: 700,
          color,
          minWidth: 40,
          textAlign: "right",
        }}
      >
        {count.toLocaleString()}
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
        {pct}%
      </span>
    </div>
  );
}

export default function Overview() {
  const stats = useMemo(() => {
    const zones = { 1: 0, 2: 0, 3: 0, 4: 0 };
    const popByZone = { 1: 0, 2: 0, 3: 0, 4: 0 };
    const states = {};
    const phns = {};
    const irsd = Array(11).fill(0);
    const ras = {};
    const irsdByZone = {
      1: { bot20: 0, total: 0 },
      2: { bot20: 0, total: 0 },
      3: { bot20: 0, total: 0 },
      4: { bot20: 0, total: 0 },
    };
    let totalPop = 0,
      popCount = 0,
      indSum = 0,
      indCount = 0;
    let indAbove3 = 0,
      indAbove10 = 0,
      indAbove20 = 0;
    let withPop = 0,
      withIrsd = 0,
      withInd = 0,
      withAll = 0;

    DATA.forEach((r) => {
      const z = ZONE_MAP[r[3]] || 0;
      if (z) {
        zones[z]++;
        if (r[7] > 0) popByZone[z] += r[7];
      }
      const st = STATES[r[1]];
      states[st] = (states[st] || 0) + 1;
      const phn = r[5] >= 0 ? PHN_CODES[r[5]] : "";
      if (phn) phns[phn] = (phns[phn] || 0) + 1;
      const ra = r[4];
      if (ra) {
        const rl = RA_LABELS[ra] || `RA${ra}`;
        ras[rl] = (ras[rl] || 0) + 1;
      }
      if (r[9] > 0) {
        irsd[r[9]]++;
        withIrsd++;
        if (z) {
          irsdByZone[z].total++;
          if (r[9] <= 2) irsdByZone[z].bot20++;
        }
      }
      if (r[7] > 0) {
        totalPop += r[7];
        popCount++;
        withPop++;
      }
      if (r[8] > 0) {
        indSum += r[8];
        indCount++;
        withInd++;
        if (r[8] >= 3) indAbove3++;
        if (r[8] >= 10) indAbove10++;
        if (r[8] >= 20) indAbove20++;
      }
      if (r[7] > 0 && r[9] > 0 && r[8] > 0) withAll++;
    });

    const outerRegionalPlus = (zones[3] || 0) + (zones[4] || 0);
    const outerPct = ((outerRegionalPlus / DATA.length) * 100).toFixed(0);
    const bot20 = irsd[1] + irsd[2];
    const bot20pct = withIrsd > 0 ? ((bot20 / withIrsd) * 100).toFixed(0) : "0";

    return {
      zones,
      popByZone,
      states,
      phns,
      ras,
      irsd,
      irsdByZone,
      totalPop,
      popCount,
      avgInd: indCount > 0 ? (indSum / indCount).toFixed(1) : "0",
      indCount,
      indAbove3,
      indAbove10,
      indAbove20,
      outerPct,
      outerRegionalPlus,
      bot20pct,
      bot20,
      withIrsd,
      withPop,
      withInd,
      withAll,
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
    .map(([k, v]) => ({ name: k, value: v, color: "var(--c-accent)" }));

  const phnEntries = Object.entries(stats.phns)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const phnMax = phnEntries.length > 0 ? phnEntries[0][1] : 1;

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
          <strong style={{ color: "var(--c-info)", fontWeight: 600 }}>
            {((stats.withAll / DATA.length) * 100).toFixed(0)}%
          </strong>{" "}
          of postcodes have full data coverage (ERP, IRSD &amp; Indigenous), and
          the average Indigenous population across postcodes with data is{" "}
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
          sub={`${stats.stateCount} states · ${stats.phnCount} PHN regions`}
        />
        <MetricCard
          label="Population"
          value={`${(stats.totalPop / 1e6).toFixed(1)}M`}
          sub={`${stats.popCount.toLocaleString()} postcodes with ERP data`}
        />
        <MetricCard
          label="Rural & remote"
          value={`${stats.outerPct}%`}
          sub={`${stats.outerRegionalPlus.toLocaleString()} postcodes in zones 3–4`}
          accent="var(--c-warning)"
        />
        <MetricCard
          label="Data completeness"
          value={`${((stats.withAll / DATA.length) * 100).toFixed(0)}%`}
          sub={`${stats.withAll.toLocaleString()} of ${DATA.length.toLocaleString()} have ERP + IRSD + Indigenous`}
          accent="var(--c-info)"
        />
      </div>

      {/* Remoteness profile + Population by zone */}
      <div
        className="grid-2"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 20,
        }}
      >
        <Card padding={false}>
          <div style={{ padding: "20px 20px 0" }}>
            <SectionLabel style={{ marginTop: 0 }}>
              Remoteness profile
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
              Population by remoteness
            </SectionLabel>
            <HorizBar
              items={[1, 2, 3, 4].map((z) => ({
                name: ZONE_NAMES[z],
                value: stats.popByZone[z],
                color: ZONE_COLORS[z],
              }))}
              total={stats.totalPop}
              formatValue={(v) => (v / 1e6).toFixed(1) + "M"}
            />
            <div
              style={{
                marginTop: 10,
                padding: "10px 0 0",
                borderTop: "1px solid var(--c-border)",
                fontSize: 11,
                color: "var(--c-text3)",
                lineHeight: 1.5,
              }}
            >
              <strong
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--c-text2)",
                }}
              >
                {((stats.popByZone[1] / stats.totalPop) * 100).toFixed(0)}%
              </strong>{" "}
              of population is metro, but only{" "}
              <strong
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--c-text2)",
                }}
              >
                {((stats.zones[1] / DATA.length) * 100).toFixed(0)}%
              </strong>{" "}
              of postcodes — rural and remote postcodes serve dispersed,
              harder-to-reach communities.
            </div>
          </div>
        </Card>
      </div>

      {/* Equity by remoteness + Indigenous population */}
      <div
        className="grid-2"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 20,
        }}
      >
        <Card>
          <SectionLabel style={{ marginTop: 0 }}>
            Disadvantage by remoteness
          </SectionLabel>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr 58px 48px 1fr",
              gap: "0 10",
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--c-text3)",
              paddingBottom: 6,
              borderBottom: "1.5px solid var(--c-border2)",
              marginBottom: 2,
            }}
          >
            <div style={{ width: 10 }} />
            <div>Zone</div>
            <div style={{ textAlign: "right" }}>IRSD ≤2</div>
            <div style={{ textAlign: "right" }}>Rate</div>
            <div />
          </div>
          {[1, 2, 3, 4].map((z) => (
            <EquityRow
              key={z}
              zone={z}
              color={ZONE_COLORS[z]}
              label={ZONE_NAMES[z]}
              postcodes={stats.zones[z]}
              bot20={stats.irsdByZone[z].bot20}
              total={stats.irsdByZone[z].total}
            />
          ))}
          <div
            style={{
              marginTop: 10,
              fontSize: 11,
              color: "var(--c-text3)",
              lineHeight: 1.5,
            }}
          >
            IRSD decile 1–2 postcodes are areas of highest socioeconomic
            disadvantage — rates above{" "}
            <strong style={{ color: "var(--c-text2)" }}>20%</strong> exceed the
            national baseline.
          </div>
        </Card>

        <Card>
          <SectionLabel style={{ marginTop: 0 }}>
            Indigenous population
          </SectionLabel>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              marginBottom: 14,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 28,
                fontWeight: 700,
                color: "var(--c-text)",
                lineHeight: 1,
              }}
            >
              {stats.avgInd}%
            </span>
            <span style={{ fontSize: 12, color: "var(--c-text3)" }}>
              average across {stats.indCount.toLocaleString()} postcodes
            </span>
          </div>
          <IndBucket
            label="Above 3% (national avg)"
            count={stats.indAbove3}
            total={stats.indCount}
            color="var(--c-accent)"
          />
          <IndBucket
            label="Above 10%"
            count={stats.indAbove10}
            total={stats.indCount}
            color="var(--c-warning)"
          />
          <IndBucket
            label="Above 20%"
            count={stats.indAbove20}
            total={stats.indCount}
            color="var(--c-negative)"
          />
          <div
            style={{
              marginTop: 12,
              fontSize: 11,
              color: "var(--c-text3)",
              lineHeight: 1.5,
            }}
          >
            Postcodes with higher Indigenous population share often have greater
            need for culturally appropriate harm reduction services.
          </div>
        </Card>
      </div>

      {/* State + PHN charts */}
      <div
        className="grid-2"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
      >
        <Card padding={false}>
          <div style={{ padding: "20px 20px 4px" }}>
            <SectionLabel style={{ marginTop: 0 }}>
              Coverage by state
            </SectionLabel>
          </div>
          <div style={{ padding: "0 12px 16px" }}>
            <MiniBar
              data={stateData}
              dataKey="value"
              nameKey="name"
              colors={stateData.map(() => "var(--c-accent)")}
            />
          </div>
        </Card>

        <Card padding={false}>
          <div style={{ padding: "20px 20px 16px" }}>
            <SectionLabel style={{ marginTop: 0 }}>
              Largest PHN regions
            </SectionLabel>
            <HorizBar
              items={phnEntries.map(([k, v]) => ({
                name: k,
                value: v,
                color: "var(--c-accent)",
              }))}
              total={DATA.length}
              scaleMax={phnMax * 1.15}
              compact
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
