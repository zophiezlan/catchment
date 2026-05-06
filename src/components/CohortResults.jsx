import { ZONE_NAMES, ZONE_COLORS, RA_LABELS, irsdColor } from "../utils/data";
import { generateSummary } from "../utils/cohort";
import {
  MetricCard,
  SectionLabel,
  HorizBar,
  MiniBar,
  Pill,
  Card,
} from "./Shared";

/**
 * CohortResults — displays analysis results with charts & metrics.
 * Pure presentational; receives analysis results from parent.
 */
export default function CohortResults({ results: r, resultsRef, onCopy }) {
  return (
    <div ref={resultsRef}>
      {/* Copy summary button + summary preview */}
      <Card
        style={{
          marginBottom: 16,
          padding: "16px 20px",
          background: "var(--c-accent-light)",
          borderColor: "rgba(5, 150, 105, 0.15)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 13,
                fontWeight: 700,
                color: "var(--c-accent)",
                marginBottom: 6,
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
                strokeLinejoin="round"
              >
                <rect x="4" y="1" width="9" height="11" rx="1.5" />
                <path d="M1 4v8.5A1.5 1.5 0 002.5 14H10" />
              </svg>
              Report summary
            </div>
            <p
              style={{
                fontSize: 13,
                lineHeight: 1.7,
                color: "var(--c-text2)",
                margin: 0,
              }}
            >
              {generateSummary(r)}
            </p>
          </div>
          <button
            onClick={onCopy}
            aria-label="Copy summary to clipboard"
            style={{
              padding: "8px 16px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid rgba(5, 150, 105, 0.25)",
              background: "var(--c-surface)",
              color: "var(--c-accent)",
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "var(--font-body)",
              whiteSpace: "nowrap",
              flexShrink: 0,
              transition: "all 0.2s ease",
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
              strokeLinejoin="round"
            >
              <rect x="4" y="1" width="9" height="11" rx="1.5" />
              <path d="M1 4v8.5A1.5 1.5 0 002.5 14H10" />
            </svg>
            Copy
          </button>
        </div>
      </Card>

      {/* Metric cards */}
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
          label="Postcodes matched"
          value={r.matchCount}
          sub={`of ${r.uniqueCount} unique`}
        />
        <MetricCard
          label="PHN regions"
          value={Object.keys(r.phns).length}
          sub={`${Object.keys(r.states).length} state${Object.keys(r.states).length !== 1 ? "s" : ""}`}
        />
        <MetricCard
          label="Bottom 20% IRSD"
          value={`${r.bot20pct}%`}
          sub={`${r.bot20} of ${r.withIrsd} with data`}
          accent={
            Number(r.bot20pct) > 30 ? "var(--c-equity-flag)" : undefined
          }
        />
        <MetricCard
          label="Avg Indigenous %"
          value={`${r.avgInd}%`}
          sub={`${r.indPop} postcodes with data`}
        />
      </div>

      {/* Missed postcodes warning */}
      {r.missed.length > 0 && (
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "#92400e",
            background: "#fef3c7",
            padding: "10px 14px",
            borderRadius: "var(--radius-sm)",
            marginBottom: 16,
            border: "1px solid #fde68a",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="currentColor"
            style={{ flexShrink: 0 }}
          >
            <path d="M7 1L13 12H1L7 1Z" />
          </svg>
          <span>
            {r.missed.length} postcode{r.missed.length > 1 ? "s" : ""}{" "}
            not found:{" "}
            <span style={{ fontFamily: "var(--font-mono)" }}>
              {r.missed.slice(0, 10).join(", ")}
              {r.missed.length > 10
                ? ` (+${r.missed.length - 10} more)`
                : ""}
            </span>
          </span>
        </div>
      )}

      {/* Zone + Remoteness */}
      <div
        className="grid-2"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
        }}
      >
        <Card padding={false}>
          <div style={{ padding: "18px 20px 16px" }}>
            <SectionLabel style={{ marginTop: 0 }}>
              Zone breakdown
            </SectionLabel>
            <HorizBar
              items={[1, 2, 3, 4].map((z) => ({
                name: ZONE_NAMES[z],
                value: r.zones[z] || 0,
                color: ZONE_COLORS[z],
              }))}
              total={r.total}
            />
          </div>
        </Card>
        <Card padding={false}>
          <div style={{ padding: "18px 20px 16px" }}>
            <SectionLabel style={{ marginTop: 0 }}>
              Remoteness
            </SectionLabel>
            <HorizBar
              items={Object.entries(r.ras)
                .sort((a, b) => Number(a[0]) - Number(b[0]))
                .map(([k, v]) => ({
                  name: RA_LABELS[k] || `RA${k}`,
                  value: v,
                  color: [
                    "",
                    "#3b82f6",
                    "#059669",
                    "#d97706",
                    "#f97316",
                    "#dc2626",
                  ][k],
                }))}
              total={r.total}
            />
          </div>
        </Card>
      </div>

      {/* PHN spread */}
      <Card padding={false} style={{ marginTop: 16 }}>
        <div style={{ padding: "18px 20px 16px" }}>
          <SectionLabel style={{ marginTop: 0 }}>
            PHN spread
          </SectionLabel>
          <HorizBar
            items={Object.entries(r.phns)
              .sort((a, b) => b[1] - a[1])
              .map(([k, v]) => ({
                name: k,
                value: v,
                color: "var(--c-accent)",
              }))}
            total={r.total}
            compact
          />
        </div>
      </Card>

      {/* NSW LHDs */}
      {Object.keys(r.lhds).length > 0 && (
        <Card padding={false} style={{ marginTop: 16 }}>
          <div style={{ padding: "18px 20px 16px" }}>
            <SectionLabel style={{ marginTop: 0 }}>
              NSW Local Health Districts
            </SectionLabel>
            <HorizBar
              items={Object.entries(r.lhds)
                .sort((a, b) => b[1] - a[1])
                .map(([k, v]) => ({
                  name: k.replace(" LHD", ""),
                  value: v,
                  color: "#3b82f6",
                }))}
              total={r.total}
              compact
            />
          </div>
        </Card>
      )}

      {/* IRSD + States row */}
      <div
        className="grid-2"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginTop: 16,
        }}
      >
        <Card padding={false}>
          <div style={{ padding: "18px 20px 4px" }}>
            <SectionLabel style={{ marginTop: 0 }}>
              IRSD decile distribution
            </SectionLabel>
          </div>
          <div style={{ padding: "0 12px 8px" }}>
            <MiniBar
              data={r.irsd.slice(1).map((v, i) => ({
                name: String(i + 1),
                value: v,
                color: irsdColor(i + 1),
              }))}
              dataKey="value"
              nameKey="name"
              colors={r.irsd.slice(1).map((_, i) => irsdColor(i + 1))}
              height={150}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 10,
              color: "var(--c-text3)",
              padding: "0 20px 14px",
              fontWeight: 500,
            }}
          >
            <span>Most disadvantaged</span>
            <span>Least disadvantaged</span>
          </div>
        </Card>

        <Card style={{ display: "flex", flexDirection: "column" }}>
          <SectionLabel style={{ marginTop: 0 }}>
            States represented
          </SectionLabel>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Object.entries(r.states)
              .sort((a, b) => b[1] - a[1])
              .map(([k, v]) => (
                <Pill key={k}>
                  <span style={{ fontWeight: 700 }}>{k}</span>
                  <span
                    style={{
                      marginLeft: 5,
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      opacity: 0.7,
                    }}
                  >
                    {v}
                  </span>
                </Pill>
              ))}
          </div>
          {r.popTot > 0 && (
            <div
              style={{
                marginTop: "auto",
                paddingTop: 16,
                fontSize: 12,
                color: "var(--c-text3)",
              }}
            >
              Combined population coverage:{" "}
              <strong
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--c-text2)",
                }}
              >
                {(r.popTot / 1e6).toFixed(2)}M
              </strong>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
