import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toPng } from "html-to-image";
import {
  PIDX,
  decode,
  ZONE_NAMES,
  ZONE_COLORS,
  RA_LABELS,
  irsdColor,
} from "../utils/data";
import {
  MetricCard,
  SectionLabel,
  HorizBar,
  MiniBar,
  Pill,
  Card,
  EmptyState,
} from "./Shared";
import CohortCompare from "./CohortCompare";

const STORAGE_KEY = "saved-cohorts";

function loadSavedCohorts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistCohorts(cohorts) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cohorts));
  } catch {}
}

function generateSummary(r) {
  const zoneParts = [1, 2, 3, 4]
    .filter((z) => r.zones[z] > 0)
    .map(
      (z) =>
        `${((r.zones[z] / r.total) * 100).toFixed(0)}% ${ZONE_NAMES[z].toLowerCase()}`,
    );

  const phnCount = Object.keys(r.phns).length;
  const lhdCount = Object.keys(r.lhds).length;

  let text = `Analysis of ${r.matchCount} unique service contact postcode${r.matchCount !== 1 ? "s" : ""}`;
  text += ` shows ${zoneParts.join(", ")}`;
  text += `, spanning ${phnCount} PHN region${phnCount !== 1 ? "s" : ""}`;
  if (lhdCount > 0)
    text += ` and ${lhdCount} NSW Local Health District${lhdCount !== 1 ? "s" : ""}`;
  text += ".";

  if (r.withIrsd > 0) {
    text += ` ${r.bot20pct}% of postcodes with IRSD data fall in the most disadvantaged quintile (decile 1–2).`;
  }

  if (Number(r.avgInd) > 0) {
    text += ` Average Indigenous population across matched postcodes is ${r.avgInd}%.`;
  }

  if (r.missed.length > 0) {
    text += ` ${r.missed.length} postcode${r.missed.length !== 1 ? "s were" : " was"} not matched.`;
  }

  return text;
}

