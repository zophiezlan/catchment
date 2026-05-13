import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { irsdColor } from "../utils/data";

/* ===== Pill badge ===== */
export function Pill({ children, bg, color, border, size = "default" }) {
  const small = size === "small";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: small ? "2px 8px" : "4px 12px",
        borderRadius: 100,
        fontSize: small ? 10 : 12,
        fontWeight: 600,
        fontFamily: "var(--font-body)",
        letterSpacing: "0.01em",
        background: bg || "var(--c-bg3)",
        color: color || "var(--c-text2)",
        border: `1px solid ${border || "var(--c-border)"}`,
        whiteSpace: "nowrap",
        transition: "all 0.15s ease",
      }}
    >
      {children}
    </span>
  );
}

/* ===== Metric card ===== */
export function MetricCard({ label, value, sub, accent, icon }) {
  return (
    <div
      style={{
        padding: "16px 18px",
        borderRadius: "var(--radius)",
        border: "1px solid var(--c-border)",
        background: "var(--c-surface)",
        boxShadow: "var(--shadow-xs)",
        transition: "all 0.2s ease",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {accent && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: accent,
          }}
        />
      )}
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--c-text3)",
          marginBottom: 8,
          fontFamily: "var(--font-body)",
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        {icon && <span style={{ opacity: 0.6, display: "flex" }}>{icon}</span>}
        {label}
      </div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 700,
          fontFamily: "var(--font-mono)",
          color: accent || "var(--c-text)",
          lineHeight: 1,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 12,
            color: "var(--c-text3)",
            marginTop: 6,
            lineHeight: 1.3,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

/* ===== Section label ===== */
export function SectionLabel({ children, style: extraStyle }) {
  return (
    <h3
      style={{
        fontFamily: "var(--font-display)",
        fontSize: 13,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: "var(--c-text3)",
        marginBottom: 12,
        marginTop: 24,
        ...extraStyle,
      }}
    >
      {children}
    </h3>
  );
}

/* ===== Horizontal bar list ===== */
export function HorizBar({
  items,
  total,
  compact = false,
  scaleMax,
  formatValue,
}) {
  const barScale = scaleMax || total;
  return (
    <div role="list" aria-label="Distribution breakdown">
      {items.map((it, i) => {
        const pct = total > 0 ? (it.value / total) * 100 : 0;
        const barPct = barScale > 0 ? (it.value / barScale) * 100 : 0;
        return (
          <div
            key={i}
            role="listitem"
            aria-label={`${it.name}: ${it.value} (${pct.toFixed(0)}%)`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: compact ? 5 : 7,
              padding: "2px 0",
            }}
          >
            <div
              style={{
                width: compact ? 80 : 100,
                fontSize: compact ? 11 : 12,
                fontWeight: 500,
                color: "var(--c-text2)",
                textAlign: "right",
                flexShrink: 0,
                lineHeight: 1.3,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {it.name}
            </div>
            <div
              style={{
                flex: 1,
                height: compact ? 18 : 22,
                background: "var(--c-bg3)",
                borderRadius: 6,
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.max(barPct > 0 ? 1.5 : 0, barPct)}%`,
                  background: it.color || "var(--c-accent)",
                  borderRadius: 6,
                  transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                  position: "relative",
                }}
              />
            </div>
            <div
              style={{
                width: compact ? 34 : 40,
                fontSize: compact ? 11 : 12,
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                color: "var(--c-text)",
                textAlign: "right",
              }}
            >
              {formatValue ? formatValue(it.value) : it.value}
            </div>
            <div
              style={{
                width: compact ? 32 : 38,
                fontSize: compact ? 10 : 11,
                fontFamily: "var(--font-mono)",
                color: "var(--c-text3)",
                textAlign: "right",
              }}
            >
              {pct.toFixed(0)}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ===== Custom tooltip ===== */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--tooltip-bg)",
        color: "var(--tooltip-text)",
        padding: "8px 12px",
        borderRadius: "var(--radius-sm)",
        fontSize: 12,
        fontFamily: "var(--font-body)",
        lineHeight: 1.5,
        boxShadow: "var(--shadow-md)",
        border: "none",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>
        {payload[0].value.toLocaleString()}
      </div>
    </div>
  );
}

/* ===== Mini bar chart ===== */
export function MiniBar({
  data,
  dataKey,
  nameKey,
  colors,
  height = 180,
  showLabels = false,
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: showLabels ? 20 : 4, right: 4, bottom: 0, left: 4 }}
      >
        <XAxis
          dataKey={nameKey}
          tick={{
            fontSize: 11,
            fill: "var(--c-text3)",
            fontFamily: "var(--font-body)",
          }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide />
        <Tooltip
          content={<ChartTooltip />}
          cursor={{ fill: "var(--c-bg2)", radius: 4 }}
        />
        <Bar
          dataKey={dataKey}
          radius={[5, 5, 0, 0]}
          animationDuration={600}
          animationEasing="ease-out"
        >
          {data.map((e, i) => (
            <Cell
              key={i}
              fill={
                colors
                  ? colors[i % colors.length]
                  : e.color || "var(--c-accent)"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ===== Equity bar (IRSD) ===== */
export function EquityBar({ decile, compact = false }) {
  if (!decile)
    return (
      <span
        style={{ fontSize: 12, color: "var(--c-text3)", fontStyle: "italic" }}
      >
        No data
      </span>
    );

  const c = irsdColor(decile);

  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: compact ? 5 : 7 }}
      role="meter"
      aria-label={`IRSD decile ${decile} of 10`}
      aria-valuenow={decile}
      aria-valuemin={1}
      aria-valuemax={10}
    >
      <div style={{ display: "flex", gap: 2, flex: 1 }}>
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: compact ? 5 : 7,
              borderRadius: 3,
              background: i < decile ? c : "var(--c-border)",
              opacity: i < decile ? 1 : 0.25,
              transition: `all 0.2s ease ${i * 25}ms`,
            }}
          />
        ))}
      </div>
      <span
        style={{
          fontSize: compact ? 11 : 12,
          fontFamily: "var(--font-mono)",
          fontWeight: 600,
          color: c,
          minWidth: compact ? 24 : 30,
          textAlign: "right",
        }}
      >
        {decile}/10
      </span>
    </div>
  );
}

/* ===== Field label ===== */
export function FieldLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: "var(--c-text3)",
        marginBottom: 4,
        fontFamily: "var(--font-body)",
      }}
    >
      {children}
    </div>
  );
}

/* ===== Card wrapper ===== */
export function Card({ children, style: extraStyle, padding = true }) {
  return (
    <div
      style={{
        border: "1px solid var(--c-border)",
        borderRadius: "var(--radius-lg)",
        background: "var(--c-surface)",
        boxShadow: "var(--shadow-sm)",
        overflow: "hidden",
        ...(padding ? { padding: "20px" } : {}),
        ...extraStyle,
      }}
    >
      {children}
    </div>
  );
}

/* ===== Empty state ===== */
export function EmptyState({ icon, title, description }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        textAlign: "center",
      }}
    >
      {icon && (
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "var(--c-bg3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
            color: "var(--c-text3)",
          }}
        >
          {icon}
        </div>
      )}
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 15,
          fontWeight: 600,
          color: "var(--c-text2)",
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      {description && (
        <div
          style={{
            fontSize: 13,
            color: "var(--c-text3)",
            maxWidth: 320,
            lineHeight: 1.5,
          }}
        >
          {description}
        </div>
      )}
    </div>
  );
}
