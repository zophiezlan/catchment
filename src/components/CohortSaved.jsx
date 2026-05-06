import { AnimatePresence, motion } from "framer-motion";
import { Card } from "./Shared";

/**
 * CohortSaved — saved cohorts panel with compare mode.
 * Pure presentational; all state managed by parent CohortAnalyser.
 */
export default function CohortSaved({
  savedCohorts,
  showSaved,
  onToggleSaved,
  compareMode,
  onToggleCompare,
  compareA,
  compareB,
  onSelectCompare,
  onDeselectCompare,
  onLoadCohort,
  confirmDelete,
  onConfirmDelete,
  onDeleteCohort,
  onCancelDelete,
  onCompareNow,
}) {
  if (!savedCohorts.length) return null;

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button
          onClick={onToggleSaved}
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
            onClick={onToggleCompare}
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
                            if (isA) onDeselectCompare("A");
                            else if (isB) onDeselectCompare("B");
                            else onSelectCompare(c);
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
                            onClick={() => onLoadCohort(c)}
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
                                onClick={() => onDeleteCohort(c.id)}
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
                                onClick={onCancelDelete}
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
                              onClick={() => onConfirmDelete(c.id)}
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
                    onClick={onCompareNow}
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
  );
}
