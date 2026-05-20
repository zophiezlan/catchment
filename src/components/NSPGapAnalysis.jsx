import { useState, useMemo } from "react";
import { getGapAnalysis, NEED_TIERS, getTier } from "../utils/nsp";
import { getLHDOutcomes, LHD_OUT_NSW, LHD_OUT_SOURCE } from "../utils/lhd-outcomes";
import { SEIFA_INDEXES } from "../utils/seifa";
import { MetricCard, SectionLabel, Card, EmptyState } from "./Shared";

const PAGE_GAP = 30;

const covColor = pct =>
  pct >= 70 ? "var(--c-positive)" : pct >= 40 ? "var(--c-warning)" : "var(--c-negative)";

/**
 * NSPGapAnalysis — coverage gap analysis for NSW postcodes.
 * Self-contained with its own filter/pagination state.
 */
export default function NSPGapAnalysis() {
  const [seifaIdx, setSeifaIdx] = useState("irsd");
  const analysis = useMemo(() => getGapAnalysis({ seifaIndex: seifaIdx }), [seifaIdx]);
  const [tierF,  setTierF]  = useState("all");
  const [lhdF,   setLhdF]   = useState("");
  const [page,   setPage]   = useState(0);

  const seifaMeta = SEIFA_INDEXES.find(s => s.key === seifaIdx);

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
      {/* Intro */}
      <Card style={{
        marginBottom: 20, padding: "20px 24px",
        background: "var(--c-warning-bg)",
        borderColor: "var(--c-warning-border)",
      }}>
        <div style={{
          fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600,
          color: "var(--c-warning-text)", marginBottom: 8,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1.5 12 Q3.5 5 7.5 7 Q10 9 14.5 2" />
            <circle cx="7.5" cy="7" r="1.5" fill="currentColor" stroke="none" />
          </svg>
          Coverage gap analysis
        </div>
        <p style={{ fontSize: 13.5, lineHeight: 1.65, color: "var(--c-text2)", margin: 0 }}>
          NSW postcodes without exact NSP coverage, scored 0–9 on a need composite:
          IRSD disadvantage, Indigenous population %, MMM remoteness, and distance to nearest outlet.
          LHD-level service volume and HCV treatment data (NSW Health 2024) provide context for prioritisation.
        </p>
      </Card>

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

      {/* LHD coverage + service volume */}
      <SectionLabel style={{ marginTop: 0 }}>LHD postcode coverage &amp; service volume</SectionLabel>
      <Card padding={false} style={{ marginBottom: 8 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "180px 1fr 80px 110px 90px",
          gap: 12,
          padding: "8px 18px 6px",
          fontSize: 10, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.06em", color: "var(--c-text3)",
          borderBottom: "1.5px solid var(--c-border2)",
        }}>
          <span>LHD</span>
          <span>PC coverage</span>
          <span style={{ textAlign: "right" }}>%</span>
          <span style={{ textAlign: "right" }} title="Units of injecting equipment distributed in 2024 (public + pharmacy)">Equipment 2024</span>
          <span style={{ textAlign: "right" }} title="People initiating HCV treatment in 2024">HCV tx</span>
        </div>
        <div style={{ padding: "4px 0" }}>
          {lhdCoverage.map(lhd => {
            const out = getLHDOutcomes(lhd.name);
            const unitsTotal = out ? out.unitsPublic + out.unitsPharmacy : 0;
            return (
              <div key={lhd.name} style={{
                display: "grid",
                gridTemplateColumns: "180px 1fr 80px 110px 90px",
                gap: 12,
                padding: "7px 18px",
                borderBottom: "1px solid var(--c-border)",
                alignItems: "center",
              }}>
                <div style={{
                  fontSize: 12, fontWeight: 500, color: "var(--c-text2)",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {lhd.name.replace(" LHD", "").replace(" Health (Network with Victoria)", "")}
                </div>
                <div style={{
                  height: 12, background: "var(--c-bg3)",
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
                  color: covColor(lhd.pct), textAlign: "right",
                }}>
                  {lhd.pct}%
                  <span style={{ display: "block", fontSize: 9, fontWeight: 500, color: "var(--c-text3)" }}>
                    {lhd.covered}/{lhd.total}
                  </span>
                </span>
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600,
                  color: "var(--c-text)", textAlign: "right",
                }}>
                  {unitsTotal > 0 ? (unitsTotal / 1000).toFixed(0) + "k" : "—"}
                </span>
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600,
                  color: out && out.treatmentInits > 100 ? "var(--c-accent)" : "var(--c-text2)",
                  textAlign: "right",
                }}>
                  {out ? out.treatmentInits.toLocaleString() : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
      <div style={{
        fontSize: 10, color: "var(--c-text3)",
        marginBottom: 24, padding: "0 18px", lineHeight: 1.5,
      }}>
        NSW 2024 totals: <strong style={{ fontFamily: "var(--font-mono)", color: "var(--c-text2)" }}>
          {(LHD_OUT_NSW.totalUnitsDistributedPublic / 1e6).toFixed(2)}M
        </strong> public + <strong style={{ fontFamily: "var(--font-mono)", color: "var(--c-text2)" }}>
          {(LHD_OUT_NSW.totalUnitsDistributedPharmacy / 1e6).toFixed(2)}M
        </strong> pharmacy units distributed · <strong style={{ fontFamily: "var(--font-mono)", color: "var(--c-text2)" }}>
          {LHD_OUT_NSW.totalTreatmentInitiations.toLocaleString()}
        </strong> commenced HCV treatment · <strong style={{ fontFamily: "var(--font-mono)", color: "var(--c-text2)" }}>
          {LHD_OUT_NSW.currentInfectionNotifications.toLocaleString()}
        </strong> new current-infection notifications.
        Source: <a href={LHD_OUT_SOURCE.url} target="_blank" rel="noreferrer"
          style={{ color: "var(--c-accent)", textDecoration: "none" }}>
          {LHD_OUT_SOURCE.name}
        </a>.
      </div>

      {/* Uncovered postcodes */}
      <SectionLabel>High-need postcodes without NSP services</SectionLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 14 }}>
        <div title={seifaMeta?.description}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 10px", borderRadius: "var(--radius-sm)",
            background: "var(--c-bg2)", border: "1.5px solid var(--c-border)",
          }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.05em",
            color: "var(--c-text3)", textTransform: "uppercase",
            fontFamily: "var(--font-body)",
          }}>Score by</span>
          <select
            value={seifaIdx}
            onChange={e => { setSeifaIdx(e.target.value); setPage(0); }}
            aria-label="SEIFA index used to score disadvantage"
            style={{
              fontSize: 11, fontWeight: 600, fontFamily: "var(--font-body)",
              border: "none", background: "transparent",
              color: "var(--c-accent)", cursor: "pointer", padding: 0,
            }}
          >
            {SEIFA_INDEXES.map(s => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>
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
            <span style={{ textAlign: "right" }} title={seifaMeta?.full}>{seifaMeta?.label || "IRSD"}</span>
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
                  color: p.decile > 0 ? (p.decile <= 2 ? "var(--c-negative)" : p.decile <= 4 ? "var(--c-warning)" : "var(--c-text2)") : "var(--c-text3)",
                }}>
                  {p.decile > 0 ? p.decile : "—"}
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
            Need score: {seifaMeta?.label || "IRSD"} ≤2 (+3), ≤4 (+2), ≤6 (+1) · Indigenous ≥10% (+2), ≥3% (+1) · MMM ≥6 (+2), ≥4 (+1) · Distance &gt;100km (+2), &gt;50km (+1). Switch SEIFA index above to rescore through a different lens. Hover row for nearest outlet name.
          </div>
        </>
      )}
    </div>
  );
}
