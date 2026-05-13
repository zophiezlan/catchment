import { useState, useMemo } from "react";
import { getGapAnalysis, NEED_TIERS, getTier } from "../utils/nsp";
import { MetricCard, SectionLabel, Card, EmptyState } from "./Shared";

const PAGE_GAP = 30;

const covColor = pct =>
  pct >= 70 ? "var(--c-positive)" : pct >= 40 ? "var(--c-warning)" : "var(--c-negative)";

/**
 * NSPGapAnalysis — coverage gap analysis for NSW postcodes.
 * Self-contained with its own filter/pagination state.
 */
export default function NSPGapAnalysis() {
  const analysis   = useMemo(() => getGapAnalysis(), []);
  const [tierF,  setTierF]  = useState("all");
  const [lhdF,   setLhdF]   = useState("");
  const [page,   setPage]   = useState(0);

  const lhdsInGaps = useMemo(() =>
    [...new Set(analysis.uncovered.map(p => p.lhd))].filter(l => l !== "—").sort(),
    [analysis]
  );

  const shown = useMemo(() => {
    return analysis.uncovered.filter(p => {
      if (tierF === "critical" && p.score < 5) return false;
      if (tierF === "high"     && p.score < 4) return false;
      if (tierF === "medium"   && p.score < 2) return false;
      if (lhdF && p.lhd !== lhdF) return false;
      return true;
    });
  }, [analysis, tierF, lhdF]);

  const totalPages = Math.ceil(shown.length / PAGE_GAP);
  const paged = shown.slice(page * PAGE_GAP, (page + 1) * PAGE_GAP);

  const { summary, lhdCoverage } = analysis;

  return (
    <div>
      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }} className="grid-4">
        <MetricCard label="NSW postcodes" value={summary.total.toLocaleString()} sub="with population data" />
        <MetricCard
          label="NSP coverage"
          value={`${summary.coveredPct}%`}
          sub={`${summary.covered.toLocaleString()} postcodes served`}
          accent="var(--c-positive)"
        />
        <MetricCard
          label="Uncovered"
          value={(summary.total - summary.covered).toLocaleString()}
          sub="no exact match"
          accent="var(--c-warning)"
        />
        <MetricCard
          label="High-need gaps"
          value={summary.highNeedUncovered.toLocaleString()}
          sub="score ≥ 4 (IRSD + indicators)"
          accent="var(--c-negative)"
        />
      </div>

      {/* LHD coverage bars */}
      <SectionLabel style={{ marginTop: 0 }}>LHD postcode coverage</SectionLabel>
      <Card padding={false} style={{ marginBottom: 24 }}>
        <div style={{ padding: "4px 0" }}>
          {lhdCoverage.map(lhd => (
            <div key={lhd.name} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "7px 18px",
              borderBottom: "1px solid var(--c-border)",
            }}>
              <div style={{
                width: 200, fontSize: 12, fontWeight: 500, color: "var(--c-text2)",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flexShrink: 0,
              }}>
                {lhd.name.replace(" LHD", "").replace(" Health (Network with Victoria)", "")}
              </div>
              <div style={{
                flex: 1, height: 14, background: "var(--c-bg3)",
                borderRadius: 4, overflow: "hidden",
              }}>
                <div style={{
                  width: `${lhd.pct}%`, height: "100%",
                  background: covColor(lhd.pct),
                  borderRadius: 4,
                  transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)",
                }} />
              </div>
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
                color: covColor(lhd.pct), minWidth: 32, textAlign: "right",
              }}>
                {lhd.pct}%
              </span>
              <span style={{ fontSize: 11, color: "var(--c-text3)", minWidth: 56, textAlign: "right" }}>
                {lhd.covered}/{lhd.total}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Uncovered postcodes */}
      <SectionLabel>High-need postcodes without NSP services</SectionLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 14 }}>
        {[
          { id: "all",      label: "All flagged" },
          { id: "critical", label: "Critical (≥5)" },
          { id: "high",     label: "High (4)" },
          { id: "medium",   label: "Medium (2–3)" },
        ].map(({ id, label }) => {
          const tier = NEED_TIERS.find(t => t.label.toLowerCase() === id) ?? null;
          const active = tierF === id;
          return (
            <button key={id} onClick={() => { setTierF(id); setPage(0); }}
              style={{
                padding: "5px 13px", fontSize: 11, fontWeight: active ? 700 : 500,
                borderRadius: 100, fontFamily: "var(--font-body)",
                border: `1.5px solid ${active ? (tier?.border ?? "var(--c-border2)") : "var(--c-border)"}`,
                background: active ? (tier?.bg ?? "var(--c-bg3)") : "var(--c-surface)",
                color: active ? (tier?.text ?? "var(--c-text2)") : "var(--c-text3)",
                cursor: "pointer", transition: "all 0.15s ease",
              }}>
              {label}
            </button>
          );
        })}
        <select
          value={lhdF}
          onChange={e => { setLhdF(e.target.value); setPage(0); }}
          style={{
            padding: "5px 10px", fontSize: 11, fontFamily: "var(--font-body)",
            border: "1.5px solid var(--c-border)", borderRadius: "var(--radius-sm)",
            background: "var(--c-surface)", color: lhdF ? "var(--c-text)" : "var(--c-text3)",
            cursor: "pointer",
          }}
        >
          <option value="">All LHDs</option>
          {lhdsInGaps.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <span style={{ fontSize: 11, color: "var(--c-text3)", marginLeft: 2 }}>
          <strong style={{ fontFamily: "var(--font-mono)", color: "var(--c-text2)" }}>{shown.length}</strong> postcodes
        </span>
      </div>

      {shown.length === 0 ? (
        <EmptyState title="No postcodes match these filters" description="Try widening the need tier or clearing the LHD filter." />
      ) : (
        <>
          {/* Column headers */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "72px 1fr 90px 150px 70px 56px 60px 70px 72px",
            gap: 8, padding: "6px 12px",
            fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
            color: "var(--c-text3)", fontFamily: "var(--font-body)",
            borderBottom: "1.5px solid var(--c-border2)",
            marginBottom: 4,
          }}>
            <span>PC</span><span>Suburb</span><span>Zone</span><span>LHD</span>
            <span style={{ textAlign: "right" }}>Pop</span>
            <span style={{ textAlign: "right" }}>IRSD</span>
            <span style={{ textAlign: "right" }}>Indig%</span>
            <span style={{ textAlign: "right" }}>Dist</span>
            <span style={{ textAlign: "center" }}>Need</span>
          </div>

          {paged.map(p => {
            const tier = getTier(p.score);
            const distColor = p.distKm != null
              ? (p.distKm > 100 ? "var(--c-negative)" : p.distKm > 50 ? "var(--c-orange)" : p.distKm > 20 ? "var(--c-warning)" : "var(--c-positive)")
              : "var(--c-text3)";
            return (
              <div key={p.pc} style={{
                display: "grid",
                gridTemplateColumns: "72px 1fr 90px 150px 70px 56px 60px 70px 72px",
                gap: 8, padding: "7px 12px",
                fontSize: 12, alignItems: "center",
                borderBottom: "1px solid var(--c-border)",
                transition: "background 0.1s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--c-bg2)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                title={p.nearestOutlet ? `Nearest outlet: ${p.nearestOutlet}` : undefined}
              >
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--c-text)", fontSize: 13 }}>
                  {p.pc}
                </span>
                <span style={{ color: "var(--c-text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.pl || "—"}
                </span>
                <span style={{ fontSize: 11, color: "var(--c-text3)" }}>{p.zn || "—"}</span>
                <span style={{
                  fontSize: 11, color: "var(--c-text3)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {p.lhd.replace(" LHD", "").replace(" Health (Network with Victoria)", "")}
                </span>
                <span style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--c-text3)" }}>
                  {p.erp > 0 ? p.erp.toLocaleString() : "—"}
                </span>
                <span style={{
                  textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11,
                  fontWeight: 600,
                  color: p.id > 0 ? (p.id <= 2 ? "var(--c-negative)" : p.id <= 4 ? "var(--c-warning)" : "var(--c-text2)") : "var(--c-text3)",
                }}>
                  {p.id > 0 ? p.id : "—"}
                </span>
                <span style={{
                  textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11,
                  color: p.ip >= 10 ? "var(--c-positive)" : p.ip > 0 ? "var(--c-text2)" : "var(--c-text3)",
                }}>
                  {p.ip > 0 ? `${p.ip}%` : "—"}
                </span>
                <span style={{
                  textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11,
                  fontWeight: 600, color: distColor,
                }}>
                  {p.distKm != null ? `${p.distKm} km` : "—"}
                </span>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  {tier && (
                    <span style={{
                      padding: "2px 7px", borderRadius: 100, fontSize: 10, fontWeight: 700,
                      fontFamily: "var(--font-body)", background: tier.bg,
                      color: tier.text, border: `1px solid ${tier.border}`,
                      whiteSpace: "nowrap",
                    }}>
                      {tier.label}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16 }}>
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                style={{
                  padding: "6px 14px", fontSize: 12, fontWeight: 600, fontFamily: "var(--font-body)",
                  border: "1.5px solid var(--c-border)", borderRadius: "var(--radius-sm)",
                  background: "var(--c-surface)", cursor: page === 0 ? "default" : "pointer",
                  color: page === 0 ? "var(--c-text3)" : "var(--c-text2)", opacity: page === 0 ? 0.4 : 1,
                }}>← Prev</button>
              <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--c-text3)", minWidth: 80, textAlign: "center" }}>
                {page + 1} / {totalPages}
              </span>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                style={{
                  padding: "6px 14px", fontSize: 12, fontWeight: 600, fontFamily: "var(--font-body)",
                  border: "1.5px solid var(--c-border)", borderRadius: "var(--radius-sm)",
                  background: "var(--c-surface)", cursor: page >= totalPages - 1 ? "default" : "pointer",
                  color: page >= totalPages - 1 ? "var(--c-text3)" : "var(--c-text2)", opacity: page >= totalPages - 1 ? 0.4 : 1,
                }}>Next →</button>
            </div>
          )}

          <div style={{ fontSize: 11, color: "var(--c-text3)", marginTop: 12, lineHeight: 1.5 }}>
            Need score: IRSD ≤2 (+3), ≤4 (+2), ≤6 (+1) · Indigenous ≥10% (+2), ≥3% (+1) · MMM ≥6 (+2), ≥4 (+1) · Distance &gt;100km (+2), &gt;50km (+1). Hover row for nearest outlet name.
          </div>
        </>
      )}
    </div>
  );
}