export default function CohortAnalyser() {
  const [raw, setRaw] = useState("");
  const [results, setResults] = useState(null);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [savedCohorts, setSavedCohorts] = useState(loadSavedCohorts);
  const [saveName, setSaveName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareA, setCompareA] = useState(null);
  const [compareB, setCompareB] = useState(null);
  const resultsRef = useRef(null);
  const saveInputRef = useRef(null);

  useEffect(() => {
    if (showSaveDialog && saveInputRef.current) saveInputRef.current.focus();
  }, [showSaveDialog]);

  const saveCohort = useCallback(
    (name) => {
      if (!results || results.empty || !name.trim()) return;
      const cohort = {
        id: Date.now(),
        name: name.trim(),
        savedAt: new Date().toISOString(),
        raw,
        results,
      };
      const updated = [cohort, ...savedCohorts];
      setSavedCohorts(updated);
      persistCohorts(updated);
      setShowSaveDialog(false);
      setSaveName("");
    },
    [results, raw, savedCohorts],
  );

  const deleteCohort = useCallback(
    (id) => {
      const updated = savedCohorts.filter((c) => c.id !== id);
      setSavedCohorts(updated);
      persistCohorts(updated);
      setConfirmDelete(null);
    },
    [savedCohorts],
  );

  const loadCohort = useCallback((cohort) => {
    setRaw(cohort.raw);
    setResults(cohort.results);
    setShowSaved(false);
  }, []);

  const analyse = useCallback(() => {
    const pcs = raw.match(/\d{3,4}/g) || [];
    const unique = [...new Set(pcs.map(Number))];
    const matched = [];
    const missed = [];

    unique.forEach((pc) => {
      if (PIDX[pc]) matched.push(decode(PIDX[pc]));
      else missed.push(pc);
    });

    if (!matched.length) {
      setResults({ empty: true });
      return;
    }

    const zones = { 1: 0, 2: 0, 3: 0, 4: 0 };
    const ras = {};
    const phns = {};
    const lhds = {};
    const states = {};
    const irsd = Array(11).fill(0);
    let popTot = 0,
      indW = 0,
      indPop = 0;

    matched.forEach((d) => {
      zones[d.z] = (zones[d.z] || 0) + 1;
      ras[d.ra] = (ras[d.ra] || 0) + 1;
      if (d.hn) phns[d.hn] = (phns[d.hn] || 0) + 1;
      if (d.lhd) lhds[d.lhd] = (lhds[d.lhd] || 0) + 1;
      states[d.st] = (states[d.st] || 0) + 1;
      if (d.id > 0) irsd[d.id]++;
      if (d.erp > 0) popTot += d.erp;
      if (d.ip > 0) {
        indW += d.ip;
        indPop++;
      }
    });

    const bot20 = irsd.slice(1, 3).reduce((a, b) => a + b, 0);
    const withIrsd = irsd.slice(1).reduce((a, b) => a + b, 0);

    setResults({
      inputCount: pcs.length,
      uniqueCount: unique.length,
      matchCount: matched.length,
      missed,
      zones,
      ras,
      phns,
      lhds,
      states,
      irsd,
      popTot,
      avgInd: indPop > 0 ? (indW / indPop).toFixed(1) : "0",
      indPop,
      bot20,
      withIrsd,
      bot20pct: withIrsd > 0 ? ((bot20 / withIrsd) * 100).toFixed(0) : "0",
      total: matched.length,
    });
  }, [raw]);

  const handleCopy = useCallback(async () => {
    if (!results || results.empty) return;
    const text = generateSummary(results);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }, [results]);

  const handleExportPNG = useCallback(async () => {
    if (!resultsRef.current || exporting) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(resultsRef.current, {
        backgroundColor: getComputedStyle(document.documentElement)
          .getPropertyValue("--c-bg")
          .trim(),
        pixelRatio: 2,
        style: { padding: "24px" },
      });
      const link = document.createElement("a");
      link.download = `cohort-analysis-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    }
    setExporting(false);
  }, [exporting]);

  // Drag and drop CSV handling
  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }
  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }
  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result;
      if (typeof text === "string") {
        // Extract just the numeric values that look like postcodes
        setRaw(text);
      }
    };
    reader.readAsText(file);
  }

  function handleClear() {
    setRaw("");
    setResults(null);
  }

  const r = results;

  return (
    <div>
      {/* Intro */}
      <div
        style={{
          fontSize: 14,
          color: "var(--c-text2)",
          marginBottom: 14,
          lineHeight: 1.6,
        }}
      >
        Paste postcodes from an event list, service contacts, or distribution
        data. One per line, comma-separated, or space-separated — the tool will
        extract them automatically.
      </div>

      {/* Saved cohorts toggle + panel */}
      {savedCohorts.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => {
                setShowSaved(!showSaved);
                setCompareMode(false);
                setCompareA(null);
                setCompareB(null);
              }}
              style={{
                padding: "8px 14px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--c-border)",
                background:
                  showSaved && !compareMode
                    ? "var(--c-accent-light)"
                    : "var(--c-surface)",
                color:
                  showSaved && !compareMode
                    ? "var(--c-accent)"
                    : "var(--c-text2)",
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "var(--font-body)",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.15s ease",
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
                <path d="M2 2h10v10H2z" />
                <path d="M4 2v4h6V2" />
                <path d="M8 3v2" />
              </svg>
              Saved cohorts
              <span
                style={{
                  background: showSaved ? "var(--c-accent)" : "var(--c-bg3)",
                  color: showSaved ? "#fff" : "var(--c-text3)",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: 10,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {savedCohorts.length}
              </span>
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                style={{
                  transform: showSaved ? "rotate(180deg)" : "rotate(0)",
                  transition: "transform 0.2s ease",
                }}
              >
                <path d="M2 4l3 3 3-3" />
              </svg>
            </button>
            {savedCohorts.length >= 2 && (
              <button
                onClick={() => {
                  const entering = !compareMode;
                  setCompareMode(entering);
                  setCompareA(null);
                  setCompareB(null);
                  if (entering) setShowSaved(true);
                }}
                style={{
                  padding: "8px 14px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid",
                  borderColor: compareMode
                    ? "rgba(59, 130, 246, 0.3)"
                    : "var(--c-border)",
                  background: compareMode
                    ? "rgba(59, 130, 246, 0.08)"
                    : "var(--c-surface)",
                  color: compareMode ? "#3b82f6" : "var(--c-text2)",
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "var(--font-body)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.15s ease",
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
                  <rect x="1" y="2" width="4.5" height="10" rx="1" />
                  <rect x="8.5" y="2" width="4.5" height="10" rx="1" />
                </svg>
                Compare
              </button>
            )}
          </div>

          <AnimatePresence>
            {showSaved && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: "hidden" }}
              >
                {compareMode && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: "10px 14px",
                      borderRadius: "var(--radius-sm)",
                      background: "rgba(59, 130, 246, 0.06)",
                      border: "1px solid rgba(59, 130, 246, 0.15)",
                      fontSize: 12,
                      color: "var(--c-text2)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    >
                      <circle cx="7" cy="7" r="5.5" />
                      <path d="M7 4.5v3" />
                      <circle cx="7" cy="10" r="0.5" fill="#3b82f6" />
                    </svg>
                    {!compareA
                      ? "Select the first cohort (A)"
                      : !compareB
                        ? "Now select the second cohort (B)"
                        : "Ready to compare!"}
                    {compareA && (
                      <span
                        style={{
                          marginLeft: "auto",
                          fontWeight: 600,
                          color: "#3b82f6",
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                        }}
                      >
                        A: {compareA.name}
                      </span>
                    )}
                  </div>
                )}
                <Card style={{ marginTop: 10, padding: 0 }} padding={false}>
                  <div
                    style={{
                      maxHeight: 280,
                      overflowY: "auto",
                    }}
                  >
                    {savedCohorts.map((c, i) => {
                      const isA = compareA?.id === c.id;
                      const isB = compareB?.id === c.id;
                      const selected = isA || isB;
                      return (
                        <div
                          key={c.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "12px 16px",
                            borderBottom:
                              i < savedCohorts.length - 1
                                ? "1px solid var(--c-border)"
                                : "none",
                            background: selected
                              ? "rgba(59, 130, 246, 0.06)"
                              : "transparent",
                            transition: "background 0.1s ease",
                          }}
                          onMouseEnter={(e) => {
                            if (!selected)
                              e.currentTarget.style.background = "var(--c-bg2)";
                          }}
                          onMouseLeave={(e) => {
                            if (!selected)
                              e.currentTarget.style.background = "transparent";
                          }}
                        >
                          {compareMode && (
                            <div
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 6,
                                border: `2px solid ${selected ? "#3b82f6" : "var(--c-border2)"}`,
                                background: selected
                                  ? "#3b82f6"
                                  : "transparent",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#fff",
                                fontFamily: "var(--font-mono)",
                                flexShrink: 0,
                                transition: "all 0.15s ease",
                              }}
                            >
                              {isA ? "A" : isB ? "B" : ""}
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: "var(--c-text)",
                                marginBottom: 2,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {c.name}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: "var(--c-text3)",
                                fontFamily: "var(--font-mono)",
                                display: "flex",
                                gap: 8,
                              }}
                            >
                              <span>{c.results.matchCount} postcodes</span>
                              <span>
                                {new Date(c.savedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          {compareMode ? (
                            <button
                              onClick={() => {
                                if (isA) {
                                  setCompareA(null);
                                } else if (isB) {
                                  setCompareB(null);
                                } else if (!compareA) {
                                  setCompareA(c);
                                } else if (!compareB) {
                                  setCompareB(c);
                                }
                              }}
                              style={{
                                padding: "6px 12px",
                                borderRadius: "var(--radius-xs)",
                                border: `1px solid ${selected ? "#3b82f6" : "var(--c-border)"}`,
                                background: selected
                                  ? "rgba(59, 130, 246, 0.1)"
                                  : "var(--c-surface)",
                                color: selected ? "#3b82f6" : "var(--c-text2)",
                                fontSize: 11,
                                fontWeight: 600,
                                fontFamily: "var(--font-body)",
                                flexShrink: 0,
                              }}
                            >
                              {selected
                                ? "Deselect"
                                : !compareA
                                  ? "Set A"
                                  : !compareB
                                    ? "Set B"
                                    : "—"}
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => loadCohort(c)}
                                style={{
                                  padding: "6px 12px",
                                  borderRadius: "var(--radius-xs)",
                                  border: "1px solid var(--c-border)",
                                  background: "var(--c-surface)",
                                  color: "var(--c-accent)",
                                  fontSize: 11,
                                  fontWeight: 600,
                                  fontFamily: "var(--font-body)",
                                  flexShrink: 0,
                                }}
                              >
                                Load
                              </button>
                              {confirmDelete === c.id ? (
                                <div style={{ display: "flex", gap: 4 }}>
                                  <button
                                    onClick={() => deleteCohort(c.id)}
                                    style={{
                                      padding: "6px 10px",
                                      borderRadius: "var(--radius-xs)",
                                      border: "none",
                                      background: "var(--c-equity-flag)",
                                      color: "#fff",
                                      fontSize: 11,
                                      fontWeight: 600,
                                      fontFamily: "var(--font-body)",
                                    }}
                                  >
                                    Delete
                                  </button>
                                  <button
                                    onClick={() => setConfirmDelete(null)}
                                    style={{
                                      padding: "6px 8px",
                                      borderRadius: "var(--radius-xs)",
                                      border: "1px solid var(--c-border)",
                                      background: "var(--c-surface)",
                                      color: "var(--c-text3)",
                                      fontSize: 11,
                                      fontWeight: 600,
                                      fontFamily: "var(--font-body)",
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmDelete(c.id)}
                                  aria-label={`Delete ${c.name}`}
                                  style={{
                                    padding: "6px 8px",
                                    borderRadius: "var(--radius-xs)",
                                    border: "1px solid var(--c-border)",
                                    background: "var(--c-surface)",
                                    color: "var(--c-text3)",
                                    fontSize: 11,
                                    display: "flex",
                                    alignItems: "center",
                                    flexShrink: 0,
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
                                    <path d="M2 3h8M4.5 3V2a1 1 0 011-1h1a1 1 0 011 1v1M5 5.5v3M7 5.5v3M3 3l.5 7a1 1 0 001 1h3a1 1 0 001-1L9 3" />
                                  </svg>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {compareMode && compareA && compareB && (
                    <div
                      style={{
                        padding: "12px 16px",
                        borderTop: "1px solid var(--c-border)",
                        background: "var(--c-bg2)",
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        onClick={() => setShowSaved(false)}
                        style={{
                          padding: "9px 20px",
                          borderRadius: "var(--radius-sm)",
                          border: "none",
                          background: "#3b82f6",
                          color: "#fff",
                          fontSize: 13,
                          fontWeight: 600,
                          fontFamily: "var(--font-body)",
                          boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
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
                          strokeLinejoin="round"
                        >
                          <rect x="1" y="2" width="4.5" height="10" rx="1" />
                          <rect x="8.5" y="2" width="4.5" height="10" rx="1" />
                        </svg>
                        Compare now
                      </button>
                    </div>
                  )}
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Input area */}
      <Card
        style={{
          padding: 0,
          marginBottom: 16,
          borderColor: dragOver ? "var(--c-accent)" : undefined,
          boxShadow: dragOver ? "0 0 0 3px var(--c-accent-muted)" : undefined,
          transition: "all 0.2s ease",
        }}
        padding={false}
      >
        {dragOver && (
          <div
            style={{
              padding: "16px 18px",
              textAlign: "center",
              color: "var(--c-accent)",
              fontWeight: 600,
              fontSize: 14,
              background: "var(--c-accent-light)",
              borderBottom: "1px solid var(--c-border)",
            }}
          >
            Drop file to load postcodes
          </div>
        )}
        <textarea
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={"2560\n2000\n2250\n4000\n2010, 2020, 2030\n..."}
          rows={7}
          aria-label="Paste postcodes here"
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "16px 18px",
            fontSize: 14,
            fontFamily: "var(--font-mono)",
            fontWeight: 500,
            border: "none",
            borderBottom: "1px solid var(--c-border)",
            borderRadius: 0,
            background: "transparent",
            color: "var(--c-text)",
            resize: "vertical",
            lineHeight: 1.7,
            outline: "none",
          }}
        />
        <div
          style={{
            display: "flex",
            gap: 10,
            padding: "12px 18px",
            alignItems: "center",
            background: "var(--c-bg2)",
          }}
        >
          <button
            onClick={analyse}
            disabled={!raw.trim()}
            aria-label="Analyse postcodes"
            style={{
              padding: "10px 24px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: raw.trim() ? "var(--c-accent)" : "var(--c-bg3)",
              color: raw.trim() ? "#fff" : "var(--c-text3)",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "var(--font-body)",
              cursor: raw.trim() ? "pointer" : "default",
              boxShadow: raw.trim()
                ? "0 2px 8px rgba(5, 150, 105, 0.25)"
                : "none",
              transition: "all 0.2s ease",
            }}
          >
            Analyse cohort
          </button>
          {raw.trim() && (
            <button
              onClick={handleClear}
              style={{
                padding: "10px 16px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--c-border)",
                background: "var(--c-surface)",
                color: "var(--c-text2)",
                fontSize: 13,
                fontWeight: 500,
                fontFamily: "var(--font-body)",
              }}
            >
              Clear
            </button>
          )}
          {r && !r.empty && (
            <span
              style={{
                fontSize: 12,
                color: "var(--c-text3)",
                marginLeft: "auto",
                fontFamily: "var(--font-mono)",
              }}
            >
              {r.inputCount} entered · {r.uniqueCount} unique · {r.matchCount}{" "}
              matched
            </span>
          )}
        </div>
      </Card>

      {/* Empty result */}
      <AnimatePresence mode="wait">
        {r && r.empty && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
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
                  <circle cx="12" cy="12" r="9" />
                  <path d="M9 9l6 6M15 9l-6 6" />
                </svg>
              }
              title="No valid postcodes found"
              description="Check your input — postcodes should be 3 or 4 digit numbers. Try pasting a list or entering them separated by commas, spaces, or newlines."
            />
          </motion.div>
        )}

        {/* Results */}
        {r && !r.empty && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
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
                    onClick={handleCopy}
                    aria-label="Copy summary to clipboard"
                    style={{
                      padding: "8px 16px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid rgba(5, 150, 105, 0.25)",
                      background: copied
                        ? "var(--c-accent)"
                        : "var(--c-surface)",
                      color: copied ? "#fff" : "var(--c-accent)",
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
                    {copied ? (
                      <>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3 7 6 10 11 4" />
                        </svg>
                        Copied
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
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
            {/* end resultsRef */}

            {/* Save dialog */}
            <AnimatePresence>
              {showSaveDialog && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                >
                  <Card
                    style={{
                      marginTop: 16,
                      padding: "16px 20px",
                      borderColor: "var(--c-accent)",
                      boxShadow: "0 0 0 3px var(--c-accent-muted)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--c-text)",
                        marginBottom: 10,
                        fontFamily: "var(--font-display)",
                      }}
                    >
                      Save this cohort
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        ref={saveInputRef}
                        type="text"
                        value={saveName}
                        onChange={(e) => setSaveName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && saveName.trim())
                            saveCohort(saveName);
                          if (e.key === "Escape") {
                            setShowSaveDialog(false);
                            setSaveName("");
                          }
                        }}
                        placeholder="e.g. Splendour 2025, Q1 NSP contacts..."
                        style={{
                          flex: 1,
                          padding: "9px 14px",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--c-border2)",
                          background: "var(--c-bg)",
                          color: "var(--c-text)",
                          fontSize: 13,
                          fontFamily: "var(--font-body)",
                          outline: "none",
                        }}
                      />
                      <button
                        onClick={() => saveCohort(saveName)}
                        disabled={!saveName.trim()}
                        style={{
                          padding: "9px 18px",
                          borderRadius: "var(--radius-sm)",
                          border: "none",
                          background: saveName.trim()
                            ? "var(--c-accent)"
                            : "var(--c-bg3)",
                          color: saveName.trim() ? "#fff" : "var(--c-text3)",
                          fontSize: 12,
                          fontWeight: 600,
                          fontFamily: "var(--font-body)",
                          cursor: saveName.trim() ? "pointer" : "default",
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setShowSaveDialog(false);
                          setSaveName("");
                        }}
                        style={{
                          padding: "9px 12px",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--c-border)",
                          background: "var(--c-surface)",
                          color: "var(--c-text3)",
                          fontSize: 12,
                          fontWeight: 500,
                          fontFamily: "var(--font-body)",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Export buttons */}
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 16,
                justifyContent: "flex-end",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => setShowSaveDialog(true)}
                style={{
                  padding: "9px 16px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid rgba(5, 150, 105, 0.25)",
                  background: "var(--c-accent-light)",
                  color: "var(--c-accent)",
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "var(--font-body)",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  marginRight: "auto",
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
                  <path d="M2 2h10v10H2z" />
                  <path d="M4 2v4h6V2" />
                  <path d="M8 3v2" />
                </svg>
                Save cohort
              </button>
              <button
                onClick={handleExportPNG}
                disabled={exporting}
                style={{
                  padding: "9px 16px",
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
                  opacity: exporting ? 0.6 : 1,
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
                  <path d="M7 1v8M4 6l3 3 3-3" />
                  <path d="M1 10v2a1 1 0 001 1h10a1 1 0 001-1v-2" />
                </svg>
                {exporting ? "Exporting..." : "Save as PNG"}
              </button>
              <button
                onClick={() => window.print()}
                style={{
                  padding: "9px 16px",
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
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="8" width="8" height="5" rx="0.5" />
                  <path d="M3 10H1.5A.5.5 0 011 9.5v-4a.5.5 0 01.5-.5h11a.5.5 0 01.5.5v4a.5.5 0 01-.5.5H11" />
                  <path d="M3 5V1.5a.5.5 0 01.5-.5h7a.5.5 0 01.5.5V5" />
                </svg>
                Print / PDF
              </button>
            </div>
          </motion.div>
        )}

        {/* Default empty state */}
        {!r && (
          <motion.div
            key="default-empty"
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
                  strokeLinejoin="round"
                >
                  <path d="M5 8.5C5 7 6 6 8 6s3 1 3 2.5" />
                  <circle cx="8" cy="3.5" r="2" />
                  <path d="M14 11.5C14 10 15 9 17 9s3 1 3 2.5" />
                  <circle cx="17" cy="6.5" r="2" />
                  <rect x="1" y="16" width="22" height="5" rx="2" />
                </svg>
              }
              title="Paste postcodes to get started"
              description="Drop in a list from a festival event, service contacts, or program data. You'll get a full cohort profile ready for reports."
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison view */}
      {compareMode && compareA && compareB && !showSaved && (
        <CohortCompare
          cohortA={compareA}
          cohortB={compareB}
          onClose={() => {
            setCompareMode(false);
            setCompareA(null);
            setCompareB(null);
          }}
        />
      )}
    </div>
  );
}
