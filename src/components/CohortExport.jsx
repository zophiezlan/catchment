import { AnimatePresence, motion } from "framer-motion";
import { Card } from "./Shared";

/**
 * CohortExport — save dialog + export action buttons.
 * Pure presentational; all callbacks from parent CohortAnalyser.
 */
export default function CohortExport({
  showSaveDialog,
  onShowSaveDialog,
  storageWarning,
  saveName,
  onSaveNameChange,
  onSaveCohort,
  onCancelSave,
  saveInputRef,
  exporting,
  onExportPNG,
  onPrint,
  onShare,
}) {
  return (
    <>
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
              {storageWarning && (
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#92400e",
                    background: "#fef3c7",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-xs)",
                    marginBottom: 10,
                    border: "1px solid #fde68a",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
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
                  {storageWarning}
                </div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  ref={saveInputRef}
                  type="text"
                  value={saveName}
                  onChange={(e) => onSaveNameChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && saveName.trim())
                      onSaveCohort(saveName);
                    if (e.key === "Escape") onCancelSave();
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
                  onClick={() => onSaveCohort(saveName)}
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
                  onClick={onCancelSave}
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
          onClick={onShowSaveDialog}
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
          onClick={onExportPNG}
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
          onClick={onPrint}
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
        <button
          onClick={onShare}
          style={{
            padding: "9px 16px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid rgba(59, 130, 246, 0.25)",
            background: "rgba(59, 130, 246, 0.08)",
            color: "#3b82f6",
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
            <circle cx="10.5" cy="2.5" r="1.5" />
            <circle cx="3.5" cy="7" r="1.5" />
            <circle cx="10.5" cy="11.5" r="1.5" />
            <path d="M5 6l4-2.5M5 8l4 2.5" />
          </svg>
          Share link
        </button>
      </div>
    </>
  );
}
