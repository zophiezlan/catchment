import { Card } from "./Shared";

/**
 * CohortInput — textarea with drag/drop + analyse/clear buttons.
 * Pure presentational; all state managed by parent CohortAnalyser.
 */
export default function CohortInput({
  raw,
  onRawChange,
  onAnalyse,
  onClear,
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  results,
}) {
  const r = results;
  return (
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
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        value={raw}
        onChange={(e) => onRawChange(e.target.value)}
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
          onClick={onAnalyse}
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
            onClick={onClear}
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
  );
}
